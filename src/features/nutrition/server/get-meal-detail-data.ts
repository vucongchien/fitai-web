import "server-only";
import {
  adaptMealDetailPageData,
  type DailyMenuRows,
} from "@/features/nutrition/model/meal-detail.mapper";
import type { MealDetailPageData } from "@/features/nutrition/model/meal-detail.types";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

import { MOCK_TODAY, withLocalMeals } from "./get-mock-nutrition-data";
import { readLocalMeals } from "./local-meal-log";

/**
 * Mock `GetTodayMenuResponse.meals`, shaped like `DailyMeals` of `MealOption`.
 *
 * Every slot carries more than one option because the wire field is `repeated` — the user
 * is meant to choose. `recipe_steps` is the reason this screen exists.
 */
function getMockDailyMenu(): DailyMenuRows {
  return {
    breakfast: [
      {
        calories: 420,
        carbs: 48,
        description: "Rice noodles in clear broth with lean beef and plenty of herbs.",
        fat: 9,
        mealName: "Lean beef pho",
        priceTier: "MEDIUM",
        protein: 32,
        recipeSteps: [
          "Simmer the beef bones with charred ginger and onion for two hours, skimming the surface.",
          "Toast the star anise and cinnamon, then add them to the broth for the last thirty minutes.",
          "Blanch the rice noodles for ten seconds and divide them between two bowls.",
          "Slice the raw beef thinly against the grain and lay it over the noodles.",
          "Pour the boiling broth over the beef so it cooks through, then finish with herbs.",
        ],
      },
      {
        calories: 380,
        carbs: 41,
        description: "Steel-cut oats cooked in milk, topped with banana and toasted walnuts.",
        fat: 12,
        mealName: "Oats with banana and walnuts",
        priceTier: "LOW",
        protein: 18,
        recipeSteps: [
          "Bring the milk to a gentle simmer and stir in the oats.",
          "Cook for twelve minutes, stirring so the base does not catch.",
          "Toast the walnuts in a dry pan until they smell nutty.",
          "Top with sliced banana and the walnuts.",
        ],
      },
    ],
    dinner: [
      {
        calories: 520,
        carbs: 34,
        description: "Salmon poached in a light broth, with cucumber salad on the side.",
        fat: 24,
        mealName: "Salmon soup and cucumber salad",
        priceTier: "HIGH",
        protein: 42,
        recipeSteps: [
          "Bring a light stock to a bare simmer — it should not boil.",
          "Lower the salmon in and poach for eight minutes until it flakes.",
          "Salt the sliced cucumber and let it drain for ten minutes.",
          "Dress the cucumber with rice vinegar and a little sesame oil.",
          "Serve the salmon in its broth with the salad alongside.",
        ],
      },
      {
        calories: 480,
        carbs: 52,
        description: "Tofu and vegetables stir-fried over high heat, served with brown rice.",
        fat: 16,
        mealName: "Tofu stir fry",
        priceTier: "LOW",
        protein: 28,
        recipeSteps: [
          "Press the tofu for twenty minutes, then cube it.",
          "Get the pan hotter than feels sensible before adding oil.",
          "Sear the tofu on each side without moving it, then set it aside.",
          "Stir-fry the vegetables for two minutes, return the tofu, and season.",
        ],
      },
    ],
    lunch: [
      {
        calories: 610,
        carbs: 55,
        description: "Poached chicken breast with a clear vegetable soup and steamed rice.",
        fat: 18,
        mealName: "Chicken breast and vegetable soup",
        priceTier: "MEDIUM",
        protein: 48,
        recipeSteps: [
          "Poach the chicken breast in salted water for fourteen minutes, then rest it.",
          "Simmer the carrot and daikon in the poaching liquid until tender.",
          "Slice the chicken across the grain.",
          "Serve with steamed rice and the soup in a separate bowl.",
        ],
      },
    ],
    snack: [
      {
        calories: 180,
        carbs: 22,
        description: "An apple with a small handful of raw almonds.",
        fat: 7,
        mealName: "Apple and almonds",
        priceTier: "LOW",
        protein: 6,
        recipeSteps: [],
      },
      {
        calories: 210,
        carbs: 12,
        description: "Plain Greek yoghurt with a spoon of honey.",
        fat: 11,
        mealName: "Greek yoghurt",
        priceTier: "LOW",
        protein: 18,
        recipeSteps: [],
      },
    ],
  };
}

/**
 * Fetches one meal slot's detail.
 *
 * Calls:
 *   - NutritionService.getTodayMenu → the slot's suggested options and recipe steps
 *   - NutritionService.getNutritionHistory → what was actually logged in that slot today
 */
export async function getMealDetailData(slot: MealSlot): Promise<MealDetailPageData> {
  // readLocalMeals touches cookies(), so this read belongs to the request.
  const rows = withLocalMeals(await readLocalMeals());
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);

  if (!hasBackend) {
    return adaptMealDetailPageData(getMockDailyMenu(), rows, slot, MOCK_TODAY);
  }

  // TODO: fetch getTodayMenu + getNutritionHistory in parallel and pass the live payloads
  // through adaptMealDetailPageData, exactly as the mock branch above does.
  return adaptMealDetailPageData(getMockDailyMenu(), rows, slot, MOCK_TODAY);
}
