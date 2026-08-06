import type { HomeOverview, MetricCard } from "@/features/home/model/home-overview.types";
import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import { countMeals, dailyCalorieSeries } from "@/shared/api/bff/aggregate/nutrition-daily";
import { toPercentage } from "@/shared/ui/charts/circular-progress";

type NutritionSummaryLike = {
  consumedCalories: number;
  consumedMacros?: { proteinGrams: number };
  targetCalories: number;
  targetMacros?: { proteinGrams: number };
};

/**
 * Shapes the Home overview card and metric grid.
 *
 * Every card is backed by a wire field. Water intake, calories burned and active minutes
 * are absent from the protos, so Training volume and Sets logged take those slots rather
 * than showing an estimate. Those two carry no target on the wire, so they show a trailing
 * seven-day comparison instead of a fabricated goal.
 */
export function adaptHomeOverview(
  summary: NutritionSummaryLike,
  mealRows: readonly MealLogRow[],
  stats: WorkoutStatsData,
  today: DayKey,
): HomeOverview {
  const today7 = dailyCalorieSeries(mealRows, today, 7);
  const mealsLogged = countMeals(mealRows, today);
  const nutritionGoalPercentage = toPercentage(summary.consumedCalories, summary.targetCalories);

  const week = stats;

  const proteinConsumed = Math.round(summary.consumedMacros?.proteinGrams ?? 0);
  const proteinTarget = summary.targetMacros ? Math.round(summary.targetMacros.proteinGrams) : null;

  const metrics: MetricCard[] = [
    {
      goal: `of ${Math.round(summary.targetCalories).toLocaleString()} kcal`,
      goalIsTarget: true,
      icon: "flame",
      id: "calories-consumed",
      percentage: nutritionGoalPercentage,
      title: "Calories consumed",
      value: Math.round(summary.consumedCalories).toLocaleString(),
    },
    {
      goal: proteinTarget === null ? "No target set" : `of ${proteinTarget} g`,
      goalIsTarget: proteinTarget !== null,
      icon: "target",
      id: "protein",
      percentage: proteinTarget === null ? null : toPercentage(proteinConsumed, proteinTarget),
      title: "Protein",
      value: `${proteinConsumed} g`,
    },
    {
      goal: mealsLogged === 0 ? "Nothing logged yet" : "logged today",
      goalIsTarget: false,
      icon: "utensils",
      id: "meals-logged",
      percentage: null,
      title: "Meals logged",
      value: String(mealsLogged),
    },
    {
      goal:
        week.adherence.scheduled === 0
          ? "Nothing scheduled this week"
          : `of ${week.adherence.scheduled} planned`,
      goalIsTarget: week.adherence.scheduled > 0,
      icon: "dumbbell",
      id: "workout-completion",
      percentage: week.adherence.scheduled === 0 ? null : week.adherence.percentage,
      title: "Workout completion",
      value: `${week.adherence.completed}`,
    },
    {
      goal: "over the last 7 days",
      goalIsTarget: false,
      icon: "weight",
      id: "training-volume",
      percentage: null,
      title: "Training volume",
      value: formatVolume(week.volumeKg),
    },
    {
      goal: "over the last 7 days",
      goalIsTarget: false,
      icon: "layers",
      id: "total-sets",
      percentage: null,
      title: "Sets logged",
      value: String(week.totalSets),
    },
  ];

  return {
    calorieTrend: today7,
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
