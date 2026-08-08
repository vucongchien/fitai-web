import { it, afterEach, describe, expect, beforeEach } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from '@jest/globals';
import { act, renderHook } from "@testing-library/react";

import type { LiveExercise, LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import type { syncWorkoutLogs } from "@/features/workout/server/workout-actions";

vi.mock<typeof import("@/features/workout/server/workout-actions")>(
  import("@/features/workout/server/workout-actions"),
  () => ({
    syncWorkoutLogs: vi.fn<typeof syncWorkoutLogs>(async () => ({ syncedSetNumbers: [] })),
  }),
);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    breathingCue: "",
    commonMistakes: [],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: [],
    hasAiSupported: false,
    instructions: "",
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 60,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 2,
    targetWeightKg: 0,
    ...overrides,
  };
}

function makePlan(exercise: LiveExercise): LiveSessionPlan {
  return {
    coolDowns: [],
    durationWarnMin: 90,
    estimatedDurationMin: 20,
    mainExercises: [exercise],
    motionSpecs: {},
    personalRecords: {},
    playlists: [],
    recentAvgVolumeKg: 0,
    sessionId: "session-timers",
    sessionPlanId: "plan-timers",
    targetRpe: 7,
    title: "Timer session",
    warmUps: [],
  };
}

function logSet(exercise: LiveExercise, setNumber: number) {
  return {
    actualReps: exercise.targetReps,
    cameraAngle: "",
    exerciseId: exercise.exerciseId,
    formScore: null,
    phase: exercise.phase,
    reps: [],
    rpe: null,
    setNumber,
    source: "manual" as const,
    targetReps: exercise.targetReps,
    validFrameRatio: null,
    weightKg: 0,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});

describe("useLiveSession set clock", () => {
  it("extends a timed hold and grows the ring's denominator together", () => {
    const exercise = makeExercise({ durationSeconds: 30 });
    const { result } = renderHook(() => useLiveSession(makePlan(exercise)));

    act(() => result.current.actions.startSet(30));
    expect(result.current.setLeft).toBe(30);
    expect(result.current.setTotal).toBe(30);

    act(() => result.current.actions.addSetTime(10));

    expect(result.current.setLeft).toBe(40);
    expect(result.current.setTotal).toBe(40);
    // The arc divides one by the other, so it must stay inside the circle.
    expect(result.current.setLeft / result.current.setTotal).toBeLessThanOrEqual(1);
  });

  it("no-ops for a rep-based set, which has no clock to extend", () => {
    const exercise = makeExercise({ durationSeconds: 0, targetReps: 10 });
    const { result } = renderHook(() => useLiveSession(makePlan(exercise)));

    act(() => result.current.actions.startSet(0));
    expect(result.current.setLeft).toBe(0);
    expect(result.current.setTotal).toBe(0);

    act(() => result.current.actions.addSetTime(10));

    expect(result.current.setLeft).toBe(0);
    expect(result.current.setTotal).toBe(0);
  });
});

describe("useLiveSession rest clock", () => {
  it("grows both the remaining rest and its denominator", () => {
    const exercise = makeExercise({ restSetSec: 60, targetSets: 2 });
    const { result } = renderHook(() => useLiveSession(makePlan(exercise)));

    act(() => result.current.actions.startSet(30));
    act(() => result.current.actions.saveSet(logSet(exercise, 1)));

    expect(result.current.status).toBe("resting");
    expect(result.current.restLeft).toBe(60);
    expect(result.current.restTotal).toBe(60);

    act(() => result.current.actions.addRest(10));

    expect(result.current.restLeft).toBe(70);
    expect(result.current.restTotal).toBe(70);
    expect(result.current.restLeft / result.current.restTotal).toBeLessThanOrEqual(1);
  });
});
