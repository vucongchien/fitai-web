import { describe, expect, it } from '@jest/globals';


import {
  averageFormScore,
  averageRpe,
  epley1RM,
  estimateCalories,
  findNewPersonalRecords,
  isAnomalousLoad,
  isNewPersonalRecord,
  sessionVolumeKg,
  setVolumeKg,
} from "@/features/workout/domain/training-load";
import type { SetLogDraft } from "@/features/workout/model/live-session.types";

function set(overrides: Partial<SetLogDraft> = {}): SetLogDraft {
  return {
    exerciseId: "push",
    phase: "main",
    setNumber: 1,
    targetReps: 10,
    actualReps: 10,
    weightKg: 20,
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

describe("training load", () => {
  it("computes volume as reps × weight and treats bodyweight as no external load", () => {
    expect(setVolumeKg({ actualReps: 10, weightKg: 20 })).toBe(200);
    expect(setVolumeKg({ actualReps: 10, weightKg: 0 })).toBe(0);
    expect(setVolumeKg({ actualReps: -3, weightKg: 20 })).toBe(0);
    expect(sessionVolumeKg([set(), set({ weightKg: 10 })])).toBe(300);
  });

  it("flags load above 250% of the recent average (BR-WL-02)", () => {
    expect(isAnomalousLoad(2600, 1000)).toBeTruthy();
    expect(isAnomalousLoad(2500, 1000)).toBeFalsy();
    expect(isAnomalousLoad(900, 1000)).toBeFalsy();
  });

  it("never flags an anomaly without a usable baseline", () => {
    expect(isAnomalousLoad(5000, 0)).toBeFalsy();
  });

  it("estimates 1RM with Epley and ignores bodyweight sets", () => {
    expect(epley1RM(100, 0)).toBe(0);
    expect(epley1RM(0, 10)).toBe(0);
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it("recognises a personal record only when it beats the stored best", () => {
    expect(isNewPersonalRecord(133, 120)).toBeTruthy();
    expect(isNewPersonalRecord(120, 120)).toBeFalsy();
    expect(isNewPersonalRecord(0, 0)).toBeFalsy();
  });

  it("lists exercises that set a new record today", () => {
    const records = findNewPersonalRecords(
      [
        set({ exerciseId: "row", weightKg: 30, actualReps: 8 }),
        set({ exerciseId: "push", weightKg: 5 }),
      ],
      { row: 30, push: 100 },
    );
    expect(records.map((record) => record.exerciseId)).toStrictEqual(["row"]);
  });

  it("averages RPE over scored sets only, and returns null when all are N/A", () => {
    expect(averageRpe([set({ rpe: 6 }), set({ rpe: 8 }), set({ rpe: null })])).toBe(7);
    expect(averageRpe([set({ rpe: null })])).toBeNull();
  });

  it("returns no average form score when every set was manual (BR-WL-03)", () => {
    expect(averageFormScore([set(), set()])).toBeNull();
    expect(averageFormScore([set({ formScore: 80 }), set({ formScore: 90 })])).toBe(85);
  });

  it("estimates calories from duration and volume", () => {
    expect(estimateCalories(30, 1000)).toBe(200);
    expect(estimateCalories(0, 0)).toBe(0);
  });
});
