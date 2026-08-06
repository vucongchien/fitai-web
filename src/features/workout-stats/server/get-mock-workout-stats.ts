import { MOCK_TODAY } from "@/features/nutrition/server/get-mock-nutrition-data";
import { adaptWorkoutStatsData } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import { SESSION_PLAN_STATUS } from "@/shared/api/bff/aggregate/workout-adherence";

/** Epoch seconds for 12:00Z on a given August 2026 day. */
function august2026(day: number) {
  return Math.floor(Date.UTC(2026, 7, day, 12) / 1000);
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
      scheduledDate: { day: 3, month: 8, year: 2026 },
      sessionPlanId: "lower-foundation",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Quads", "Glutes"],
    },
    {
      scheduledDate: { day: 5, month: 8, year: 2026 },
      sessionPlanId: "upper-control",
      slotTime: "18:30",
      status: SESSION_PLAN_STATUS.COMPLETED,
      targetMuscleGroups: ["Chest", "Shoulders", "Core"],
    },
    {
      scheduledDate: { day: 6, month: 8, year: 2026 },
      sessionPlanId: "posterior-chain",
      slotTime: "18:00",
      status: SESSION_PLAN_STATUS.PENDING,
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

export function getMockSessionHistory(): SessionHistoryRow[] {
  return [
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
      averageFormScore: 0.81,
      date: { seconds: Math.floor(Date.UTC(2026, 6, 29, 12) / 1000) },
      sessionId: "hist-week1-lower",
      totalSets: 14,
      totalVolume: 2020,
    },
  ];
}

export function getMockWorkoutStatsData(): WorkoutStatsData {
  return adaptWorkoutStatsData(getMockSessionPlans(), getMockSessionHistory(), MOCK_TODAY);
}
