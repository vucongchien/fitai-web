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

  it("skips filtering low confidence keypoints when no prior memory exists", () => {
    const poseFilter = new PoseFilter(17);
    const kps = Array.from({ length: 17 }, (_, i) => ({
      x: 100,
      y: 100,
      score: i === 0 ? 0.1 : 0.9,
    }));

    const filtered = poseFilter.filter(kps, 1000);
    expect(filtered[0]?.x).toBe(100);
  });

  it("coasts on last valid position during brief <160ms occlusion instead of jumping to raw noise", () => {
    const poseFilter = new PoseFilter(17, 1.0, 0.007, 1.0);
    const frame1 = Array.from({ length: 17 }, () => ({ x: 200, y: 300, score: 0.92 }));
    poseFilter.filter(frame1, 1000);

    // Frame 2 (40ms later): Wrist (9) gets briefly occluded by dumbbell plate and jumps to raw outlier (10, 10) with score=0.05
    const frame2 = Array.from({ length: 17 }, () => ({ x: 200, y: 300, score: 0.92 }));
    frame2[9] = { x: 10, y: 10, score: 0.05 };
    const filtered2 = poseFilter.filter(frame2, 1040);

    expect(filtered2[9]?.x).toBe(200);
    expect(filtered2[9]?.y).toBe(300);
    expect(filtered2[9]?.score).toBeGreaterThan(0.5);

    // Frame 3 (300ms later, exceeding maxCoastMs=160ms): no longer coasts
    const filtered3 = poseFilter.filter(frame2, 1300);
    expect(filtered3[9]?.x).toBe(10);
    expect(filtered3[9]?.score).toBe(0.05);
  });

  it("unswaps left/right knees in side view when YOLO flips their labels mid-movement", () => {
    const poseFilter = new PoseFilter(17, 1.0, 0.007, 1.0);
    const makeSidePose = (leftKneeX: number, rightKneeX: number) => {
      const kps = Array.from({ length: 17 }, () => ({ x: 300, y: 300, score: 0.95 }));
      // Side profile: shoulders (5, 6) overlapped at x=300, y=150; hips (11, 12) at x=300, y=300 -> torsoLen=150, span=0
      kps[5] = { x: 300, y: 150, score: 0.95 };
      kps[6] = { x: 305, y: 150, score: 0.95 };
      kps[11] = { x: 300, y: 300, score: 0.95 };
      kps[12] = { x: 305, y: 300, score: 0.95 };
      kps[13] = { x: leftKneeX, y: 420, score: 0.95 };
      kps[14] = { x: rightKneeX, y: 420, score: 0.95 };
      return kps;
    };

    // Frame 1: Left knee at x=240, Right knee at x=360
    poseFilter.filter(makeSidePose(240, 360), 1000);

    // Frame 2: YOLO swaps Left and Right labels (reports 13 at 360, 14 at 240)
    const swappedOut = poseFilter.filter(makeSidePose(360, 240), 1033);
    expect(swappedOut[13]?.x).toBeCloseTo(240, 0);
    expect(swappedOut[14]?.x).toBeCloseTo(360, 0);
  });
});
