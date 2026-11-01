import { describe, expect, it } from "vitest";

import {
  decodeHeatmap,
  decodeSimcc,
  decodeYoloV8Pose,
  MODEL_IO,
  normaliseFrame,
  normaliseFrameRgb01,
} from "@/features/workout/domain/onnx-decode";

describe(decodeYoloV8Pose, () => {
  it("picks the anchor with highest person confidence and extracts 17 COCO keypoints", () => {
    const numChannels = 56;
    const numAnchors = 3;
    const output = new Float32Array(numChannels * numAnchors);
    // Anchor 1 has best person score = 0.92 at channel 4
    output[4 * numAnchors + 0] = 0.1;
    output[4 * numAnchors + 1] = 0.92;
    output[4 * numAnchors + 2] = 0.3;

    // Set nose (kp 0 -> channels 5, 6, 7) at anchor 1
    output[5 * numAnchors + 1] = 320;
    output[6 * numAnchors + 1] = 160;
    output[7 * numAnchors + 1] = 0.88;

    const points = decodeYoloV8Pose(output, numChannels, numAnchors, 17, 0.25);
    expect(points).not.toBeNull();
    expect(points).toHaveLength(17);
    expect(points![0]!.x).toBe(320);
    expect(points![0]!.y).toBe(160);
    expect(points![0]!.score).toBeCloseTo(0.88);
  });

  it("returns null when best person score is below threshold", () => {
    const output = new Float32Array(56 * 2);
    output[4 * 2 + 0] = 0.1;
    output[4 * 2 + 1] = 0.2;
    expect(decodeYoloV8Pose(output, 56, 2, 17, 0.25)).toBeNull();
  });
});

describe(normaliseFrameRgb01, () => {
  it("scales RGB pixel channels into [0, 1]", () => {
    const data = new Uint8ClampedArray([255, 128, 0, 255]);
    const tensor = normaliseFrameRgb01({
      data: { data, height: 1, width: 1 } as ImageData,
      padX: 0,
      padY: 0,
      scale: 1,
      sourceHeight: 1,
      sourceWidth: 1,
    });
    expect(tensor[0]).toBeCloseTo(1.0);
    expect(tensor[1]).toBeCloseTo(128 / 255);
    expect(tensor[2]).toBeCloseTo(0.0);
  });
});

describe(decodeSimcc, () => {
  it("picks the argmax bin on each axis and divides by the split ratio", () => {
    // One joint, 4 x-bins and 4 y-bins. Peak at x-bin 2, y-bin 1.
    const simccX = new Float32Array([0.1, 0.2, 0.9, 0.3]);
    const simccY = new Float32Array([0.1, 0.8, 0.2, 0.1]);
    const [joint] = decodeSimcc(simccX, simccY, 1, 2);
    expect(joint).toBeDefined();
    expect(joint!.x).toBeCloseTo(1); // Bin 2 / splitRatio 2
    expect(joint!.y).toBeCloseTo(0.5); // Bin 1 / splitRatio 2
    // Score is the weaker of the two axes, clamped to 0..1.
    expect(joint!.score).toBeCloseTo(0.8);
  });

  it("clamps a negative peak to a zero score", () => {
    const simccX = new Float32Array([-3, -5]);
    const simccY = new Float32Array([-1, -2]);
    const [joint] = decodeSimcc(simccX, simccY, 1, 2);
    expect(joint!.score).toBe(0);
  });
});

describe(decodeHeatmap, () => {
  it("maps the argmax index to x/y through the stride", () => {
    // One joint on a 3x2 map, peak at index 4 => x=1, y=1.
    const heatmap = new Float32Array([0, 0, 0, 0, 0.7, 0]);
    const [joint] = decodeHeatmap(heatmap, 1, 3, 2, 4, 8);
    expect(joint!.x).toBe(4);
    expect(joint!.y).toBe(8);
    expect(joint!.score).toBeCloseTo(0.7);
  });
});

describe(normaliseFrame, () => {
  it("produces a planar CHW tensor with ImageNet normalisation applied", () => {
    // A single mid-grey pixel.
    const data = new Uint8ClampedArray([128, 128, 128, 255]);
    const tensor = normaliseFrame({
      data: { data, height: 1, width: 1 } as ImageData,
      padX: 0,
      padY: 0,
      scale: 1,
      sourceHeight: 1,
      sourceWidth: 1,
    });
    expect(tensor).toHaveLength(3);
    expect(tensor[0]).toBeCloseTo((128 - MODEL_IO.mean[0]) / MODEL_IO.std[0]);
    expect(tensor[1]).toBeCloseTo((128 - MODEL_IO.mean[1]) / MODEL_IO.std[1]);
    expect(tensor[2]).toBeCloseTo((128 - MODEL_IO.mean[2]) / MODEL_IO.std[2]);
  });
});
