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

import { toMealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

export function normalizeTodayMenu(menuInput: any): Record<MealSlot, MealOptionRow[]> {
  const result: Record<MealSlot, MealOptionRow[]> = {
    breakfast: [],
    dinner: [],
    lunch: [],
    snack: [],
  };

  if (!menuInput) {
    return result;
  }

  let data = menuInput;

  // 1. Direct Uint8Array / Buffer bytes from PostgreSQL jsonb column
  if (data instanceof Uint8Array || (typeof Buffer !== "undefined" && Buffer.isBuffer(data))) {
    try {
      const decoded = new TextDecoder().decode(data);
      data = JSON.parse(decoded);
    } catch {
      return result;
    }
  }

  // 2. String representation of jsonb
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return result;
    }
  }

  // 3. Object wrapper containing jsonb field
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.meals_json) {
      return normalizeTodayMenu(data.meals_json);
    }
    if (data.mealsJson) {
      return normalizeTodayMenu(data.mealsJson);
    }
    if (Array.isArray(data.meals)) {
      return normalizeTodayMenu(data.meals);
    }
  }

  // 4. Direct native jsonb Array of slot objects: [ { mealType: "Breakfast", options: [...] }, ... ]
  if (Array.isArray(data)) {
    for (const item of data) {
      const slot = toMealSlot(item.mealType || item.meal_type || item.slot || "");
      const rawOptions = item.options || item.meals || [];
      if (slot && Array.isArray(rawOptions)) {
        const mappedOptions = rawOptions.map((opt: any) => ({
          calories: Number(opt.calories || opt.caloriesKcal || 0),
          carbs: Number(opt.carbGrams || opt.carbs || 0),
          description: opt.description || "",
          fat: Number(opt.fatGrams || opt.fat || 0),
          isNutiFoodProduct: Boolean(opt.isNutiFoodProduct),
          mealName: opt.mealName || opt.meal_name || opt.name || "",
          priceTier: opt.priceTier || "MEDIUM",
          protein: Number(opt.proteinGrams || opt.protein || 0),
          recipeSteps: Array.isArray(opt.cookingSteps)
            ? opt.cookingSteps
            : Array.isArray(opt.recipeSteps)
              ? opt.recipeSteps
              : [],
        }));
        result[slot].push(...mappedOptions);
      }
    }
    return result;
  }

  // 5. Direct native jsonb Object: { breakfast: [...], lunch: [...], dinner: [...], snack: [...] }
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
  for (const s of slots) {
    const rawList = data[s] || data[s.toUpperCase()] || data[s.toLowerCase()];
    if (Array.isArray(rawList)) {
      result[s] = rawList.map((opt: any) => ({
        calories: Number(opt.calories || opt.caloriesKcal || 0),
        carbs: Number(opt.carbGrams || opt.carbs || 0),
        description: opt.description || "",
        fat: Number(opt.fatGrams || opt.fat || 0),
        isNutiFoodProduct: Boolean(opt.isNutiFoodProduct),
        mealName: opt.mealName || opt.meal_name || opt.name || "",
        priceTier: opt.priceTier || "MEDIUM",
        protein: Number(opt.proteinGrams || opt.protein || 0),
        recipeSteps: Array.isArray(opt.cookingSteps)
          ? opt.cookingSteps
          : Array.isArray(opt.recipeSteps)
            ? opt.recipeSteps
            : [],
      }));
    }
  }

  // 6. Fallback for BE gRPC response when all meals are returned in meals.snack:
  if (!result.breakfast.length && !result.lunch.length && !result.dinner.length && result.snack.length >= 4) {
    const allItems = [...result.snack];
    const perSlotCount = Math.floor(allItems.length / 4);

    if (perSlotCount >= 1) {
      result.breakfast = allItems.slice(0, perSlotCount);
      result.lunch = allItems.slice(perSlotCount, perSlotCount * 2);
      result.dinner = allItems.slice(perSlotCount * 2, perSlotCount * 3);
      result.snack = allItems.slice(perSlotCount * 3);
    }
  }

  return result;
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
  return left.trim().toLowerCase() === right.trim().toLowerCase();
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
