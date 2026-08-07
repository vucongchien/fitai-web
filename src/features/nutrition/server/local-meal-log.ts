import "server-only";
import { cookies } from "next/headers";

import type { MealLogRow, MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

/**
 * Meals logged while no backend is configured.
 *
 * Stored in a cookie rather than module memory on purpose: Next runs prerendering and
 * requests across several worker processes, so a module-level array is written in one
 * process and read in another. A cookie is shared by every process and is a runtime API,
 * which also keeps the read out of the static shell.
 *
 * Never consulted once `FITAI_RPC_URL` is set — `GetNutritionHistory` is the only source.
 */
const COOKIE = "fitai_local_meals";

const WIRE_MEAL_TYPE: Record<MealSlot, string> = {
  breakfast: "BREAKFAST",
  dinner: "DINNER",
  lunch: "LUNCH",
  snack: "SNACK",
};

export interface LocalMealInput {
  calories: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  mealName: string;
  protein: number;
  slot: MealSlot;
}

/** Rows are stored as a compact tuple so the cookie stays small. */
type StoredRow = [
  name: string,
  type: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  at: string,
];

function decode(raw: string | undefined): StoredRow[] {
  if (!raw) {return [];}
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredRow[]) : [];
  } catch {
    // A malformed cookie is treated as empty rather than crashing the page.
    return [];
  }
}

function toRow(stored: StoredRow, index: number): MealLogRow {
  const [mealName, mealType, calories, protein, carbs, fat, loggedAt] = stored;
  return {
    calories,
    carbs,
    fat,
    loggedAt,
    mealLogId: `local-meal-${index + 1}`,
    mealName,
    mealType,
    protein,
  };
}

/** Appends one row and returns its id. */
export async function appendLocalMeal(input: LocalMealInput): Promise<string> {
  const store = await cookies();
  const rows = decode(store.get(COOKIE)?.value);

  rows.push([
    input.mealName.trim(),
    WIRE_MEAL_TYPE[input.slot],
    input.calories,
    input.protein,
    input.carbs,
    input.fat,
    input.loggedAt,
  ]);

  store.set(COOKIE, JSON.stringify(rows), {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });

  return `local-meal-${rows.length}`;
}

/** Everything logged locally, oldest first. */
export async function readLocalMeals(): Promise<MealLogRow[]> {
  const store = await cookies();
  return decode(store.get(COOKIE)?.value).map(toRow);
}
