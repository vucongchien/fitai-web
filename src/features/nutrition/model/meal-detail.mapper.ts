import type {
  MealChoice,
  MealDetailPageData,
  PriceTier,
} from "@/features/nutrition/model/meal-detail.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow, MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { groupMealsBySlot, MEAL_SLOT_LABELS } from "@/shared/api/bff/aggregate/nutrition-daily";

/** Structural subset of `MealOption`. */
export type MealOptionRow = {
  calories: number;
  carbs: number;
  description: string;
  fat: number;
  mealName: string;
  priceTier: string;
  protein: number;
  recipeSteps: string[];
};

/** Structural subset of `GetTodayMenuResponse.meals` (`DailyMeals`). */
export type DailyMenuRows = {
  breakfast?: MealOptionRow[];
  dinner?: MealOptionRow[];
  lunch?: MealOptionRow[];
  snack?: MealOptionRow[];
};

/** `MealOption.price_tier` is a bare string; normalize defensively. */
export function toPriceTier(raw: string): PriceTier | null {
  switch (raw.trim().toUpperCase()) {
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    default:
      return null;
  }
}

function optionsForSlot(menu: DailyMenuRows, slot: MealSlot): MealOptionRow[] {
  switch (slot) {
    case "breakfast":
      return menu.breakfast ?? [];
    case "lunch":
      return menu.lunch ?? [];
    case "dinner":
      return menu.dinner ?? [];
    case "snack":
      return menu.snack ?? [];
  }
}

function toChoice(option: MealOptionRow, index: number): MealChoice {
  return {
    calories: Math.round(option.calories),
    carbs: Math.round(option.carbs),
    description: option.description,
    fat: Math.round(option.fat),
    // MealOption carries no id, so position within its slot identifies it.
    id: `${option.mealName}-${index}`,
    name: option.mealName,
    priceTier: toPriceTier(option.priceTier),
    protein: Math.round(option.protein),
    recipeSteps: option.recipeSteps,
  };
}

/**
 * Shapes one meal slot from `GetTodayMenu` + `GetNutritionHistory`.
 *
 * Reshape only: pick the slot's options, round for display, and pull today's logged rows
 * for that slot out of the flat history list.
 */
export function adaptMealDetailPageData(
  menu: DailyMenuRows,
  mealRows: readonly MealLogRow[],
  slot: MealSlot,
  today: DayKey,
): MealDetailPageData {
  const group = groupMealsBySlot(mealRows, today).find((entry) => entry.slot === slot);

  return {
    choices: optionsForSlot(menu, slot).map(toChoice),
    loggedCalories: group?.calories ?? 0,
    loggedMeals: group?.meals ?? [],
    slot,
    slotLabel: MEAL_SLOT_LABELS[slot],
  };
}
