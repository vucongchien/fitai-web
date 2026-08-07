/**
 * Pure ONNX I/O maths — tensor packing and keypoint decoding.
 *
 * DOM-free on purpose: this module is imported by inference.worker.ts, which has
 * no `document`. Everything here is a function from typed arrays to typed
 * arrays, which is also why it is directly unit testable (tests/unit/onnx-decode.test.ts).
 *
 * TODO(model): two of the three seams from the original engine live here now —
 * MODEL_IO's tensor names/sizes, and the choice between decodeSimcc and
 * decodeHeatmap. The third (using the detector box to crop before the pose pass)
 * belongs to inference.worker.ts, which owns the sessions.
 */

import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";

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

/**
 * Packs a frame into a planar CHW float tensor with ImageNet normalisation.
 *
 * `out` lets the caller supply a scratch buffer. At 192×256 the tensor is 576KB,
 * so allocating one per frame throws ~17MB/s of garbage at the collector during a
 * tracked set — enough GC pressure to show up as jitter in the rep counter. The
 * worker keeps a single buffer alive for the whole session and passes it here.
 * Omitting `out` allocates, which keeps the function pure for its unit tests.
 */
export function normaliseFrame(frame: LetterboxedFrame, out?: Float32Array): Float32Array {
  const { data } = frame.data;
  const pixels = frame.data.width * frame.data.height;
  const tensor = out?.length === pixels * 3 ? out : new Float32Array(pixels * 3);
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
): { x: number; y: number; score: number }[] {
  const binsX = simccX.length / keypointCount;
  const binsY = simccY.length / keypointCount;
  const points: { x: number; y: number; score: number }[] = [];

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
): { x: number; y: number; score: number }[] {
  const area = mapWidth * mapHeight;
  const points: { x: number; y: number; score: number }[] = [];
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
