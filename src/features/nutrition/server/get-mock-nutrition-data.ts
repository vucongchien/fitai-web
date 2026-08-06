import { adaptNutritionPageData } from "@/features/nutrition/model/nutrition-page.mapper";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";

/**
 * Mock wire payloads, shaped exactly like the proto messages, then passed through the real
 * mapper. The UI cannot tell this path from the live one.
 */
export const MOCK_TODAY: DayKey = "2026-08-06";

export function getMockMealRows(): MealLogRow[] {
  return [
    {
      calories: 420,
      carbs: 48,
      fat: 9,
      loggedAt: `${MOCK_TODAY}T07:30:00Z`,
      mealLogId: "meal-breakfast",
      mealName: "Lean beef pho",
      mealType: "BREAKFAST",
      protein: 32,
    },
    {
      calories: 180,
      carbs: 22,
      fat: 7,
      loggedAt: `${MOCK_TODAY}T10:00:00Z`,
      mealLogId: "meal-snack-morning",
      mealName: "Apple and almonds",
      mealType: "SNACK",
      protein: 6,
    },
    {
      calories: 610,
      carbs: 55,
      fat: 18,
      loggedAt: `${MOCK_TODAY}T12:30:00Z`,
      mealLogId: "meal-lunch",
      mealName: "Chicken breast and vegetable soup",
      mealType: "LUNCH",
      protein: 48,
    },
    {
      calories: 210,
      carbs: 12,
      fat: 11,
      loggedAt: `${MOCK_TODAY}T15:30:00Z`,
      mealLogId: "meal-snack-afternoon",
      mealName: "Greek yoghurt",
      mealType: "SNACK",
      protein: 18,
    },
    // Yesterday, so the 7-day trend has more than one point to draw.
    {
      calories: 1980,
      carbs: 210,
      fat: 62,
      loggedAt: "2026-08-05T19:30:00Z",
      mealLogId: "meal-dinner-prev",
      mealName: "Salmon soup and cucumber salad",
      mealType: "DINNER",
      protein: 138,
    },
    {
      calories: 2040,
      carbs: 224,
      fat: 66,
      loggedAt: "2026-08-04T19:15:00Z",
      mealLogId: "meal-dinner-prev-2",
      mealName: "Tofu stir fry",
      mealType: "DINNER",
      protein: 126,
    },
    {
      calories: 1870,
      carbs: 198,
      fat: 58,
      loggedAt: "2026-08-03T19:45:00Z",
      mealLogId: "meal-dinner-prev-3",
      mealName: "Pork and rice bowl",
      mealType: "DINNER",
      protein: 118,
    },
  ];
}

export function getMockNutritionSummary() {
  return {
    consumedCalories: 1420,
    consumedMacros: { carbGrams: 137, fatGrams: 45, proteinGrams: 104 },
    targetCalories: 2050,
    targetMacros: { carbGrams: 232, fatGrams: 68, proteinGrams: 150 },
  };
}

export function getMockNutritionPageData(): NutritionPageData {
  return adaptNutritionPageData(getMockNutritionSummary(), getMockMealRows(), MOCK_TODAY);
}
