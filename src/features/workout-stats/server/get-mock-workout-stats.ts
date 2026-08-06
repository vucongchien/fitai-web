import { MOCK_TODAY } from "@/features/nutrition/server/get-mock-nutrition-data";
import { adaptWorkoutStatsData } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type {
  PrescriptionRow,
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import { SESSION_PLAN_STATUS } from "@/shared/api/bff/aggregate/workout-adherence";

/** Epoch seconds for 12:00Z on a given August 2026 day. */
function august2026(day: number) {
  return Math.floor(Date.UTC(2026, 7, day, 12) / 1000);
}

/**
 * A prescription whose parts sum to roughly `minutes`, shaped like `WorkoutPrescription`.
 * The mapper does the real arithmetic; this only supplies plausible wire values.
 */
function prescription(mainExercises: number, minutes: number): PrescriptionRow {
  // Work + rest per set, spread evenly across the main exercises.
  const perExerciseSec = Math.round((minutes * 60) / mainExercises);
  const sets = 3;

  return {
    coolDowns: [],
    mainExercises: Array.from({ length: mainExercises }, () => ({
      durationSeconds: Math.round(perExerciseSec / sets) - 45,
      restExerciseSec: 0,
      restSetSec: 45,
      targetSets: sets,
    })),
    warmUps: [],
  };
}

/**
 * Mock wire payloads shaped like `SessionPlan` and `WorkoutSessionSummary`, run through the
 * real mapper so mock and live paths behave identically.
 *
 * Week of Mon 3 Aug – Sun 9 Aug 2026, with today Thu 6 Aug.
 */
export function getMockSessionPlans(): SessionPlanRow[] {
  return [
    {
      prescription: prescription(5, 38),
      scheduledDate: { day: 3, month: 8, year: 2026 },
      sessionPlanId: "lower-foundation",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Quads", "Glutes"],
    },
    {
      prescription: prescription(6, 42),
      scheduledDate: { day: 5, month: 8, year: 2026 },
      sessionPlanId: "upper-control",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Chest", "Shoulders", "Core"],
    },
    {
      prescription: prescription(6, 45),
      scheduledDate: { day: 6, month: 8, year: 2026 },
      sessionPlanId: "posterior-chain",
      slotTime: "18:00",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Hamstrings", "Back"],
    },
    {
      scheduledDate: { day: 8, month: 8, year: 2026 },
      sessionPlanId: "full-body-consolidate",
      slotTime: "10:00",
      status: SESSION_PLAN_STATUS.PENDING,
      targetMuscleGroups: ["Full body"],
    },
    // Previous week, so the Month range has more to aggregate than the current week.
    {
      scheduledDate: { day: 29, month: 7, year: 2026 },
      sessionPlanId: "week1-lower",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Quads"],
    },
    {
      scheduledDate: { day: 31, month: 7, year: 2026 },
      sessionPlanId: "week1-upper",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.SKIPPED,
      targetMuscleGroups: ["Back"],
    },
  ];
}

/** Epoch seconds for 12:00Z on a given July 2026 day. */
function july2026(day: number) {
  return Math.floor(Date.UTC(2026, 6, day, 12) / 1000);
}

/**
 * Four weeks of completed sessions, so the volume trend has a real shape: a build across
 * the first three weeks, then the current week still in progress.
 */
export function getMockSessionHistory(): SessionHistoryRow[] {
  return [
    // Week of Mon 13 Jul.
    {
      averageFormScore: 0.78,
      date: { seconds: july2026(13) },
      sessionId: "hist-w-3-a",
      totalSets: 12,
      totalVolume: 1680,
    },
    {
      averageFormScore: 0.8,
      date: { seconds: july2026(16) },
      sessionId: "hist-w-3-b",
      totalSets: 13,
      totalVolume: 1740,
    },

    // Week of Mon 20 Jul.
    {
      averageFormScore: 0.82,
      date: { seconds: july2026(20) },
      sessionId: "hist-w-2-a",
      totalSets: 14,
      totalVolume: 1960,
    },
    {
      averageFormScore: 0.84,
      date: { seconds: july2026(22) },
      sessionId: "hist-w-2-b",
      totalSets: 15,
      totalVolume: 2100,
    },

    // Week of Mon 27 Jul.
    {
      averageFormScore: 0.81,
      date: { seconds: july2026(29) },
      sessionId: "hist-week1-lower",
      totalSets: 14,
      totalVolume: 2020,
    },
    {
      averageFormScore: 0.85,
      date: { seconds: july2026(31) },
      sessionId: "hist-w-1-b",
      totalSets: 16,
      totalVolume: 2380,
    },

    // Current week, Mon 3 Aug — still in progress.
    {
      averageFormScore: 0.86,
      date: { seconds: august2026(3) },
      sessionId: "hist-lower-foundation",
      totalSets: 16,
      totalVolume: 2480,
    },
    {
      averageFormScore: 0.9,
      date: { seconds: august2026(5) },
      sessionId: "hist-upper-control",
      totalSets: 18,
      totalVolume: 2960,
    },
    {
      averageFormScore: 0.88,
      date: { seconds: august2026(6) },
      sessionId: "hist-posterior-chain",
      totalSets: 17,
      totalVolume: 2740,
    },
  ];
}

export function getMockWorkoutStatsData(): WorkoutStatsData {
  return adaptWorkoutStatsData(getMockSessionPlans(), getMockSessionHistory(), MOCK_TODAY);
}
