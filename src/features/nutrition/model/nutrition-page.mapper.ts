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
interface NutritionSummaryLike {
  consumedCalories: number;
  consumedMacros?: { carbGrams: number; fatGrams: number; proteinGrams: number };
  targetCalories: number;
  targetMacros?: { carbGrams: number; fatGrams: number; proteinGrams: number };
}

/** Mean per logged day, so a partly logged week is not read as a shortfall. */
function perDay(total: number, loggedDays: number): number {
  if (loggedDays <= 0) {return 0;}
  return Math.round(total / loggedDays);
}

export const WEEK_DAYS = 7;

const formatRangeDay = (date: Date, withMonth: boolean) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: withMonth ? "long" : undefined,
    timeZone: "UTC",
  });

/** Formats a range as "31 July – 6 August". */
export function formatRangeLabel(startKey: DayKey, endKey: DayKey): string {
  const start = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {return endKey;}

  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return `${formatRangeDay(start, !sameMonth)} – ${formatRangeDay(end, true)}`;
}

/**
 * Shapes the Nutrition screen from `GetNutritionSummary` + `GetNutritionHistory`,
 * over a trailing seven-day window.
 *
 * Reshape only: sums divided by the number of logged days. Macro targets are deliberately
 * not shown — see `MacroReading`.
 */
export function adaptNutritionPageData(
  summary: NutritionSummaryLike,
  mealRows: readonly MealLogRow[],
  today: DayKey,
): NutritionPageData {
  const window = dayKeyRange(today, WEEK_DAYS);
  const weekRows = mealsInWindow(mealRows, today, WEEK_DAYS);
  const totals = totalMacros(weekRows);
  const loggedDays = countLoggedDays(mealRows, today, WEEK_DAYS);

  return {
    calorieSeries: dailyCalorieSeries(mealRows, today, WEEK_DAYS),
    caloriesAverage: averageDailyCalories(mealRows, today, WEEK_DAYS),
    caloriesTargetPerDay: Math.round(summary.targetCalories),
    dateLabel: formatRangeLabel(window[0] ?? today, today),
    daysLogged: loggedDays,
    macros: [
      { gramsPerDay: perDay(totals.protein, loggedDays), label: "Protein" },
      { gramsPerDay: perDay(totals.carbs, loggedDays), label: "Carbs" },
      { gramsPerDay: perDay(totals.fat, loggedDays), label: "Fat" },
    ],
    mealsLogged: countMealsInWindow(mealRows, today, WEEK_DAYS),
    slots: groupMealsBySlot(mealRows, today),
  };
}
