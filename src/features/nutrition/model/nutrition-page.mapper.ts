import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import { dayKeyRange } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import {
  averageDailyCalories,
  countLoggedDays,
  countMealsInWindow,
  dailyCalorieSeries,
  groupMealsBySlot,
  mealsInWindow,
  totalMacros,
} from "@/shared/api/bff/aggregate/nutrition-daily";

/** Structural subset of `GetNutritionSummaryResponse`. */
type NutritionSummaryLike = {
  consumedCalories: number;
  consumedMacros?: { carbGrams: number; fatGrams: number; proteinGrams: number };
  targetCalories: number;
  targetMacros?: { carbGrams: number; fatGrams: number; proteinGrams: number };
};

export const WEEK_DAYS = 7;

/** Formats a range as "31 July – 6 August". */
export function formatRangeLabel(startKey: DayKey, endKey: DayKey): string {
  const start = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return endKey;

  const format = (date: Date, withMonth: boolean) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: withMonth ? "long" : undefined,
      timeZone: "UTC",
    });

  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return `${format(start, !sameMonth)} – ${format(end, true)}`;
}

/**
 * Shapes the Nutrition screen from `GetNutritionSummary` + `GetNutritionHistory`,
 * over a trailing seven-day window.
 *
 * Reshape only. Weekly macro targets are the daily target multiplied by seven — plain
 * arithmetic on a wire value, not an estimate. A macro the wire omits keeps a null target
 * rather than borrowing one.
 */
export function adaptNutritionPageData(
  summary: NutritionSummaryLike,
  mealRows: readonly MealLogRow[],
  today: DayKey,
): NutritionPageData {
  const window = dayKeyRange(today, WEEK_DAYS);
  const weekRows = mealsInWindow(mealRows, today, WEEK_DAYS);
  const totals = totalMacros(weekRows);
  const target = summary.targetMacros;

  return {
    calorieSeries: dailyCalorieSeries(mealRows, today, WEEK_DAYS),
    caloriesAverage: averageDailyCalories(mealRows, today, WEEK_DAYS),
    caloriesTargetPerDay: Math.round(summary.targetCalories),
    dateLabel: formatRangeLabel(window[0] ?? today, today),
    daysLogged: countLoggedDays(mealRows, today, WEEK_DAYS),
    macros: [
      {
        grams: totals.protein,
        label: "Protein",
        targetGrams: target ? Math.round(target.proteinGrams) * WEEK_DAYS : null,
      },
      {
        grams: totals.carbs,
        label: "Carbs",
        targetGrams: target ? Math.round(target.carbGrams) * WEEK_DAYS : null,
      },
      {
        grams: totals.fat,
        label: "Fat",
        targetGrams: target ? Math.round(target.fatGrams) * WEEK_DAYS : null,
      },
    ],
    mealsLogged: countMealsInWindow(mealRows, today, WEEK_DAYS),
    slots: groupMealsBySlot(mealRows, today),
  };
}
