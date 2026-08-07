import type {
  MealChoice,
  MealDetailPageData,
  PriceTier,
} from "@/features/nutrition/model/meal-detail.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow, MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { groupMealsBySlot, MEAL_SLOT_LABELS } from "@/shared/api/bff/aggregate/nutrition-daily";

/** Structural subset of `MealOption`. */
export interface MealOptionRow {
  calories: number;
  carbs: number;
  description: string;
  fat: number;
  mealName: string;
  priceTier: string;
  protein: number;
  recipeSteps: string[];
}

/** Structural subset of `GetTodayMenuResponse.meals` (`DailyMeals`). */
export interface DailyMenuRows {
  breakfast?: MealOptionRow[];
  dinner?: MealOptionRow[];
  lunch?: MealOptionRow[];
  snack?: MealOptionRow[];
}

/** `MealOption.price_tier` is a bare string; normalize defensively. */
export function toPriceTier(raw: string): PriceTier | null {
  switch (raw.trim().toUpperCase()) {
    case "LOW": {
      return "low";
    }
    case "MEDIUM": {
      return "medium";
    }
    case "HIGH": {
      return "high";
    }
    default: {
      return null;
    }
  }
}

function optionsForSlot(menu: DailyMenuRows, slot: MealSlot): MealOptionRow[] {
  switch (slot) {
    case "breakfast": {
      return menu.breakfast ?? [];
    }
    case "lunch": {
      return menu.lunch ?? [];
    }
    case "dinner": {
      return menu.dinner ?? [];
    }
    case "snack": {
      return menu.snack ?? [];
    }
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

/** Loose comparison so "Lean beef pho" and "lean beef pho " count as the same dish. */
function sameDish(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/**
 * Shapes one meal slot from `GetTodayMenu` + `GetNutritionHistory`.
 *
 * Reshape only: pick the slot's options, round for display, and pull today's logged rows
 * for that slot out of the flat history list.
 *
 * A dish already logged is dropped from the suggestions — `MealLogItem` and `MealOption`
 * share no id, so the dish name is the only key the wire offers. Without this the page
 * offers you the meal you just ate.
 */
export function adaptMealDetailPageData(
  menu: DailyMenuRows,
  mealRows: readonly MealLogRow[],
  slot: MealSlot,
  today: DayKey,
): MealDetailPageData {
  const group = groupMealsBySlot(mealRows, today).find((entry) => entry.slot === slot);
  const eaten = group?.meals ?? [];
  const options = optionsForSlot(menu, slot).map(toChoice);

  // Carry the matching option's recipe onto the logged row, so a dish you already ate keeps
  // Its cooking steps instead of losing them when it drops out of the suggestions.
  const loggedMeals = eaten.map((meal) => ({
    ...meal,
    recipeSteps: options.find((choice) => sameDish(choice.name, meal.name))?.recipeSteps ?? [],
  }));

  return {
    choices: options.filter((choice) => !eaten.some((meal) => sameDish(meal.name, choice.name))),
    loggedCalories: group?.calories ?? 0,
    loggedMeals,
    slot,
    slotLabel: MEAL_SLOT_LABELS[slot],
  };
}
