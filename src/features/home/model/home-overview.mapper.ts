import type { HomeOverview } from "@/features/home/model/home-overview.types";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import { countMeals } from "@/shared/api/bff/aggregate/nutrition-daily";
import { toPercentage } from "@/shared/ui/charts/circular-progress";

type NutritionSummaryLike = {
  consumedCalories: number;
  targetCalories: number;
};

/**
 * Shapes the two headline readings on Home.
 *
 * Both are percentages of a real wire target: calories against
 * `GetNutritionSummaryResponse.target_calories`, sessions against the week's scheduled
 * count from `SessionPlan.status`. Nothing here is estimated.
 */
export function adaptHomeOverview(
  summary: NutritionSummaryLike,
  mealRows: readonly MealLogRow[],
  stats: WorkoutStatsData,
  today: DayKey,
): HomeOverview {
  const mealsLogged = countMeals(mealRows, today);

  return {
    nutritionGoalPercentage: toPercentage(summary.consumedCalories, summary.targetCalories),
    nutritionSummary:
      mealsLogged === 0
        ? "No meals logged yet today."
        : `${Math.round(summary.consumedCalories).toLocaleString()} of ${Math.round(summary.targetCalories).toLocaleString()} kcal`,
    workoutCompletionPercentage: stats.adherence.percentage,
    workoutSummary:
      stats.adherence.scheduled === 0
        ? "No sessions scheduled this week."
        : `${stats.adherence.completed} of ${stats.adherence.scheduled} sessions done`,
  };
}
