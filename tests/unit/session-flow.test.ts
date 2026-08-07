import {
  buildTimeline,
  estimatedDurationMin,
  flattenPlan,
  phasesPresent,
  progressRatio,
  restSecondsAfter,
  stepIndexAfterExercise,
  stepIndexAfterPhase,
} from "@/features/workout/domain/session-flow";
import type {
  LiveExercise,
  LiveSessionPlan,
  SessionPhase,
} from "@/features/workout/model/live-session.types";

function exercise(
  id: string,
  phase: SessionPhase,
  overrides: Partial<LiveExercise> = {},
): LiveExercise {
  return {
    exerciseId: id,
    name: id,
    phase,
    equipmentId: "eq-bodyweight",
    targetSets: 2,
    targetReps: 10,
    durationSeconds: 0,
    targetWeightKg: 0,
    isWeighted: false,
    restSetSec: 60,
    restExerciseSec: 90,
    targetRpe: 6,
    notes: "",
    formCues: [],
    commonMistakes: [],
    hasAiSupported: false,
    ...overrides,
  };
}

function plan(overrides: Partial<LiveSessionPlan> = {}): LiveSessionPlan {
  return {
    sessionId: "s1",
    sessionPlanId: "s1",
    title: "Test session",
    targetRpe: 7,
    estimatedDurationMin: 0,
    warmUps: [exercise("warm", "warmup", { targetSets: 1 })],
    mainExercises: [exercise("push", "main"), exercise("row", "main")],
    coolDowns: [exercise("stretch", "cooldown", { targetSets: 1 })],
    playlists: [],
    motionSpecs: {},
    recentAvgVolumeKg: 0,
    personalRecords: {},
    durationWarnMin: 90,
    ...overrides,
  };
}

describe("session flow", () => {
  it("orders warm-up, main work, then cooldown", () => {
    expect(flattenPlan(plan()).map((item) => item.exerciseId)).toStrictEqual([
      "warm",
      "push",
      "row",
      "stretch",
    ]);
  });

  it("emits one step per prescribed set", () => {
    const timeline = buildTimeline(plan());
    // 1 warm-up set + 2 × 2 main sets + 1 cooldown set
    expect(timeline).toHaveLength(6);
    expect(timeline.map((step) => `${step.exercise.exerciseId}#${step.setNumber}`)).toStrictEqual([
      "warm#1",
      "push#1",
      "push#2",
      "row#1",
      "row#2",
      "stretch#1",
    ]);
    expect(timeline[1]!.isLastSetOfExercise).toBe(false);
    expect(timeline[2]!.isLastSetOfExercise).toBe(true);
  });

  it("treats a zero-set prescription as one set rather than dropping it", () => {
    const timeline = buildTimeline(
      plan({ warmUps: [exercise("warm", "warmup", { targetSets: 0 })] }),
    );
    expect(timeline.filter((step) => step.phase === "warmup")).toHaveLength(1);
  });

  it("reports only the phases that have exercises", () => {
    expect(phasesPresent(plan({ coolDowns: [] }))).toStrictEqual(["warmup", "main"]);
  });

  it("skips a whole phase to the first step after it", () => {
    const timeline = buildTimeline(plan());
    expect(stepIndexAfterPhase(timeline, "warmup")).toBe(1);
    expect(stepIndexAfterPhase(timeline, "main")).toBe(5);
    expect(stepIndexAfterPhase(timeline, "cooldown")).toBe(timeline.length);
  });

  it("skips the remaining sets of the current exercise", () => {
    const timeline = buildTimeline(plan());
    expect(stepIndexAfterExercise(timeline, 1)).toBe(3);
    expect(stepIndexAfterExercise(timeline, 5)).toBe(timeline.length);
  });

  it("rests between sets, but rests longer when the exercise changes", () => {
    const timeline = buildTimeline(plan());
    expect(restSecondsAfter(timeline, 1)).toBe(60); // Push#1 → push#2
    expect(restSecondsAfter(timeline, 2)).toBe(90); // Push#2 → row#1
    expect(restSecondsAfter(timeline, timeline.length - 1)).toBe(0);
  });

  it("derives progress from the real set count, not a fixed 3 per exercise", () => {
    const timeline = buildTimeline(plan());
    expect(progressRatio(0, timeline)).toBe(0);
    expect(progressRatio(3, timeline)).toBeCloseTo(0.5);
    expect(progressRatio(99, timeline)).toBe(1);
    expect(progressRatio(1, [])).toBe(0);
  });

  it("estimates duration from work plus rest", () => {
    const minutes = estimatedDurationMin(plan());
    expect(minutes).toBeGreaterThan(5);
    expect(minutes).toBeLessThan(60);
  });
});
