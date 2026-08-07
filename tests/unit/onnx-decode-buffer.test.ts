

import { MODEL_IO, normaliseFrame } from "@/features/workout/domain/onnx-decode";

function frameOf(width: number, height: number, value: number) {
  const data = new Uint8ClampedArray(width * height * 4).fill(value);
  return {
    data: { data, height, width } as ImageData,
    padX: 0,
    padY: 0,
    scale: 1,
    sourceHeight: height,
    sourceWidth: width,
  };
}

describe("normaliseFrame buffer reuse", () => {
  it("writes into the supplied buffer instead of allocating", () => {
    const out = new Float32Array(2 * 2 * 3);
    const result = normaliseFrame(frameOf(2, 2, 128), out);
    // Same object identity — this is what keeps the worker off the GC treadmill.
    expect(result).toBe(out);
    expect(out[0]).toBeCloseTo((128 - MODEL_IO.mean[0]) / MODEL_IO.std[0]);
  });

  it("overwrites every slot, so a stale frame cannot bleed through", () => {
    const out = new Float32Array(2 * 2 * 3).fill(999);
    normaliseFrame(frameOf(2, 2, 0), out);
    const stale = [...out].filter((value) => value === 999);
    expect(stale).toHaveLength(0);
  });

  it("ignores a buffer of the wrong size rather than writing out of bounds", () => {
    const tooSmall = new Float32Array(3);
    const result = normaliseFrame(frameOf(2, 2, 128), tooSmall);
    expect(result).not.toBe(tooSmall);
    expect(result).toHaveLength(2 * 2 * 3);
  });

  it("still allocates when no buffer is given", () => {
    const result = normaliseFrame(frameOf(2, 2, 128));
    expect(result).toHaveLength(2 * 2 * 3);
  });
});
