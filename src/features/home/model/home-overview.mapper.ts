import type { HomeOverview, MetricCard } from "@/features/home/model/home-overview.types";
import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import { weekdayLabel } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import { countMeals, dailyCalorieSeries } from "@/shared/api/bff/aggregate/nutrition-daily";
import type { SessionPlanRow } from "@/shared/api/bff/aggregate/workout-adherence";
import { dailyAdherenceSeries } from "@/shared/api/bff/aggregate/workout-adherence";
import { toPercentage } from "@/shared/ui/charts/circular-progress";
import type { FlowPoint } from "@/shared/ui/charts/dual-flow-chart";

type NutritionSummaryLike = {
  consumedCalories: number;
  consumedMacros?: { proteinGrams: number };
  targetCalories: number;
  targetMacros?: { proteinGrams: number };
};

const WEEK_DAYS = 7;

/**
 * Shapes the Home overview card and metric grid.
 *
 * The weekly flow puts both habits on one axis by expressing each as a percentage of its
 * own target for that day: calories against `target_calories`, sessions against the day's
 * scheduled count. Raw kcal and kg cannot share an axis without flattening one.
 */
export function adaptHomeOverview(
  summary: NutritionSummaryLike,
  mealRows: readonly MealLogRow[],
  stats: WorkoutStatsData,
  plans: readonly SessionPlanRow[],
  today: DayKey,
): HomeOverview {
  const mealsLogged = countMeals(mealRows, today);
  const nutritionGoalPercentage = toPercentage(summary.consumedCalories, summary.targetCalories);
  const week = stats;

  const calories = dailyCalorieSeries(mealRows, today, WEEK_DAYS);
  const workout = dailyAdherenceSeries(plans, today, WEEK_DAYS);

  const weeklyFlow: FlowPoint[] = calories.map((day, index) => ({
    label: weekdayLabel(day.key) ?? day.key.slice(5),
    nutrition: day.calories === null ? null : toPercentage(day.calories, summary.targetCalories),
    workout: workout[index]?.percentage ?? null,
  }));

  // Two cards only. Workout completion and nutrition goal already read on the overview
  // card above with their own progress bars, so repeating them here said nothing new.
  const metrics: MetricCard[] = [
    {
      caption: "Today",
      icon: "flame",
      id: "calories-consumed",
      title: "Calories consumed",
      unit: "kcal",
      value: Math.round(summary.consumedCalories).toLocaleString(),
    },
    {
      caption: "Last 7 days",
      icon: "weight",
      id: "training-volume",
      title: "Training volume",
      value: formatVolume(week.volumeKg),
    },
  ];

  return {
    weeklyFlow,
    metrics,
    nutritionGoalPercentage,
    nutritionSummary:
      mealsLogged === 0
        ? "No meals logged yet today."
        : `${Math.round(summary.consumedCalories).toLocaleString()} of ${Math.round(summary.targetCalories).toLocaleString()} kcal`,
    workoutCompletionPercentage: week.adherence.percentage,
    workoutSummary:
      week.adherence.scheduled === 0
        ? "No sessions scheduled this week."
        : `${week.adherence.completed} of ${week.adherence.scheduled} sessions done`,
  };
}
