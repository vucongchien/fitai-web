/// <reference lib="webworker" />

// Pose inference off main thread with ROI crop and OneEuroFilter

import { BitmapSampler, computeRoiCrop } from "@/features/workout/domain/bitmap-sampler";
import type { CroppedLetterboxedFrame, CropRect } from "@/features/workout/domain/bitmap-sampler";
import { meanBrightness, toSourceCoords } from "@/features/workout/domain/frame-sampler";
import type { MotionEngineEvent } from "@/features/workout/domain/motion-engine";
import {
  decodeHeatmap,
  decodeSimcc,
  decodeYoloV8Pose,
  MODEL_IO,
  normaliseFrame,
  normaliseFrameRgb01,
} from "@/features/workout/domain/onnx-decode";
import { PoseFilter } from "@/features/workout/domain/one-euro-filter";
import {
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  isPoseUsable,
  KEYPOINT_NAMES,
} from "@/features/workout/domain/pose-metrics";
import type { Keypoint, Pose } from "@/features/workout/domain/pose-metrics";
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
let isYoloPoseModel = false;
let activeInputWidth = MODEL_IO.inputWidth;
let activeInputHeight = MODEL_IO.inputHeight;
let activeInputName = MODEL_IO.poseInputName;

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
      // Fall through to plain fetch
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Model fetch failed: ${response.status}`);
  }
  return await response.arrayBuffer();
}

async function init(next: MotionSpec, wasmPaths: string): Promise<void> {
  console.log("[AI Worker] Initializing ONNX pose engine for exercise:", next.exerciseId);
  ort = await import("onnxruntime-web/all");
  ort.env.wasm.wasmPaths = wasmPaths;
  ort.env.wasm.numThreads = 1;

  const skeletonBuffer = await fetchModel(next.onnxSkeletonUrl);

  let usedProvider = "wasm";
  for (const ep of ["webgpu", "webgl", "wasm"] as const) {
    try {
      poseSession = await ort.InferenceSession.create(skeletonBuffer, {
        executionProviders: [ep],
      });
      usedProvider = ep;
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

  console.log(
    `[AI Worker] ONNX Pose model loaded (${isYoloPoseModel ? "YOLOv8-pose 640x640" : "RTMPose 192x256"}, EP=${usedProvider}) for:`,
    next.exerciseId,
  );
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
    const tensor = new ort.Tensor("float32", input, [
      1,
      3,
      activeInputHeight,
      activeInputWidth,
    ]);
    const output = await poseSession.run({ [activeInputName]: tensor });

    let decoded: { x: number; y: number; score: number }[] | null = null;

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
      );
      if (!decoded) {
        return null;
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

    // Map keypoints back to source image coordinates (with cropOffset if ROI was cropped)
    const rawKeypoints: Keypoint[] = decoded.map((point) => {
      const mapped = toSourceCoords(point.x, point.y, frame);
      if (frame.cropOffset) {
        mapped.x += frame.cropOffset.x;
        mapped.y += frame.cropOffset.y;
      }
      return { score: point.score, x: mapped.x, y: mapped.y };
    });

    // 1-Euro adaptive smoothing across frames (higher minCutoff & beta for responsive zero-lag tracking)
    poseFilter ??= new PoseFilter(KEYPOINT_NAMES.length, 2.5, 0.04, 1.0);
    const keypoints = poseFilter.filter(rawKeypoints, performance.now());
    prevPoseKeypoints = keypoints;

    const score = keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length;
    if (accumulator.totalFrames <= 5 || accumulator.totalFrames % 20 === 0) {
      console.log(
        `[AI Worker] Frame #${accumulator.totalFrames} inferred: score=${score.toFixed(2)} usable=${isPoseUsable({ keypoints, score })} kp5=(${Math.round(keypoints[5]?.x ?? 0)},${Math.round(keypoints[5]?.y ?? 0)})`,
      );
    }
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
  const pose = lighting === "ok" || isYoloPoseModel ? await inferPose(frame).catch(() => null) : null;
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
    // Person lost or obscured: reset ROI crop for next frame
    prevPoseKeypoints = null;
    if (calibrationLighting(meanBrightness(frame.data)) === "low") {
      darkFrames += 1;
      if (darkFrames > DARK_FRAME_LIMIT) {
        mode = "idle";
        emit({ reason: "low-light", type: "fallback" });
      }
    }
  }

  // Thin vision client sends skeleton pose to main thread.
  // Main thread streams keypoints over WebTransport/WebSocket to Go referee.
  emit({ pose, type: "pose" });
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
        prevPoseKeypoints = null;
        poseFilter?.reset();
      } else if (request.mode === "idle") {
        prevPoseKeypoints = null;
        poseFilter?.reset();
      }
      return;
    }

    case "frame": {
      try {
        // Dynamic ROI crop (Tracking-by-Pose) is only needed for small 192x256 single-person crop models (RTMPose).
        // YOLOv8-pose operates on full 640x640 letterboxed frames directly, avoiding feedback drift!
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
      poseFilter?.reset();
      post({ telemetry: summarise(accumulator), type: "telemetry" });
      return;
    }
  }
});
