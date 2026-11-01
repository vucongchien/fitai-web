import { describe, expect, it } from "vitest";

import { OneEuroFilter, PoseFilter } from "@/features/workout/domain/one-euro-filter";

describe("OneEuroFilter", () => {
  it("initializes on first sample and produces identical value", () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    const v = filter.filter(100, 1000);
    expect(v).toBe(100);
  });

  it("smooths noisy high-frequency jitter at low speed", () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    filter.filter(100, 1000);

    // Jitter around 100 at 30 FPS (~33ms steps)
    const val1 = filter.filter(102, 1033);
    const val2 = filter.filter(98, 1066);

    // Filter should attenuate small jitter
    expect(Math.abs(val1 - 100)).toBeLessThan(2);
    expect(Math.abs(val2 - 100)).toBeLessThan(2);
  });

  it("adapts quickly with low latency during rapid movement", () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    filter.filter(100, 1000);

    // Large fast step to 200 within 33ms (high velocity)
    const fastVal = filter.filter(200, 1033);
    // Beta adaptation should boost cutoff frequency so value jumps significantly toward 200
    expect(fastVal).toBeGreaterThan(150);
  });

  it("resets state properly", () => {
    const filter = new OneEuroFilter();
    filter.filter(100, 1000);
    filter.reset();
    const restarted = filter.filter(50, 2000);
    expect(restarted).toBe(50);
  });
});

describe("PoseFilter", () => {
  it("filters 17 keypoints correctly", () => {
    const poseFilter = new PoseFilter(17, 1.0, 0.007, 1.0);
    const kps = Array.from({ length: 17 }, (_, i) => ({
      x: i * 10,
      y: i * 20,
      score: 0.9,
    }));

    const smoothed = poseFilter.filter(kps, 1000);
    expect(smoothed).toHaveLength(17);
    expect(smoothed[5]?.x).toBe(50);
    expect(smoothed[5]?.y).toBe(100);
  });

  it("skips filtering low confidence keypoints", () => {
    const poseFilter = new PoseFilter(17);
    const kps = Array.from({ length: 17 }, (_, i) => ({
      x: 100,
      y: 100,
      score: i === 0 ? 0.1 : 0.9,
    }));

    const filtered = poseFilter.filter(kps, 1000);
    expect(filtered[0]?.x).toBe(100);
  });
});
