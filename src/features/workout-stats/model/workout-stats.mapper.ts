import { formatRangeLabel, WEEK_DAYS } from "@/features/nutrition/model/nutrition-page.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import { dayKeyRange } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import {
  averageDailyProtein,
  countLoggedDays,
  countMealsInWindow,
} from "@/shared/api/bff/aggregate/nutrition-daily";
import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import {
  countActiveDays,
  historyInWindow,
  planAdherence,
  plansInWindow,
  sessionsPerWeekday,
  sumSets,
  sumVolume,
  toAdherence,
} from "@/shared/api/bff/aggregate/workout-adherence";

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  return `${kg.toLocaleString("en-US")} kg`;
}

/**
 * Shapes the Workout screen from
 * `GetActiveRoadmap` + `GetWorkoutHistory` + `GetNutritionHistory`, over a trailing week.
 *
 * Roadmap plans and execution history stay independent sources: the wire offers no
 * `plan_id` on `WorkoutSessionSummary`, so no row-level join is implied.
 */
export function adaptWorkoutStatsData(
  plans: readonly SessionPlanRow[],
  history: readonly SessionHistoryRow[],
  mealRows: readonly MealLogRow[],
  today: DayKey,
): WorkoutStatsData {
  const window = dayKeyRange(today, WEEK_DAYS);
  const weekPlans = plansInWindow(plans, today, WEEK_DAYS);
  const weekHistory = historyInWindow(history, today, WEEK_DAYS);

  return {
    activeDays: countActiveDays(plans, today, WEEK_DAYS),
    adherence: planAdherence(weekPlans),
    dateLabel: formatRangeLabel(window[0] ?? today, today),
    totalSets: sumSets(weekHistory),
    volumeKg: sumVolume(weekHistory),
    weekdaySeries: sessionsPerWeekday(plans, today, WEEK_DAYS),
    weeklyAverageProtein: averageDailyProtein(mealRows, today, WEEK_DAYS),
    weeklyMealsLogged: countMealsInWindow(mealRows, today, WEEK_DAYS),
    weeklyNutritionAdherence: toAdherence(countLoggedDays(mealRows, today, WEEK_DAYS), WEEK_DAYS),
  };
}
