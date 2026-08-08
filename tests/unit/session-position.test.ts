import { describe, expect, it } from '@jest/globals';
import { buildTimeline, totalExerciseCount } from "@/features/workout/domain/session-flow";
import type { LiveExercise, LiveSessionPlan } from "@/features/workout/model/live-session.types";

function exercise(id: string, phase: LiveExercise["phase"], sets: number): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 0,
    equipmentId: "eq-bodyweight",
    exerciseId: id,
    formCues: [],
    hasAiSupported: false,
    isWeighted: false,
    name: id,
    notes: "",
    phase,
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 10,
    targetRpe: 6,
    targetSets: sets,
    targetWeightKg: 0,
  };
}

const plan = {
  coolDowns: [exercise("c1", "cooldown", 1)],
  durationWarnMin: 90,
  estimatedDurationMin: 30,
  mainExercises: [exercise("m1", "main", 2), exercise("m2", "main", 1)],
  motionSpecs: {},
  personalRecords: {},
  playlists: [],
  recentAvgVolumeKg: 0,
  sessionId: "s1",
  sessionPlanId: "sp1",
  targetRpe: 6,
  title: "Test",
  warmUps: [exercise("w1", "warmup", 1)],
} satisfies LiveSessionPlan;

describe(totalExerciseCount, () => {
  it("counts every exercise across all three phases", () => {
    expect(totalExerciseCount(plan)).toBe(4);
  });
});

describe("sessionStep.sessionPosition", () => {
  it("numbers exercises continuously across phases, not per phase", () => {
    const timeline = buildTimeline(plan);
    const positions = timeline.map((step) => `${step.exercise.exerciseId}:${step.sessionPosition}`);

    expect(positions).toStrictEqual(["w1:1", "m1:2", "m1:2", "m2:3", "c1:4"]);
  });

  it("keeps the existing phase-relative exercisePosition intact", () => {
    const timeline = buildTimeline(plan);
    const m2 = timeline.find((step) => step.exercise.exerciseId === "m2");

    expect(m2?.exercisePosition).toBe(2);
    expect(m2?.sessionPosition).toBe(3);
  });
});
