

import { letterboxLayout, toSourceCoords } from "@/features/workout/domain/frame-sampler";

describe(letterboxLayout, () => {
  it("pads on the x axis when the source is taller than the target", () => {
    // 480x640 source into a 192x256 box: both axes scale by 0.4, no padding.
    const layout = letterboxLayout(480, 640, 192, 256);
    expect(layout.scale).toBeCloseTo(0.4);
    expect(layout.padX).toBeCloseTo(0);
    expect(layout.padY).toBeCloseTo(0);
  });

  it("pads on the y axis when the source is wider than the target", () => {
    // 640x480 into 192x256: scale is limited by width (0.3), so 256-144=112 of
    // Vertical padding, split evenly.
    const layout = letterboxLayout(640, 480, 192, 256);
    expect(layout.scale).toBeCloseTo(0.3);
    expect(layout.drawWidth).toBeCloseTo(192);
    expect(layout.drawHeight).toBeCloseTo(144);
    expect(layout.padX).toBeCloseTo(0);
    expect(layout.padY).toBeCloseTo(56);
  });

  it("round-trips a point through toSourceCoords", () => {
    const layout = letterboxLayout(640, 480, 192, 256);
    // A point at the centre of the drawn region maps back to the source centre.
    const centre = toSourceCoords(96, 56 + 72, layout);
    expect(centre.x).toBeCloseTo(320);
    expect(centre.y).toBeCloseTo(240);
  });

  it("returns a zero scale for an empty source rather than NaN", () => {
    const layout = letterboxLayout(0, 0, 192, 256);
    expect(layout.scale).toBe(0);
  });
});
