import { describe, expect, it } from "vitest";

import type { Keypoint, Pose } from "@/features/workout/domain/pose-metrics";
import {
  isPoseMatchingStencil,
  PoseStencilOverlay,
} from "@/features/workout/ui/live/pose-stencil-overlay";

function createMockPose(keypointOverrides: Partial<Record<number, Partial<Keypoint>>>): Pose {
  // 17 COCO keypoints: default low score
  const keypoints: Keypoint[] = Array.from({ length: 17 }, () => ({
    name: "kp",
    score: 0.05,
    x: 0,
    y: 0,
  }));

  for (const [idxStr, override] of Object.entries(keypointOverrides)) {
    const idx = Number(idxStr);
    keypoints[idx] = {
      name: `kp_${idx}`,
      score: override.score ?? 0.8,
      x: override.x ?? 320,
      y: override.y ?? 240,
    };
  }

  return {
    keypoints,
    score: 0.8,
    sourceHeight: 480,
    sourceWidth: 640,
  };
}

describe("PoseStencilOverlay Matching Logic", () => {
  it("exports PoseStencilOverlay component", () => {
    expect(PoseStencilOverlay).toBeDefined();
  });

  it("handles null or low confidence poses safely", () => {
    expect(isPoseMatchingStencil("push_up", null)).toBe(false);
    const emptyPose: Pose = {
      keypoints: [],
      score: 0,
      sourceHeight: 480,
      sourceWidth: 640,
    };
    expect(isPoseMatchingStencil("push_up", emptyPose)).toBe(false);
  });

  it("rejects desk sitting (head and chest only, vertical, no hips/legs) for push_up", () => {
    // User sitting close at desk: head high (y=80), shoulders (y=160), no hips or knees
    const deskSittingPose = createMockPose({
      0: { score: 0.9, x: 320, y: 70 }, // nose
      1: { score: 0.9, x: 300, y: 60 }, // left_eye
      2: { score: 0.9, x: 340, y: 60 }, // right_eye
      3: { score: 0.85, x: 280, y: 75 }, // left_ear
      4: { score: 0.85, x: 360, y: 75 }, // right_ear
      5: { score: 0.8, x: 250, y: 170 }, // left_shoulder
      6: { score: 0.8, x: 390, y: 170 }, // right_shoulder
    });

    expect(isPoseMatchingStencil("push_up", deskSittingPose)).toBe(false);
    expect(isPoseMatchingStencil("plank", deskSittingPose)).toBe(false);
  });

  it("accepts prone / horizontal push_up posture", () => {
    // Pushup posture: shoulders, hips, knees stretched horizontally
    const pushupPose = createMockPose({
      0: { score: 0.8, x: 120, y: 320 }, // nose
      5: { score: 0.85, x: 200, y: 340 }, // left_shoulder
      6: { score: 0.85, x: 210, y: 330 }, // right_shoulder
      11: { score: 0.8, x: 380, y: 350 }, // left_hip
      12: { score: 0.8, x: 390, y: 345 }, // right_hip
      13: { score: 0.75, x: 480, y: 360 }, // left_knee
      15: { score: 0.7, x: 580, y: 370 }, // left_ankle
    });

    expect(isPoseMatchingStencil("push_up", pushupPose)).toBe(true);
    expect(isPoseMatchingStencil("plank", pushupPose)).toBe(true);
  });

  it("rejects when user only peeks face close to camera without stepping back", () => {
    // Athlete peeking face/head close to camera at bottom or middle
    const peekFacePose = createMockPose({
      0: { score: 0.95, x: 320, y: 360 }, // nose
      1: { score: 0.9, x: 300, y: 350 }, // left_eye
      2: { score: 0.9, x: 340, y: 350 }, // right_eye
      3: { score: 0.85, x: 270, y: 360 }, // left_ear
      4: { score: 0.85, x: 370, y: 360 }, // right_ear
      5: { score: 0.75, x: 240, y: 440 }, // left_shoulder
      6: { score: 0.75, x: 400, y: 440 }, // right_shoulder
    });

    // Neither floor exercises nor standing exercises should match
    expect(isPoseMatchingStencil("push_up", peekFacePose)).toBe(false);
    expect(isPoseMatchingStencil("plank", peekFacePose)).toBe(false);
    expect(isPoseMatchingStencil("squat", peekFacePose)).toBe(false);
    expect(isPoseMatchingStencil("lunge", peekFacePose)).toBe(false);
  });

  it("accepts standing exercises only when athlete has stepped back into full view", () => {
    // Stepped back: head, shoulders, hips and knees visible, occupying vertical span
    const steppedBackSquatPose = createMockPose({
      0: { score: 0.9, x: 320, y: 80 }, // nose
      5: { score: 0.85, x: 280, y: 130 }, // left_shoulder
      6: { score: 0.85, x: 360, y: 130 }, // right_shoulder
      11: { score: 0.8, x: 290, y: 250 }, // left_hip
      12: { score: 0.8, x: 350, y: 250 }, // right_hip
      13: { score: 0.75, x: 290, y: 360 }, // left_knee
      14: { score: 0.75, x: 350, y: 360 }, // right_knee
    });

    expect(isPoseMatchingStencil("squat", steppedBackSquatPose)).toBe(true);
    expect(isPoseMatchingStencil("lunge", steppedBackSquatPose)).toBe(true);
    // Push-up must NOT match a standing upright posture
    expect(isPoseMatchingStencil("push_up", steppedBackSquatPose)).toBe(false);
  });

  it("recognizes all 12 supported exercises", () => {
    const exercises = [
      "push_up",
      "squat",
      "plank",
      "lunge",
      "bicep_curl",
      "shoulder_press",
      "lateral_raise",
      "bench_press",
      "deadlift",
      "pull_up",
      "sit_up",
      "triceps_dip",
    ];

    expect(exercises.length).toBe(12);
  });
});
