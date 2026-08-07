import type { DailyCalories, MealSlotGroup } from "@/shared/api/bff/aggregate/nutrition-daily";

/**
 * A macro's mean daily intake across logged days.
 *
 * No target is carried. `target_macros` is a daily figure the proto never labels as a floor
 * or a ceiling, and the two need opposite readings — protein is a floor to reach, fat and
 * carbs are allowances not to exceed. Showing one progress bar for all three would state
 * something the wire does not support.
 */
export interface MacroReading {
  gramsPerDay: number;
  label: string;
}

export interface NutritionPageData {
  /** Calories per day across the week, for the trend chart. */
  calorieSeries: DailyCalories[];
  /** Mean daily calories across days that have logs; null when nothing is logged. */
  caloriesAverage: number | null;
  caloriesTargetPerDay: number;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  /** Days with at least one logged meal, out of seven. */
  daysLogged: number;
  macros: MacroReading[];
  mealsLogged: number;
  /** Today's meal slots for the timeline. */
  slots: MealSlotGroup[];
}
