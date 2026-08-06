import type { DailyCalories, MealSlotGroup } from "@/shared/api/bff/aggregate/nutrition-daily";

/** A value shown against its target. `target` is null when the wire carries none. */
export type MacroReading = {
  grams: number;
  label: string;
  targetGrams: number | null;
};

export type NutritionPageData = {
  /** Calories per day across the week, for the trend chart. */
  calorieSeries: DailyCalories[];
  /** Mean daily calories across days that have logs; null when nothing is logged. */
  caloriesAverage: number | null;
  caloriesTargetPerDay: number;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  /** Days with at least one logged meal, out of seven. */
  daysLogged: number;
  /** Weekly totals, shown against the week's target. */
  macros: MacroReading[];
  mealsLogged: number;
  /** Today's meal slots for the timeline. */
  slots: MealSlotGroup[];
};
