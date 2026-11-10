/// <reference lib="webworker" />

// Pose inference and Edge biomechanical referee off main thread

import { BitmapSampler, computeRoiCrop } from "@/features/workout/domain/bitmap-sampler";
import type { CroppedLetterboxedFrame, CropRect } from "@/features/workout/domain/bitmap-sampler";
import { EdgeRefereeSession } from "@/features/workout/domain/edge-referee";
import { meanBrightness, toSourceCoords } from "@/features/workout/domain/frame-sampler";
import {
  resolveDialogueAssetUrl,
  resolveRulesAssetUrl,
} from "@/features/workout/domain/motion-asset-url";
import type { MotionEngineEvent } from "@/features/workout/domain/motion-engine";
import { PoseFilter } from "@/features/workout/domain/one-euro-filter";
import {
  decodeHeatmap,
  decodeSimcc,
  decodeYoloV8Pose,
  type DecodedPoseKeypoints,
  MODEL_IO,
  normaliseFrame,
  normaliseFrameRgb01,
} from "@/features/workout/domain/onnx-decode";
import {
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  isPoseUsable,
  KEYPOINT_NAMES,
} from "@/features/workout/domain/pose-metrics";
import type { Keypoint, Pose } from "@/features/workout/domain/pose-metrics";
import { parseMotionRule } from "@/features/workout/domain/rule-parser";
import { freshAccumulator, summarise } from "@/features/workout/domain/set-telemetry";
import type { Accumulator } from "@/features/workout/domain/set-telemetry";
import type {
  InferenceMode,
  InferenceRequest,
  InferenceResponse,
} from "@/features/workout/model/inference-protocol";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

const MODEL_CACHE = "fitai-motion-models-v1";
const DARK_FRAME_LIMIT = 60;

const scope = self as unknown as DedicatedWorkerGlobalScope;

let ort: OrtModule | null = null;
let poseSession: OrtSession | null = null;
let sampler: BitmapSampler | null = null;
let poseFilter: PoseFilter | null = null;
let mode: InferenceMode = "idle";
let accumulator: Accumulator = freshAccumulator();
let darkFrames = 0;
let inputBuffer: Float32Array | null = null;
let prevPoseKeypoints: Keypoint[] | null = null;
let prevActorBox: { cx: number; cy: number; w: number; h: number } | null = null;
let isYoloPoseModel = false;
let activeInputWidth = MODEL_IO.inputWidth;
let activeInputHeight = MODEL_IO.inputHeight;
let activeInputName = MODEL_IO.poseInputName;

let activeSpec: MotionSpec | null = null;
let edgeReferee: EdgeRefereeSession | null = null;
let refereeInitPromise: Promise<void> | null = null;
const jsonAssetCache = new Map<string, Record<string, any>>();

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
        return await hit.arrayBuffer();
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Model fetch failed: ${response.status}`);
      }
      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    } catch {
      // Fall through to plain fetch
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Model fetch failed: ${response.status}`);
  }
  return await response.arrayBuffer();
}

async function fetchJsonAsset(url: string): Promise<Record<string, any> | null> {
  if (!url) {
    return null;
  }
  const cached = jsonAssetCache.get(url);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as Record<string, any>;
    if (data && typeof data === "object") {
      jsonAssetCache.set(url, data);
      return data;
    }
  } catch {
    // Ignore asset fetch failure
  }
  return null;
}

async function initEdgeReferee(spec: MotionSpec | null): Promise<void> {
  if (!spec || !spec.localRulesUrl) {
    edgeReferee = null;
    return;
  }
  const rulesUrl = resolveRulesAssetUrl(spec.localRulesUrl, spec.exerciseId);
  const dialogueUrl = spec.dialogueEngineUrl
    ? resolveDialogueAssetUrl(spec.dialogueEngineUrl, spec.exerciseId)
    : "";

  const [rawRule, rawDialogue] = await Promise.all([
    fetchJsonAsset(rulesUrl),
    dialogueUrl ? fetchJsonAsset(dialogueUrl) : Promise.resolve(null),
  ]);

  if (!rawRule) {
    edgeReferee = null;
    return;
  }

  const motionRule = parseMotionRule(
    spec.exerciseId,
    rawRule,
    rawDialogue,
    spec.recommendedCameraAngle || "side",
  );
  edgeReferee = new EdgeRefereeSession(motionRule, spec.recommendedCameraAngle || "side");
}

async function init(next: MotionSpec, wasmPaths: string): Promise<void> {
  activeSpec = next;
  ort = await import("onnxruntime-web/all");
  ort.env.wasm.wasmPaths = wasmPaths;
  ort.env.wasm.numThreads = 1;

  const skeletonBuffer = await fetchModel(next.onnxSkeletonUrl);

  for (const ep of ["webgpu", "webgl", "wasm"] as const) {
    try {
      poseSession = await ort.InferenceSession.create(skeletonBuffer, {
        executionProviders: [ep],
      });
      break;
    } catch {
      // Fallback to next execution provider
    }
  }
  if (!poseSession) {
    poseSession = await ort.InferenceSession.create(skeletonBuffer, {
      executionProviders: ["wasm"],
    });
  }

  const firstInputName = poseSession.inputNames?.[0] ?? MODEL_IO.poseInputName;
  activeInputName = firstInputName;
  isYoloPoseModel =
    firstInputName === MODEL_IO.yoloInputName ||
    poseSession.outputNames?.includes("output0") ||
    next.onnxSkeletonUrl.toLowerCase().includes("yolo");

  activeInputWidth = isYoloPoseModel ? MODEL_IO.yoloInputWidth : MODEL_IO.inputWidth;
  activeInputHeight = isYoloPoseModel ? MODEL_IO.yoloInputHeight : MODEL_IO.inputHeight;
  inputBuffer = null;

  sampler = new BitmapSampler(activeInputWidth, activeInputHeight);
  poseFilter = new PoseFilter(KEYPOINT_NAMES.length, 2.5, 0.04, 1.0);
}

async function inferPose(frame: CroppedLetterboxedFrame): Promise<Pose | null> {
  if (!ort || !poseSession) {
    return null;
  }

  try {
    inputBuffer ??= new Float32Array(activeInputWidth * activeInputHeight * 3);
    const input = isYoloPoseModel
      ? normaliseFrameRgb01(frame, inputBuffer)
      : normaliseFrame(frame, inputBuffer);
    const tensor = new ort.Tensor("float32", input, [1, 3, activeInputHeight, activeInputWidth]);
    const output = await poseSession.run({ [activeInputName]: tensor });

    let decoded: DecodedPoseKeypoints | null = null;

    if (isYoloPoseModel) {
      const yoloOut = output["output0"] ?? Object.values(output)[0];
      if (!yoloOut) {
        return null;
      }
      const numChannels = Number(yoloOut.dims?.[1] ?? 56);
      const numAnchors = Number(yoloOut.dims?.[2] ?? 8400);
      decoded = decodeYoloV8Pose(
        yoloOut.data as Float32Array,
        numChannels,
        numAnchors,
        KEYPOINT_NAMES.length,
        0.25,
        prevActorBox,
      );
      if (!decoded) {
        prevActorBox = null;
        return null;
      }
      if (decoded.box) {
        prevActorBox = decoded.box;
      }
    } else {
      const [xName, yName] = MODEL_IO.poseOutputNames;
      const simccX = xName ? output[xName] : undefined;
      const simccY = yName ? output[yName] : undefined;

      if (simccX && simccY) {
        decoded = decodeSimcc(
          simccX.data as Float32Array,
          simccY.data as Float32Array,
          KEYPOINT_NAMES.length,
        );
      } else {
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
          activeInputWidth / mapWidth,
          activeInputHeight / mapHeight,
        );
      }
    }

    const rawKeypoints: Keypoint[] = decoded.map((point) => {
      const mapped = toSourceCoords(point.x, point.y, frame);
      if (frame.cropOffset) {
        mapped.x += frame.cropOffset.x;
        mapped.y += frame.cropOffset.y;
      }
      return { score: point.score, x: mapped.x, y: mapped.y };
    });

    poseFilter ??= new PoseFilter(KEYPOINT_NAMES.length, 2.5, 0.04, 1.0);
    const keypoints = poseFilter.filter(rawKeypoints, performance.now());
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

async function runCalibration(frame: CroppedLetterboxedFrame): Promise<void> {
  const lighting = calibrationLighting(meanBrightness(frame.data));
  const pose =
    lighting === "ok" || isYoloPoseModel ? await inferPose(frame).catch(() => null) : null;
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

async function runSetFrame(frame: CroppedLetterboxedFrame): Promise<void> {
  accumulator.totalFrames += 1;

  if (calibrationLighting(meanBrightness(frame.data)) === "low" && !isYoloPoseModel) {
    darkFrames += 1;
    if (darkFrames > DARK_FRAME_LIMIT) {
      mode = "idle";
      emit({ reason: "low-light", type: "fallback" });
    }
    return;
  }

  darkFrames = 0;
  const pose = await inferPose(frame).catch(() => null);

  if (pose && isPoseUsable(pose)) {
    accumulator.validFrames += 1;
  } else {
    prevPoseKeypoints = null;
    if (calibrationLighting(meanBrightness(frame.data)) === "low") {
      darkFrames += 1;
      if (darkFrames > DARK_FRAME_LIMIT) {
        mode = "idle";
        emit({ reason: "low-light", type: "fallback" });
      }
    }
  }

  emit({ pose, type: "pose" });

  if (refereeInitPromise) {
    await refereeInitPromise;
  }

  if (edgeReferee && pose && isPoseUsable(pose)) {
    const update = edgeReferee.processKeypoints(
      pose.keypoints,
      performance.now(),
      activeSpec?.recommendedCameraAngle,
      frame.sourceWidth,
      frame.sourceHeight,
      true,
    );

    for (const err of update.newFormErrors) {
      emit({
        code: err.code,
        message: err.message,
        metric: err.metric,
        severity: err.severity,
        source: err.source,
        type: "form-error",
      });
    }

    if (update.repCompleted) {
      emit({
        count: update.repCompleted.count,
        counted: update.repCompleted.counted,
        romPercentage: update.repCompleted.romPercentage,
        type: "rep",
      });
    }

    emit({
      angle: Math.round(update.currentAngle),
      detectedErrors: update.detectedErrors,
      endDeg: update.endDeg,
      frameIndex: update.frameIndex,
      metricName: update.metricName,
      phase: update.repPhase.toLowerCase(),
      repCount: update.repCount,
      rom: update.rom,
      startDeg: update.startDeg,
      type: "metrics",
    });
  }
}

async function handleMessage(request: InferenceRequest): Promise<void> {
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
      if (request.spec) {
        activeSpec = request.spec;
      }
      if (request.mode === "set") {
        accumulator = freshAccumulator();
        darkFrames = 0;
        prevPoseKeypoints = null;
        prevActorBox = null;
        poseFilter?.reset();
        refereeInitPromise = initEdgeReferee(activeSpec);
      } else if (request.mode === "idle") {
        prevPoseKeypoints = null;
        prevActorBox = null;
        poseFilter?.reset();
        edgeReferee = null;
        refereeInitPromise = null;
      }
      return;
    }

    case "frame": {
      try {
        let crop: CropRect | null = null;
        if (mode === "set" && prevPoseKeypoints && !isYoloPoseModel) {
          crop = computeRoiCrop(prevPoseKeypoints, request.bitmap.width, request.bitmap.height);
        }

        const frame = sampler?.grab(request.bitmap, crop) ?? null;
        if (frame) {
          if (mode === "calibration") {
            await runCalibration(frame);
          } else if (mode === "set") {
            await runSetFrame(frame);
          }
        } else {
          request.bitmap.close?.();
        }
      } catch (err) {
        console.error("[AI Worker] Frame inference error:", err);
      } finally {
        post({ type: "frame-done" });
      }
      return;
    }

    case "stop-set": {
      mode = "idle";
      prevPoseKeypoints = null;
      prevActorBox = null;
      poseFilter?.reset();
      if (refereeInitPromise) {
        await refereeInitPromise.catch(() => {});
        refereeInitPromise = null;
      }
      const baseTelemetry = summarise(accumulator);
      const telemetry = edgeReferee
        ? edgeReferee.buildSetTelemetry(baseTelemetry.validFrameRatio)
        : baseTelemetry;
      edgeReferee = null;
      post({ telemetry, type: "telemetry" });
      return;
    }
  }
}

let messageQueue = Promise.resolve();

scope.addEventListener("message", (message: MessageEvent<InferenceRequest>) => {
  const request = message.data;
  messageQueue = messageQueue
    .then(() => handleMessage(request))
    .catch((err) => {
      console.error("[AI Worker] Unhandled message queue error:", err);
    });
});
