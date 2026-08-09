/**
 * Nutrition reshaping for display.
 *
 * Reshape only: filter, group, sum, count, sort, format. No estimation, no derived
 * targets, no formula the backend did not send.
 *
 * `GetNutritionHistory` returns a flat list of meal rows — not a per-day series and not a
 * per-slot total — so grouping happens here.
 */

import type { DayKey } from "./day-key";
import { clockLabel, dayKeyFromLoggedAt, dayKeyRange, minutesOfDay } from "./day-key";

/** Structural subset of `MealLogItem`, so callers may pass proto messages directly. */
export interface MealLogRow {
  calories: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  mealLogId: string;
  mealName: string;
  mealType: string;
  protein: number;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: readonly MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  dinner: "Dinner",
  lunch: "Lunch",
  snack: "Snacks",
};

export interface LoggedMeal {
  calories: number;
  id: string;
  name: string;
  time: string | null;
}

export interface MealSlotGroup {
  calories: number;
  label: string;
  meals: LoggedMeal[];
  plannedMeal?: { name: string; calories: number } | null;
  slot: MealSlot;
}

export interface DailyCalories {
  calories: number | null;
  key: DayKey;
}

/** `LogMealRequest.meal_type` is a bare string ("BREAKFAST", …); normalize defensively. */
export function toMealSlot(mealType: string | undefined | null): MealSlot | null {
  if (!mealType) {
    return null;
  }
  const upper = String(mealType).trim().toUpperCase();
  if (upper === "BREAKFAST" || upper.includes("BREAKFAST")) {
    return "breakfast";
  }
  if (upper === "LUNCH" || upper.includes("LUNCH")) {
    return "lunch";
  }
  if (upper === "DINNER" || upper.includes("DINNER")) {
    return "dinner";
  }
  if (upper === "SNACK" || upper === "SNACKS" || upper.includes("SNACK")) {
    return "snack";
  }
  return null;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function deduplicateMealRows(rows: readonly MealLogRow[]): MealLogRow[] {
  const seenKeys = new Set<string>();
  const result: MealLogRow[] = [];

  for (const row of rows) {
    const cleanName = (row.mealName || "")
      .replace(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})-/, "")
      .trim()
      .toLowerCase();
    const slot = (toMealSlot(row.mealType) || "").toLowerCase();
    const day = dayKeyFromLoggedAt(row.loggedAt) || (row.loggedAt ? row.loggedAt.slice(0, 10) : "");

    const contentKey = `${cleanName}_${slot}_${day}`;
    const idKey = row.mealLogId && !row.mealLogId.startsWith("local-meal-") ? row.mealLogId : contentKey;

    if (seenKeys.has(idKey) || seenKeys.has(contentKey)) {
      continue;
    }

    if (idKey) seenKeys.add(idKey);
    if (contentKey) seenKeys.add(contentKey);
    result.push(row);
  }

  return result;
}

/** Rows logged on a given day. */
export function mealsOnDay(rows: readonly MealLogRow[], key: DayKey): MealLogRow[] {
  return deduplicateMealRows(rows.filter((row) => dayKeyFromLoggedAt(row.loggedAt) === key));
}

/** Number of meals logged on a day. The proto carries no count field. */
export function countMeals(rows: readonly MealLogRow[], key: DayKey): number {
  return mealsOnDay(rows, key).length;
}

import { normalizeTodayMenu } from "@/features/nutrition/model/meal-detail.mapper";

/**
 * Groups a day's rows into the four slots, ordered by clock time.
 * Every slot is present so the timeline can render its own empty state.
 */
export function groupMealsBySlot(
  rows: readonly MealLogRow[],
  key: DayKey,
  todayMenu?: any,
): MealSlotGroup[] {
  const onDay = mealsOnDay(rows, key);
  const normalizedMenu = normalizeTodayMenu(todayMenu);

  return MEAL_SLOTS.map((slot) => {
    const slotRows = onDay
      .filter((row) => toMealSlot(row.mealType) === slot)
      .toSorted((left, right) => minutesOfDay(left.loggedAt) - minutesOfDay(right.loggedAt));

    const slotMenu = normalizedMenu[slot];
    const validPlannedItem = slotMenu?.[0];

    const planned = validPlannedItem
      ? {
          calories: Math.round(validPlannedItem.calories),
          name: validPlannedItem.mealName.replace(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})-/, "").trim(),
        }
      : null;

    return {
      calories: Math.round(sum(slotRows.map((row) => row.calories))),
      label: MEAL_SLOT_LABELS[slot],
      meals: slotRows.map((row) => ({
        calories: Math.round(row.calories),
        id: row.mealLogId,
        name: row.mealName,
        time: clockLabel(row.loggedAt),
      })),
      plannedMeal: planned,
      slot,
    };
  });
}

/**
 * Calories per day over a trailing window.
 * A day with no rows yields `null`, so charts can show absence rather than a measured zero.
 */
export function dailyCalorieSeries(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): DailyCalories[] {
  const byDay = new Map<DayKey, number>();

  for (const row of rows) {
    const key = dayKeyFromLoggedAt(row.loggedAt);
    if (!key) {
      continue;
    }
    byDay.set(key, (byDay.get(key) ?? 0) + row.calories);
  }

  return dayKeyRange(endKey, length).map((key) => {
    const total = byDay.get(key);
    return { calories: total === undefined ? null : Math.round(total), key };
  });
}

/** Mean daily calories across days that have at least one logged meal. */
export function averageDailyCalories(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): number | null {
  const series = dailyCalorieSeries(rows, endKey, length).filter(
    (point) => point.calories !== null,
  );
  if (series.length === 0) {
    return null;
  }
  return Math.round(sum(series.map((point) => point.calories ?? 0)) / series.length);
}

/** Mean daily protein across days that have at least one logged meal. */
export function averageDailyProtein(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): number | null {
  const byDay = new Map<DayKey, number>();
  const window = new Set(dayKeyRange(endKey, length));

  for (const row of rows) {
    const key = dayKeyFromLoggedAt(row.loggedAt);
    if (!key || !window.has(key)) {
      continue;
    }
    byDay.set(key, (byDay.get(key) ?? 0) + row.protein);
  }

  if (byDay.size === 0) {
    return null;
  }
  return Math.round(sum([...byDay.values()]) / byDay.size);
}

/** Rows logged inside a trailing window. */
export function mealsInWindow(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): MealLogRow[] {
  const window = new Set(dayKeyRange(endKey, length));
  return rows.filter((row) => {
    const key = dayKeyFromLoggedAt(row.loggedAt);
    return key !== null && window.has(key);
  });
}

/** Summed calories and macros over a set of rows. */
export function totalMacros(rows: readonly MealLogRow[]) {
  return {
    calories: Math.round(sum(rows.map((row) => row.calories))),
    carbs: Math.round(sum(rows.map((row) => row.carbs))),
    fat: Math.round(sum(rows.map((row) => row.fat))),
    protein: Math.round(sum(rows.map((row) => row.protein))),
  };
}

/** Total meals logged across a trailing window. */
export function countMealsInWindow(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): number {
  const window = new Set(dayKeyRange(endKey, length));
  return rows.filter((row) => {
    const key = dayKeyFromLoggedAt(row.loggedAt);
    return key !== null && window.has(key);
  }).length;
}

/** Days in the window with at least one logged meal. */
export function countLoggedDays(
  rows: readonly MealLogRow[],
  endKey: DayKey,
  length: number,
): number {
  const window = new Set(dayKeyRange(endKey, length));
  const days = new Set<DayKey>();

  for (const row of rows) {
    const key = dayKeyFromLoggedAt(row.loggedAt);
    if (key && window.has(key)) {
      days.add(key);
    }
  }

  return days.size;
}
