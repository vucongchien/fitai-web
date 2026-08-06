import { formatRangeLabel, WEEK_DAYS } from "@/features/nutrition/model/nutrition-page.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import { dayKeyRange } from "@/shared/api/bff/aggregate/day-key";
import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import {
  historyInWindow,
  planAdherence,
  plansInWindow,
  sessionsPerWeekday,
  sumVolume,
} from "@/shared/api/bff/aggregate/workout-adherence";

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  return `${kg.toLocaleString("en-US")} kg`;
}

/**
 * Shapes the Workout screen from `GetActiveRoadmap` + `GetWorkoutHistory`,
 * over a trailing week.
 *
 * Roadmap plans and execution history stay independent sources: the wire offers no
 * `plan_id` on `WorkoutSessionSummary`, so no row-level join is implied.
 */
export function adaptWorkoutStatsData(
  plans: readonly SessionPlanRow[],
  history: readonly SessionHistoryRow[],
  today: DayKey,
): WorkoutStatsData {
  const window = dayKeyRange(today, WEEK_DAYS);

  return {
    adherence: planAdherence(plansInWindow(plans, today, WEEK_DAYS)),
    dateLabel: formatRangeLabel(window[0] ?? today, today),
    volumeKg: sumVolume(historyInWindow(history, today, WEEK_DAYS)),
    weekdaySeries: sessionsPerWeekday(plans, today, WEEK_DAYS),
  };
}
