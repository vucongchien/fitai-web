import type { LoggedMeal, MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

/** `MealOption.price_tier` carries "LOW" | "MEDIUM" | "HIGH" as a bare string. */
export type PriceTier = "high" | "low" | "medium";

/** One suggested option for a slot, from `GetTodayMenuResponse.meals`. */
export type MealChoice = {
  calories: number;
  carbs: number;
  description: string;
  fat: number;
  id: string;
  name: string;
  priceTier: PriceTier | null;
  protein: number;
  /** `MealOption.recipe_steps` — how to actually cook it. */
  recipeSteps: string[];
};

export type MealDetailPageData = {
  /** Suggested options for this slot, in the order the menu returned them. */
  choices: MealChoice[];
  /** Total calories logged in this slot today. */
  loggedCalories: number;
  /** What was actually eaten in this slot today. */
  loggedMeals: LoggedMeal[];
  slot: MealSlot;
  slotLabel: string;
};
