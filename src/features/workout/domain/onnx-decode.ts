// Pure ONNX I/O maths — tensor packing and keypoint decoding.

import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";

// Model I/O configuration for YOLOv8-pose and RTMPose
export const MODEL_IO = {
  /** Pose model input tensor (RTMPose default). */
  poseInputName: "input",
  /** YOLOv8-pose input tensor. */
  yoloInputName: "images",
  /** SimCC heads on RTMPose exports; a single "output" tensor on heatmap exports. */
  poseOutputNames: ["simcc_x", "simcc_y"],
  /** Model input resolution (width × height) for RTMPose default. */
  inputWidth: 192,
  inputHeight: 256,
  /** YOLOv8-pose input resolution (width × height). */
  yoloInputWidth: 640,
  yoloInputHeight: 640,
  /** ImageNet normalisation, as used by mmpose. */
  mean: [123.675, 116.28, 103.53] as const,
  std: [58.395, 57.12, 57.375] as const,
  /** Detector input tensor and size. */
  detectorInputName: "images",
  detectorSize: 320,
};

// Packs a frame into planar CHW float tensor with ImageNet normalisation
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

// Packs a frame into planar CHW RGB float tensor [0, 1] for YOLOv8
export function normaliseFrameRgb01(frame: LetterboxedFrame, out?: Float32Array): Float32Array {
  const { data } = frame.data;
  const pixels = frame.data.width * frame.data.height;
  const tensor = out?.length === pixels * 3 ? out : new Float32Array(pixels * 3);
  const inv255 = 1 / 255;
  for (let i = 0; i < pixels; i += 1) {
    const offset = i * 4;
    tensor[i] = data[offset]! * inv255;
    tensor[pixels + i] = data[offset + 1]! * inv255;
    tensor[pixels * 2 + i] = data[offset + 2]! * inv255;
  }
  return tensor;
}

// Decodes YOLOv8-pose output tensor [1, 56, N] anchors
export function decodeYoloV8Pose(
  output: Float32Array,
  numChannels = 56,
  numAnchors = 8400,
  keypointCount = 17,
  minPersonScore = 0.25,
): { x: number; y: number; score: number }[] | null {
  let bestAnchor = -1;
  let bestScore = -Infinity;
  const scoreRowOffset = 4 * numAnchors;

  for (let a = 0; a < numAnchors; a += 1) {
    const score = output[scoreRowOffset + a]!;
    if (score > bestScore) {
      bestScore = score;
      bestAnchor = a;
    }
  }

  if (bestAnchor < 0 || bestScore < minPersonScore) {
    return null;
  }

  const points: { x: number; y: number; score: number }[] = [];
  for (let k = 0; k < keypointCount; k += 1) {
    const baseChannel = 5 + k * 3;
    if (baseChannel + 2 >= numChannels) {
      break;
    }
    const x = output[baseChannel * numAnchors + bestAnchor]!;
    const y = output[(baseChannel + 1) * numAnchors + bestAnchor]!;
    const conf = output[(baseChannel + 2) * numAnchors + bestAnchor]!;
    points.push({
      score: Math.min(1, Math.max(0, conf)),
      x,
      y,
    });
  }
  return points;
}

// SimCC decode: two 1-D classification maps per joint (x and y)
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
