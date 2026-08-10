/// <reference lib="webworker" />

/**
 * Pose inference, off the main thread.
 *
 * Everything that used to run inside OnnxMotionEngine's requestAnimationFrame
 * loop lives here: model loading, tensor packing, ORT inference, keypoint
 * decoding, rule evaluation and set accumulation. The main thread now only
 * grabs an ImageBitmap and posts it; the UI thread never touches a pixel.
 *
 * There is no rAF loop in here on purpose. The main thread sends one frame,
 * waits for `frame-done`, then sends the next (see inference-protocol.ts). That
 * bounds the queue at one frame on any device, however slow.
 *
 * Constraint-02: pixels never leave this worker. Only keypoints are posted back.
 */

import { BitmapSampler } from "@/features/workout/domain/bitmap-sampler";
import { meanBrightness, toSourceCoords } from "@/features/workout/domain/frame-sampler";
import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";
import type { MotionEngineEvent } from "@/features/workout/domain/motion-engine";
import {
  decodeHeatmap,
  decodeSimcc,
  MODEL_IO,
  normaliseFrame,
} from "@/features/workout/domain/onnx-decode";
import {
  angleOfJoints,
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  detectPhaseFromRuleJson,
  evaluateRules,
  isPoseUsable,
  KEYPOINT_NAMES,
  romPercent,
} from "@/features/workout/domain/pose-metrics";
import type { GenericRuleFile, Keypoint, Pose } from "@/features/workout/domain/pose-metrics";
import { feedCounter, freshAccumulator, summarise } from "@/features/workout/domain/set-telemetry";
import type { Accumulator } from "@/features/workout/domain/set-telemetry";
import type {
  InferenceMode,
  InferenceRequest,
  InferenceResponse,
} from "@/features/workout/model/inference-protocol";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

/** Models are tens of MB — cache them so a set never waits on a re-download. */
const MODEL_CACHE = "fitai-motion-models-v1";

/** ~2s of darkness at 30fps hands the set to manual logging (ux-flow-spec §5.3). */
const DARK_FRAME_LIMIT = 60;

const scope = self as unknown as DedicatedWorkerGlobalScope;

let ort: OrtModule | null = null;
let poseSession: OrtSession | null = null;
let sampler: BitmapSampler | null = null;
let spec: MotionSpec | null = null;
let mode: InferenceMode = "idle";
let accumulator: Accumulator = freshAccumulator();
let darkFrames = 0;
/** Scratch tensor reused across frames — see inferPose. */
let inputBuffer: Float32Array | null = null;
let prevPoseKeypoints: Keypoint[] | null = null;

function post(response: InferenceResponse): void {
  scope.postMessage(response);
}

function emit(event: MotionEngineEvent): void {
  post({ event, type: "event" });
}

async function fetchModel(url: string): Promise<ArrayBuffer> {
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(MODEL_CACHE);
      const hit = await cache.match(url);
      if (hit) {
        console.log("[AI Worker Cache] Hit cached ONNX model:", url);
        return await hit.arrayBuffer();
      }
      console.log("[AI Worker Cache] Fetching new ONNX model from network:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Model fetch failed: ${response.status}`);
      }
      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    } catch {
      // Fall through to a plain fetch (private mode, quota, opaque response).
    }
  }
  console.log("[AI Worker] Plain fetching ONNX model:", url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Model fetch failed: ${response.status}`);
  }
  return await response.arrayBuffer();
}

/** Always use stable single-threaded WASM for cross-platform reliability. */
function executionProviders(): string[] {
  return ["wasm"];
}

async function init(next: MotionSpec, wasmPaths: string): Promise<void> {
  spec = next;
  console.log("[AI Worker] Initializing ONNX pose engine for exercise:", next.exerciseId);
  ort = await import("onnxruntime-web");
  ort.env.wasm.wasmPaths = wasmPaths;
  ort.env.wasm.numThreads = 1;

  const options = { executionProviders: executionProviders() };

  // Load all 4 resources in parallel (Detector, Skeleton, Rules JSON, Dialogue JSON)
  const [detectorRes, skeletonBuffer, rulesRes, dialogueRes] = await Promise.all([
    next.onnxDetectorUrl ? fetchModel(next.onnxDetectorUrl).catch(() => null) : Promise.resolve(null),
    fetchModel(next.onnxSkeletonUrl),
    next.localRulesUrl ? fetch(next.localRulesUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
    next.dialogueEngineUrl ? fetch(next.dialogueEngineUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
  ]);

  if (rulesRes) {
    const generic = spec as unknown as GenericRuleFile;
    if (rulesRes.phase_detection) {
      generic.phase_detection = rulesRes.phase_detection;
    }
    if (rulesRes.rules && Array.isArray(rulesRes.rules)) {
      spec.rules = rulesRes.rules;
    }
    if (rulesRes.romRange) {
      spec.romRange = rulesRes.romRange;
    }
    if (rulesRes.cueCooldownSec) {
      spec.cueCooldownSec = { ...spec.cueCooldownSec, ...rulesRes.cueCooldownSec };
    }
  }

  if (dialogueRes) {
    if (dialogueRes.cues && Array.isArray(dialogueRes.cues)) {
      spec.cues = dialogueRes.cues;
    }
  }

  poseSession = await ort.InferenceSession.create(skeletonBuffer, options);
  sampler = new BitmapSampler(MODEL_IO.inputWidth, MODEL_IO.inputHeight);

  console.log("[AI Worker] All 4 AI files (Detector, Skeleton, Rules, Dialogue) loaded successfully!", {
    detectorLoaded: Boolean(detectorRes),
    dialogueCuesCount: spec.cues.length,
    exerciseId: next.exerciseId,
    rulesCount: spec.rules.length,
  });
}

async function inferPose(frame: LetterboxedFrame): Promise<Pose | null> {
  if (!ort || !poseSession) {
    return null;
  }

  try {
    // Reuse one 576KB buffer for the whole session rather than allocating per
    // Frame. inferPose is never re-entered — the main thread keeps exactly one
    // Frame in flight — so a single scratch buffer is safe.
    inputBuffer ??= new Float32Array(MODEL_IO.inputWidth * MODEL_IO.inputHeight * 3);
    const input = normaliseFrame(frame, inputBuffer);
    const tensor = new ort.Tensor("float32", input, [
      1,
      3,
      MODEL_IO.inputHeight,
      MODEL_IO.inputWidth,
    ]);
    const output = await poseSession.run({ [MODEL_IO.poseInputName]: tensor });

    const [xName, yName] = MODEL_IO.poseOutputNames;
    const simccX = xName ? output[xName] : undefined;
    const simccY = yName ? output[yName] : undefined;

    let decoded: { x: number; y: number; score: number }[];
    if (simccX && simccY) {
      decoded = decodeSimcc(
        simccX.data as Float32Array,
        simccY.data as Float32Array,
        KEYPOINT_NAMES.length,
      );
    } else {
      // Heatmap export: [1, K, H, W].
      const single = Object.values(output)[0];
      if (!single) {
        return null;
      }
      const { dims } = single;
      const mapHeight = Number(dims[2] ?? 64);
      const mapWidth = Number(dims[3] ?? 48);
      decoded = decodeHeatmap(
        single.data as Float32Array,
        KEYPOINT_NAMES.length,
        mapWidth,
        mapHeight,
        MODEL_IO.inputWidth / mapWidth,
        MODEL_IO.inputHeight / mapHeight,
      );
    }

    const keypoints: Keypoint[] = decoded.map((point) => {
      const mapped = toSourceCoords(point.x, point.y, frame);
      return { score: point.score, x: mapped.x, y: mapped.y };
    });

    // Exponential Moving Average (EMA) smoothing across frames to eliminate jitter
    if (prevPoseKeypoints && prevPoseKeypoints.length === keypoints.length) {
      const SMOOTHING = 0.65;
      for (let i = 0; i < keypoints.length; i += 1) {
        const kNew = keypoints[i]!;
        const kOld = prevPoseKeypoints[i]!;
        const dist = Math.hypot(kNew.x - kOld.x, kNew.y - kOld.y);
        // Only smooth if movement is continuous (small step < 80px), otherwise snap to new position
        if (dist < 80) {
          kNew.x = SMOOTHING * kNew.x + (1 - SMOOTHING) * kOld.x;
          kNew.y = SMOOTHING * kNew.y + (1 - SMOOTHING) * kOld.y;
          kNew.score = SMOOTHING * kNew.score + (1 - SMOOTHING) * kOld.score;
        }
      }
    }
    prevPoseKeypoints = keypoints;

    const score = keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length;
    return {
      keypoints,
      score,
      sourceHeight: frame.sourceHeight,
      sourceWidth: frame.sourceWidth,
    };
  } catch (error) {
    console.warn("[AI Worker] inferPose execution error:", error);
    return null;
  }
}

async function runCalibration(frame: LetterboxedFrame): Promise<void> {
  const lighting = calibrationLighting(meanBrightness(frame.data));
  const pose = lighting === "ok" ? await inferPose(frame).catch(() => null) : null;
  const distance = pose ? calibrationDistance(pose, frame.sourceHeight) : ("unknown" as const);
  emit({ pose, type: "pose" });
  emit({
    distance,
    hint: calibrationHint(distance, lighting),
    lighting,
    ready: lighting === "ok" && distance === "ok",
    type: "calibration",
  });
}

async function runSetFrame(frame: LetterboxedFrame): Promise<void> {
  if (!spec) {
    return;
  }
  accumulator.totalFrames += 1;

  if (calibrationLighting(meanBrightness(frame.data)) === "low") {
    darkFrames += 1;
    if (darkFrames > DARK_FRAME_LIMIT) {
      mode = "idle";
      emit({ reason: "low-light", type: "fallback" });
    }
    return;
  }

  darkFrames = 0;
  const pose = await inferPose(frame).catch(() => null);
  if (accumulator.totalFrames % 30 === 1) {
    const validCount = pose?.keypoints.filter((k) => k.score >= 0.3).length ?? 0;
    console.log(
      `[AI Worker Inference] Frame #${accumulator.totalFrames}: Pose tracked = ${Boolean(pose)}, valid keypoints = ${validCount}/17`,
    );
  }
  emit({ pose, type: "pose" });
  if (!pose || !isPoseUsable(pose)) {
    return;
  }

  accumulator.validFrames += 1;

  if (spec.rules && Array.isArray(spec.rules)) {
    for (const code of evaluateRules(spec.rules, pose)) {
      accumulator.errorCodes.push(code);
      accumulator.pendingErrors.add(code);
      const rule = spec.rules.find((entry) => entry.code === code);
      if (rule) {
        emit({ code, message: rule.message, severity: rule.severity, type: "form-error" });
      }
    }
  }

  const genericRule = spec as unknown as GenericRuleFile;
  const { phase: detectedPhase, startDeg, endDeg, metricName } = detectPhaseFromRuleJson(genericRule, pose);

  const joints: [string, string, string] = (spec.romRange?.joints as [string, string, string]) ?? ["hip", "knee", "ankle"];
  const detectedAngle = angleOfJoints(pose, joints) ?? angleOfJoints(pose, ["hip", "knee", "ankle"]);

  // If joint angle cannot be calculated (e.g. pose not detected yet), rom is 0%, do NOT trigger false target_reached!
  const angle = Math.round(detectedAngle ?? startDeg);
  const rom = detectedAngle !== null ? Math.round(romPercent(angle, { endDeg, joints, startDeg })) : 0;
  const tick = detectedAngle !== null ? feedCounter(accumulator, rom) : null;

  // Use detectedPhase ("always" for Plank/timed, or FSM phase for rep exercises)
  const currentPhase = detectedPhase === "always" ? "always" : accumulator.counter.phase;

  emit({
    type: "metrics",
    angle,
    endDeg,
    frameIndex: accumulator.totalFrames,
    metricName,
    phase: currentPhase,
    repCount: accumulator.counter.count,
    rom,
    startDeg,
  });

  if (tick) {
    emit(tick);
  }
}

scope.addEventListener("message", async (message: MessageEvent<InferenceRequest>) => {
  const request = message.data;
  switch (request.type) {
    case "init": {
      try {
        await init(request.spec, request.wasmPaths);
        post({ type: "ready" });
      } catch (error) {
        post({
          message: error instanceof Error ? error.message : "Pose model unavailable",
          type: "init-failed",
        });
      }
      return;
    }

    case "mode": {
      mode = request.mode;
      if (request.mode === "set") {
        accumulator = freshAccumulator();
        darkFrames = 0;
      }
      return;
    }

    case "frame": {
      try {
        const frame = sampler?.grab(request.bitmap) ?? null;
        if (frame) {
          if (mode === "calibration") {
            await runCalibration(frame);
          } else {
            if (mode === "idle") {
              mode = "set";
            }
            await runSetFrame(frame);
          }
        } else {
          // Grab() already closed the bitmap; nothing to release here.
          request.bitmap.close?.();
        }
      } catch (err) {
        console.error("[AI Worker] Frame inference error:", err);
      } finally {
        // Always acknowledge, including on the error paths above — the main thread
        // Is blocked on this and would otherwise stop sending frames entirely.
        post({ type: "frame-done" });
      }
      return;
    }

    case "stop-set": {
      mode = "idle";
      post({ telemetry: summarise(accumulator), type: "telemetry" });
      return;
    }
  }
});
