import { describe, expect, it } from '@jest/globals';
import {
  countUnverifiedSets,
  durationState,
  durationWarning,
  isCameraVerified,
  needsEmptySessionPrompt,
  verificationNote,
  zeroLoadWarning,
} from "@/features/workout/domain/session-guards";
import type { LiveExercise, SetLogDraft } from "@/features/workout/model/live-session.types";

function exercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    exerciseId: "row",
    name: "Row",
    phase: "main",
    equipmentId: "eq-dumbbell",
    targetSets: 3,
    targetReps: 10,
    durationSeconds: 0,
    targetWeightKg: 12,
    isWeighted: true,
    restSetSec: 60,
    restExerciseSec: 90,
    targetRpe: 7,
    notes: "",
    formCues: [],
    commonMistakes: [],
    hasAiSupported: false,
    ...overrides,
  };
}

function set(overrides: Partial<SetLogDraft> = {}): SetLogDraft {
  return {
    exerciseId: "row",
    phase: "main",
    setNumber: 1,
    targetReps: 10,
    actualReps: 10,
    weightKg: 12,
    rpe: 7,
    formScore: null,
    source: "manual",
    reps: [],
    validFrameRatio: null,
    cameraAngle: "",
    loggedAt: 0,
    synced: true,
    ...overrides,
  };
}

describe("session guards", () => {
  it("escalates duration warnings at 90, 180 and 240 minutes (BR-WL-01)", () => {
    expect(durationState(45)).toBe("ok");
    expect(durationState(90)).toBe("long");
    expect(durationState(180)).toBe("very-long");
    expect(durationState(240)).toBe("auto-close");
    expect(durationWarning(45)).toBeNull();
    expect(durationWarning(95)).toContain("run long");
  });

  it("asks to cancel instead of saving an empty session", () => {
    expect(needsEmptySessionPrompt([])).toBeTruthy();
    expect(needsEmptySessionPrompt([set()])).toBeFalsy();
  });

  it("stays silent about zero load for bodyweight, warm-ups and holds", () => {
    const blank = { actualReps: 0, weightKg: 0 };
    expect(zeroLoadWarning(blank, exercise({ isWeighted: false }))).toBeNull();
    expect(zeroLoadWarning(blank, exercise({ phase: "warmup" }))).toBeNull();
    expect(zeroLoadWarning(blank, exercise({ durationSeconds: 30 }))).toBeNull();
  });

  it("warns before saving a weighted main set with no reps and no weight", () => {
    expect(zeroLoadWarning({ actualReps: 0, weightKg: 0 }, exercise())).toContain(
      "Save it anyway?",
    );
    expect(zeroLoadWarning({ actualReps: 8, weightKg: 0 }, exercise())).toBeNull();
  });

  it("only calls camera sets unverified, and only below 50% tracked frames (BR-CC-02)", () => {
    expect(isCameraVerified(set({ source: "manual", validFrameRatio: null }))).toBeTruthy();
    expect(isCameraVerified(set({ source: "camera", validFrameRatio: 0.8 }))).toBeTruthy();
    expect(isCameraVerified(set({ source: "camera", validFrameRatio: 0.5 }))).toBeTruthy();
    expect(isCameraVerified(set({ source: "camera", validFrameRatio: 0.4 }))).toBeFalsy();
  });

  it("describes unverified sets without accusatory wording", () => {
    const sets = [
      set({ source: "camera", validFrameRatio: 0.2 }),
      set({ source: "camera", validFrameRatio: 0.9 }),
    ];
    expect(countUnverifiedSets(sets)).toBe(1);
    expect(verificationNote(sets)).toBe("One set could not be verified by the camera.");
    expect(verificationNote([set()])).toBeNull();
  });
});
