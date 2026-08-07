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
  evaluateRules,
  isPoseUsable,
  KEYPOINT_NAMES,
  type Keypoint,
  type Pose,
  romPercent,
} from "@/features/workout/domain/pose-metrics";
import {
  type Accumulator,
  feedCounter,
  freshAccumulator,
  summarise,
} from "@/features/workout/domain/set-telemetry";
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
      if (hit) return await hit.arrayBuffer();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Model fetch failed: ${response.status}`);
      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    } catch {
      // Fall through to a plain fetch (private mode, quota, opaque response).
    }
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Model fetch failed: ${response.status}`);
  return await response.arrayBuffer();
}

/** WebGPU when the device offers it, WASM otherwise. */
function executionProviders(): string[] {
  return "gpu" in navigator ? ["webgpu", "wasm"] : ["wasm"];
}

async function init(next: MotionSpec, wasmPaths: string): Promise<void> {
  spec = next;
  ort = await import("onnxruntime-web");
  ort.env.wasm.wasmPaths = wasmPaths;
  // Single-threaded: the app does not set COOP/COEP, so SharedArrayBuffer — and
  // therefore WASM threading — is unavailable. Asking for more threads than the
  // environment allows makes ORT warn on every session create.
  ort.env.wasm.numThreads = 1;

  const options = { executionProviders: executionProviders() };
  poseSession = await ort.InferenceSession.create(await fetchModel(next.onnxSkeletonUrl), options);
  sampler = new BitmapSampler(MODEL_IO.inputWidth, MODEL_IO.inputHeight);

  // `spec.onnxDetectorUrl` is deliberately NOT fetched. The old engine downloaded
  // the person detector and built a session for it, but its runDetector() was a
  // stub that returned null — so every session paid a multi-megabyte download and
  // an ORT session allocation for a model that never ran once.
  //
  // Without it the pose model sees the whole frame, which is fine while the
  // athlete fills most of it (Assumption-01).
  //
  // TODO(model): when the detector export is published, fetch it here, run it in
  // inferPose, and crop to its box before the pose pass. Add the fetch back at
  // the same time — not before.
}

async function inferPose(frame: LetterboxedFrame): Promise<Pose | null> {
  if (!ort || !poseSession) return null;

  // Reuse one 576KB buffer for the whole session rather than allocating per
  // frame. inferPose is never re-entered — the main thread keeps exactly one
  // frame in flight — so a single scratch buffer is safe.
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

  let decoded: Array<{ x: number; y: number; score: number }>;
  if (simccX && simccY) {
    decoded = decodeSimcc(
      simccX.data as Float32Array,
      simccY.data as Float32Array,
      KEYPOINT_NAMES.length,
    );
  } else {
    // Heatmap export: [1, K, H, W].
    const single = Object.values(output)[0];
    if (!single) return null;
    const dims = single.dims;
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
  const score = keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length;
  return { keypoints, score };
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
  if (!spec) return;
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
  emit({ pose, type: "pose" });
  if (!pose || !isPoseUsable(pose)) return;

  accumulator.validFrames += 1;

  for (const code of evaluateRules(spec.rules, pose)) {
    accumulator.errorCodes.push(code);
    accumulator.pendingErrors.add(code);
    const rule = spec.rules.find((entry) => entry.code === code);
    if (rule) {
      emit({ code, message: rule.message, severity: rule.severity, type: "form-error" });
    }
  }

  const angle = angleOfJoints(pose, spec.romRange.joints);
  if (angle !== null) {
    const tick = feedCounter(accumulator, romPercent(angle, spec.romRange));
    if (tick) emit(tick);
  }
}

scope.addEventListener("message", async (message: MessageEvent<InferenceRequest>) => {
  const request = message.data;
  switch (request.type) {
    case "init":
      try {
        await init(request.spec, request.wasmPaths);
        post({ type: "ready" });
      } catch (cause) {
        post({
          message: cause instanceof Error ? cause.message : "Pose model unavailable",
          type: "init-failed",
        });
      }
      return;

    case "mode":
      mode = request.mode;
      if (request.mode === "set") {
        accumulator = freshAccumulator();
        darkFrames = 0;
      }
      return;

    case "frame": {
      const frame = sampler?.grab(request.bitmap) ?? null;
      if (frame) {
        if (mode === "calibration") await runCalibration(frame);
        else if (mode === "set") await runSetFrame(frame);
      } else {
        // grab() already closed the bitmap; nothing to release here.
        request.bitmap.close?.();
      }
      // Always acknowledge, including on the error paths above — the main thread
      // is blocked on this and would otherwise stop sending frames entirely.
      post({ type: "frame-done" });
      return;
    }

    case "stop-set":
      mode = "idle";
      post({ telemetry: summarise(accumulator), type: "telemetry" });
      return;
  }
});
