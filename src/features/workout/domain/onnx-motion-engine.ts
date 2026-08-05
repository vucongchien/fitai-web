/**
 * Real pose tracking with onnxruntime-web.
 *
 * The models are served from S3 and reach us through
 * WorkoutExecutionService.GetMotionSpecification:
 *   - onnxDetectorUrl  person detector (crop the athlete out of the frame)
 *   - onnxSkeletonUrl  mmpose / RTMPose top-down pose model, COCO-17 output
 *
 * Everything around the model — frame sampling, letterboxing, ROM, rep counting,
 * rule evaluation, Form Score — is already final and unit tested (pose-metrics.ts).
 * What is still parameterised is the model's own I/O contract, because the exact
 * export is not published yet. Those three spots are marked `TODO(model)` below
 * and are the only edits needed when the real .onnx files land:
 *
 *   1. MODEL_IO — tensor names and input size of the shipped export.
 *   2. decodeSimcc / decodeHeatmap — pick the head the export actually uses.
 *   3. runDetector — wire the detector output box into the pose crop.
 *
 * Constraint-02 is respected either way: inference runs on-device, and only joint
 * coordinates ever leave the browser.
 */

import {
  FrameSampler,
  type LetterboxedFrame,
  meanBrightness,
  toSourceCoords,
} from "@/features/workout/domain/frame-sampler";
import {
  type MotionEngine,
  type MotionEngineContext,
  type MotionEventHandler,
  type SetTelemetry,
} from "@/features/workout/domain/motion-engine";
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
import type { MotionSpec } from "@/features/workout/model/live-session.types";

/**
 * TODO(model): confirm against the shipped export (`python -m onnxruntime.tools
 * .check_onnx_model_mobile_usability` or netron). RTMPose-m 256×192 is the
 * assumed default.
 */
export const MODEL_IO = {
  /** Pose model input tensor. */
  poseInputName: "input",
  /** SimCC heads on RTMPose exports; a single "output" tensor on heatmap exports. */
  poseOutputNames: ["simcc_x", "simcc_y"],
  /** Model input resolution (width × height). */
  inputWidth: 192,
  inputHeight: 256,
  /** ImageNet normalisation, as used by mmpose. */
  mean: [123.675, 116.28, 103.53] as const,
  std: [58.395, 57.12, 57.375] as const,
  /** Detector input tensor and size. */
  detectorInputName: "images",
  detectorSize: 320,
};

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

/** Models are tens of MB — cache them so a set never waits on a re-download. */
const MODEL_CACHE = "fitai-motion-models-v1";

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
  const hasWebGpu = typeof navigator !== "undefined" && "gpu" in navigator;
  return hasWebGpu ? ["webgpu", "wasm"] : ["wasm"];
}

export function normaliseFrame(frame: LetterboxedFrame): Float32Array {
  const data = frame.data.data;
  const pixels = frame.data.width * frame.data.height;
  const tensor = new Float32Array(pixels * 3);
  for (let i = 0; i < pixels; i += 1) {
    const offset = i * 4;
    tensor[i] = (data[offset]! - MODEL_IO.mean[0]) / MODEL_IO.std[0];
    tensor[pixels + i] = (data[offset + 1]! - MODEL_IO.mean[1]) / MODEL_IO.std[1];
    tensor[pixels * 2 + i] = (data[offset + 2]! - MODEL_IO.mean[2]) / MODEL_IO.std[2];
  }
  return tensor;
}

/**
 * SimCC decode: two 1-D classification maps per joint (x and y).
 * TODO(model): verify the split dimensions and the simcc_split_ratio of the export.
 */
export function decodeSimcc(
  simccX: Float32Array,
  simccY: Float32Array,
  keypointCount: number,
  splitRatio = 2,
): Array<{ x: number; y: number; score: number }> {
  const binsX = simccX.length / keypointCount;
  const binsY = simccY.length / keypointCount;
  const points: Array<{ x: number; y: number; score: number }> = [];

  for (let joint = 0; joint < keypointCount; joint += 1) {
    let bestX = 0;
    let bestXScore = -Infinity;
    for (let bin = 0; bin < binsX; bin += 1) {
      const value = simccX[joint * binsX + bin]!;
      if (value > bestXScore) {
        bestXScore = value;
        bestX = bin;
      }
    }
    let bestY = 0;
    let bestYScore = -Infinity;
    for (let bin = 0; bin < binsY; bin += 1) {
      const value = simccY[joint * binsY + bin]!;
      if (value > bestYScore) {
        bestYScore = value;
        bestY = bin;
      }
    }
    points.push({
      score: Math.min(1, Math.max(0, Math.min(bestXScore, bestYScore))),
      x: bestX / splitRatio,
      y: bestY / splitRatio,
    });
  }
  return points;
}

/** Heatmap decode, for exports with a single [1, K, H, W] output. */
export function decodeHeatmap(
  heatmap: Float32Array,
  keypointCount: number,
  mapWidth: number,
  mapHeight: number,
  strideX: number,
  strideY: number,
): Array<{ x: number; y: number; score: number }> {
  const area = mapWidth * mapHeight;
  const points: Array<{ x: number; y: number; score: number }> = [];
  for (let joint = 0; joint < keypointCount; joint += 1) {
    let best = -Infinity;
    let bestIndex = 0;
    for (let i = 0; i < area; i += 1) {
      const value = heatmap[joint * area + i]!;
      if (value > best) {
        best = value;
        bestIndex = i;
      }
    }
    points.push({
      score: Math.min(1, Math.max(0, best)),
      x: (bestIndex % mapWidth) * strideX,
      y: Math.floor(bestIndex / mapWidth) * strideY,
    });
  }
  return points;
}

export class OnnxMotionEngine implements MotionEngine {
  readonly kind = "onnx" as const;

  private ort: OrtModule | null = null;
  private poseSession: OrtSession | null = null;
  private detectorSession: OrtSession | null = null;
  private sampler: FrameSampler | null = null;
  private spec: MotionSpec | null = null;

  private rafId: number | null = null;
  private accumulator: Accumulator = freshAccumulator();
  private tracking = false;

  async prepare(context: MotionEngineContext): Promise<void> {
    if (!context.video) throw new Error("OnnxMotionEngine needs a video element");
    if (!context.spec) throw new Error("OnnxMotionEngine needs a motion specification");
    this.spec = context.spec;

    this.ort = await import("onnxruntime-web");
    const options = { executionProviders: executionProviders() };

    const [poseModel, detectorModel] = await Promise.all([
      fetchModel(context.spec.onnxSkeletonUrl),
      fetchModel(context.spec.onnxDetectorUrl).catch(() => null),
    ]);

    this.poseSession = await this.ort.InferenceSession.create(poseModel, options);
    // The detector is optional: without it we run the pose model on the whole
    // frame, which is fine while the athlete fills most of it (Assumption-01).
    if (detectorModel) {
      this.detectorSession = await this.ort.InferenceSession.create(detectorModel, options).catch(
        () => null,
      );
    }

    this.sampler = new FrameSampler(context.video, MODEL_IO.inputWidth, MODEL_IO.inputHeight);
  }

  /** TODO(model): use the detector box to crop before the pose pass. */
  private async runDetector(_tensor: Float32Array): Promise<null> {
    return null;
  }

  private async inferPose(frame: LetterboxedFrame): Promise<Pose | null> {
    const ort = this.ort;
    const session = this.poseSession;
    if (!ort || !session) return null;

    const input = normaliseFrame(frame);
    if (this.detectorSession) await this.runDetector(input);

    const tensor = new ort.Tensor("float32", input, [
      1,
      3,
      MODEL_IO.inputHeight,
      MODEL_IO.inputWidth,
    ]);
    const output = await session.run({ [MODEL_IO.poseInputName]: tensor });

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

  startCalibration(onEvent: MotionEventHandler): void {
    this.stopLoop();
    const loop = async () => {
      const frame = this.sampler?.grab();
      if (frame) {
        const lighting = calibrationLighting(meanBrightness(frame.data));
        let pose: Pose | null = null;
        if (lighting === "ok") {
          pose = await this.inferPose(frame).catch(() => null);
        }
        const distance = pose
          ? calibrationDistance(pose, frame.sourceHeight)
          : ("unknown" as const);
        onEvent({ type: "pose", pose });
        onEvent({
          distance,
          hint: calibrationHint(distance, lighting),
          lighting,
          ready: lighting === "ok" && distance === "ok",
          type: "calibration",
        });
      }
      this.rafId = requestAnimationFrame(() => void loop());
    };
    void loop();
  }

  stopCalibration(): void {
    this.stopLoop();
  }

  startSet(onEvent: MotionEventHandler): void {
    this.stopLoop();
    this.accumulator = freshAccumulator();
    this.tracking = true;
    const spec = this.spec;
    if (!spec) return;

    let darkFrames = 0;

    const loop = async () => {
      if (!this.tracking) return;
      const frame = this.sampler?.grab();
      if (frame) {
        const accumulator = this.accumulator;
        accumulator.totalFrames += 1;

        if (calibrationLighting(meanBrightness(frame.data)) === "low") {
          darkFrames += 1;
          // ~2s of darkness: hand the set to manual logging rather than pretend
          // to track (ux-flow-spec §5.3 fallback).
          if (darkFrames > 60) {
            this.tracking = false;
            onEvent({ reason: "low-light", type: "fallback" });
            return;
          }
        } else {
          darkFrames = 0;
          const pose = await this.inferPose(frame).catch(() => null);
          onEvent({ pose, type: "pose" });

          if (pose && isPoseUsable(pose)) {
            accumulator.validFrames += 1;

            for (const code of evaluateRules(spec.rules, pose)) {
              accumulator.errorCodes.push(code);
              accumulator.pendingErrors.add(code);
              const rule = spec.rules.find((entry) => entry.code === code);
              if (rule) {
                onEvent({
                  code,
                  message: rule.message,
                  severity: rule.severity,
                  type: "form-error",
                });
              }
            }

            const angle = angleOfJoints(pose, spec.romRange.joints);
            if (angle !== null) {
              const tick = feedCounter(accumulator, romPercent(angle, spec.romRange));
              if (tick) onEvent(tick);
            }
          }
        }
      }
      this.rafId = requestAnimationFrame(() => void loop());
    };
    void loop();
  }

  stopSet(): SetTelemetry {
    this.tracking = false;
    this.stopLoop();
    return summarise(this.accumulator);
  }

  dispose(): void {
    this.tracking = false;
    this.stopLoop();
    this.sampler?.dispose();
    this.sampler = null;
    void this.poseSession?.release?.();
    void this.detectorSession?.release?.();
    this.poseSession = null;
    this.detectorSession = null;
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

