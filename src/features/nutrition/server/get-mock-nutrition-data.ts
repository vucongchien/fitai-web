import { adaptNutritionPageData } from "@/features/nutrition/model/nutrition-page.mapper";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import { mealsOnDay, totalMacros } from "@/shared/api/bff/aggregate/nutrition-daily";

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

/**
 * Mock `GetNutritionSummaryResponse`.
 *
 * The consumed side is summed from today's rows rather than fixed, so a meal logged in this
 * session moves the ring exactly as the real summary would. Targets are the plan's own
 * figures and stay constant.
 */
export function getMockNutritionSummary(rows: readonly MealLogRow[]) {
  const today = totalMacros(mealsOnDay(rows, MOCK_TODAY));

  return {
    consumedCalories: today.calories,
    consumedMacros: {
      carbGrams: today.carbs,
      fatGrams: today.fat,
      proteinGrams: today.protein,
    },
    targetCalories: 2050,
    targetMacros: { carbGrams: 232, fatGrams: 68, proteinGrams: 150 },
  };
}

/**
 * The seeded rows plus anything logged this session, so the log flow is observable end to
 * end without a backend.
 */
export function withLocalMeals(local: readonly MealLogRow[]): MealLogRow[] {
  return [...getMockMealRows(), ...local];
}

export function getMockNutritionPageData(local: readonly MealLogRow[]): NutritionPageData {
  const rows = withLocalMeals(local);
  return adaptNutritionPageData(getMockNutritionSummary(rows), rows, MOCK_TODAY);
}
