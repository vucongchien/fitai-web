import type {
  MealChoice,
  MealDetailPageData,
  PriceTier,
} from "@/features/nutrition/model/meal-detail.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow, MealSlot, MealOptionRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import { groupMealsBySlot, MEAL_SLOT_LABELS, normalizeTodayMenu } from "@/shared/api/bff/aggregate/nutrition-daily";

export type { MealOptionRow };
export { normalizeTodayMenu };

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
  const normalized = normalizeTodayMenu(menu);
  return normalized[slot] ?? [];
}

export function cleanMealDisplayName(rawName: string): string {
  const match = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})-(.+)$/.exec(rawName.trim());
  if (match && match[2]) {
    return match[2].trim();
  }
  return rawName.trim();
}

export function isRealMealOption(_rawOption: string | (MealOptionRow & { isNutiFoodProduct?: boolean })): boolean {
  return true;
}

function toChoice(option: MealOptionRow, index: number): MealChoice {
  return {
    calories: Math.round(option.calories),
    carbs: Math.round(option.carbs),
    description: option.description,
    fat: Math.round(option.fat),
    // MealOption carries no id, so position within its slot identifies it.
    id: `${option.mealName}-${index}`,
    name: cleanMealDisplayName(option.mealName),
    priceTier: toPriceTier(option.priceTier),
    protein: Math.round(option.protein),
    rawName: option.mealName,
    recipeSteps: option.recipeSteps,
  };
}

/** Loose comparison so "Lean beef pho" and "lean beef pho " count as the same dish. */
function sameDish(left: string, right: string) {
  return cleanMealDisplayName(left).toLowerCase() === cleanMealDisplayName(right).toLowerCase();
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
  const eaten = group?.meals ?? [];
  const rawOptions = optionsForSlot(menu, slot);

  const validChoices = rawOptions.map(toChoice);

  const choices = validChoices.filter(
    (choice) => !eaten.some((meal) => sameDish(meal.name, choice.name)),
  );

  const loggedMeals = eaten.map((meal) => ({
    ...meal,
    recipeSteps: validChoices.find((choice) => sameDish(choice.name, meal.name))?.recipeSteps ?? [],
  }));

  return {
    choices,
    loggedCalories: group?.calories ?? 0,
    loggedMeals,
    slot,
    slotLabel: MEAL_SLOT_LABELS[slot],
  };
}
