import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import {
  KEYPOINT_NAMES,
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  createRepCounter,
  evaluateRules,
  feedRepCounter,
  formScore,
  isPoseUsable,
  jointAngle,
  romPercent,
} from "@/features/workout/domain/pose-metrics";
import type { Keypoint, Pose } from "@/features/workout/domain/pose-metrics";
import type { FormRule, RomRange } from "@/features/workout/model/live-session.types";

function pose(points: Partial<Record<(typeof KEYPOINT_NAMES)[number], [number, number]>>): Pose {
  const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name) => {
    const point = points[name];
    return point ? { x: point[0], y: point[1], score: 0.9 } : { x: 0, y: 0, score: 0 };
  });
  return { keypoints, score: 0.9 };
}

/** Feed a whole ROM trace through a fresh counter and collect what it produced. */
function run(roms: number[]) {
  let state = createRepCounter();
  const completed: { counted: boolean; romPercentage: number }[] = [];
  for (const rom of roms) {
    const tick = feedRepCounter(state, rom);
    state = tick.state;
    if (tick.completedRep) {
      completed.push(tick.completedRep);
    }
  }
  return { state, completed };
}

const upright = {
  left_shoulder: [100, 100] as [number, number],
  right_shoulder: [140, 100] as [number, number],
  left_hip: [100, 200] as [number, number],
  right_hip: [140, 200] as [number, number],
  left_knee: [100, 300] as [number, number],
  left_ankle: [100, 400] as [number, number],
};

describe("joint angles", () => {
  it("measures a right angle at the vertex", () => {
    expect(jointAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
  });

  it("measures a straight line as 180 degrees", () => {
    expect(jointAngle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(180);
  });

  it("returns 0 for degenerate input", () => {
    expect(jointAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
  });
});

describe("rOM", () => {
  const flexion: RomRange = {
    joints: ["left_shoulder", "left_elbow", "left_wrist"],
    startDeg: 170,
    endDeg: 90,
  };
  const extension: RomRange = {
    joints: ["left_shoulder", "left_elbow", "left_wrist"],
    startDeg: 80,
    endDeg: 170,
  };

  it("measures travel for a flexing movement such as a push-up", () => {
    expect(romPercent(170, flexion)).toBe(0);
    expect(romPercent(130, flexion)).toBeCloseTo(50);
    expect(romPercent(90, flexion)).toBe(100);
    expect(romPercent(70, flexion)).toBe(100);
  });

  it("measures travel for an extending movement such as a press", () => {
    expect(romPercent(80, extension)).toBe(0);
    expect(romPercent(125, extension)).toBeCloseTo(50);
    expect(romPercent(170, extension)).toBe(100);
  });
});

describe("rep counter (BR-CC-01)", () => {
  it("counts a rep that reaches at least 70% ROM", () => {
    const { state, completed } = run([0, 30, 60, 85, 60, 30, 5]);
    expect(state.count).toBe(1);
    expect(completed).toHaveLength(1);
    expect(completed[0]!.counted).toBe(true);
    expect(completed[0]!.romPercentage).toBe(85);
  });

  it("reports but does not count a partial rep below 70% ROM", () => {
    const { state, completed } = run([0, 30, 55, 30, 5]);
    expect(state.count).toBe(0);
    expect(completed).toHaveLength(1);
    expect(completed[0]!.counted).toBe(false);
  });

  it("does not double count jitter around the threshold", () => {
    const { state } = run([0, 45, 42, 46, 90, 45, 44, 46, 10]);
    expect(state.count).toBe(1);
  });

  it("counts several clean reps in a row", () => {
    const { state } = run([0, 50, 95, 10, 50, 95, 10, 50, 95, 5]);
    expect(state.count).toBe(3);
    expect(state.completedRoms).toHaveLength(3);
  });
});

describe("form rules and score", () => {
  const hipSag: FormRule = {
    code: "hip-sag",
    message: "Lift the hips.",
    severity: 2,
    joints: ["left_shoulder", "left_hip", "left_knee"],
    kind: "angle-below",
    thresholdDeg: 155,
  };

  it("flags a violated rule", () => {
    const sagging = pose({ ...upright, left_hip: [140, 190] });
    expect(evaluateRules([hipSag], sagging)).toStrictEqual(["hip-sag"]);
  });

  it("stays quiet when the pose is aligned", () => {
    expect(evaluateRules([hipSag], pose(upright))).toStrictEqual([]);
  });

  it("skips rules whose keypoints are missing rather than firing falsely", () => {
    expect(evaluateRules([hipSag], pose({ left_shoulder: [100, 100] }))).toStrictEqual([]);
  });

  it("scores clean full-range work near 100 and sloppy work lower", () => {
    const clean = formScore({ averageRom: 95, errorCount: 0, repCount: 10, secondsPerRep: 2.5 });
    const sloppy = formScore({ averageRom: 60, errorCount: 8, repCount: 10, secondsPerRep: 0.8 });
    expect(clean).toBeGreaterThan(90);
    expect(sloppy).toBeLessThan(clean);
    expect(sloppy).toBeGreaterThanOrEqual(0);
  });

  it("keeps the score inside 0-100 for extreme input", () => {
    expect(formScore({ averageRom: 200, errorCount: 0, repCount: 1 })).toBeLessThanOrEqual(100);
    expect(formScore({ averageRom: -50, errorCount: 100, repCount: 1 })).toBeGreaterThanOrEqual(0);
  });
});

describe("calibration", () => {
  it("recognises a usable pose", () => {
    expect(isPoseUsable(pose(upright))).toBe(true);
    expect(isPoseUsable(pose({ left_shoulder: [1, 1] }))).toBe(false);
  });

  it("asks the user to step closer or step back based on body coverage", () => {
    expect(calibrationDistance(pose(upright), 1000)).toBe("too-far");
    expect(calibrationDistance(pose(upright), 400)).toBe("ok");
    expect(calibrationDistance(pose(upright), 320)).toBe("too-close");
    expect(calibrationDistance(pose({ left_shoulder: [1, 1] }), 400)).toBe("unknown");
  });

  it("treats a dark frame as unusable light", () => {
    expect(calibrationLighting(20)).toBe("low");
    expect(calibrationLighting(120)).toBe("ok");
    expect(calibrationHint("ok", "low")).toContain("dark");
    expect(calibrationHint("too-far", "ok")).toContain("closer");
    expect(calibrationHint("ok", "ok")).toContain("good");
  });
});
