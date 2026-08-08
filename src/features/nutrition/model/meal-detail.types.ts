import type { LoggedMeal, MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

/** `MealOption.price_tier` carries "LOW" | "MEDIUM" | "HIGH" as a bare string. */
export type PriceTier = "high" | "low" | "medium";

/** One suggested option for a slot, from `GetTodayMenuResponse.meals`. */
export interface MealChoice {
  calories: number;
  carbs: number;
  description: string;
  fat: number;
  id: string;
  name: string;
  priceTier: PriceTier | null;
  protein: number;
  rawName?: string;
  /** `MealOption.recipe_steps` — how to actually cook it. */
  recipeSteps: string[];
}

/** A logged meal, plus the menu option it matches when the menu still carries one. */
export type LoggedMealDetail = LoggedMeal & {
  /** Recipe steps from the matching `MealOption`, empty when the menu has no match. */
  recipeSteps: string[];
};

export interface MealDetailPageData {
  /** Suggestions for this slot, excluding anything already eaten. */
  choices: MealChoice[];
  /** Total calories logged in this slot today. */
  loggedCalories: number;
  /** What was actually eaten in this slot today. */
  loggedMeals: LoggedMealDetail[];
  slot: MealSlot;
  slotLabel: string;
}
