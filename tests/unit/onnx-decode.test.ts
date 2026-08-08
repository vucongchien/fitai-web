import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import {
  decodeHeatmap,
  decodeSimcc,
  MODEL_IO,
  normaliseFrame,
} from "@/features/workout/domain/onnx-decode";

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
