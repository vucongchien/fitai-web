import { describe, expect, it } from "vitest";

import type { DailyMenuRows } from "@/features/nutrition/model/meal-detail.mapper";
import {
  adaptMealDetailPageData,
  toPriceTier,
} from "@/features/nutrition/model/meal-detail.mapper";
import { getMockMealRows, MOCK_TODAY } from "@/features/nutrition/server/get-mock-nutrition-data";

const menu: DailyMenuRows = {
  breakfast: [
    {
      calories: 420.4,
      carbs: 48,
      description: "Broth and noodles.",
      fat: 9,
      mealName: "Lean beef pho",
      priceTier: "MEDIUM",
      protein: 32,
      recipeSteps: ["Simmer the bones.", "Blanch the noodles."],
    },
  ],
  snack: [
    {
      calories: 180,
      carbs: 22,
      description: "Fruit and nuts.",
      fat: 7,
      mealName: "Apple and almonds",
      priceTier: "LOW",
      protein: 6,
      recipeSteps: [],
    },
  ],
};

describe("toPriceTier", () => {
  it("normalizes the proto's bare string values", () => {
    expect(toPriceTier("LOW")).toBe("low");
    expect(toPriceTier(" medium ")).toBe("medium");
    expect(toPriceTier("High")).toBe("high");
  });

  it("returns null for an unrecognized tier rather than guessing", () => {
    expect(toPriceTier("PREMIUM")).toBeNull();
    expect(toPriceTier("")).toBeNull();
  });
});

describe("adaptMealDetailPageData", () => {
  it("picks the requested slot's options and rounds them for display", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.choices).toHaveLength(1);
    expect(data.choices[0]?.name).toBe("Lean beef pho");
    expect(data.choices[0]?.calories).toBe(420);
    expect(data.choices[0]?.priceTier).toBe("medium");
  });

  it("carries the recipe steps through in order", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.choices[0]?.recipeSteps).toEqual(["Simmer the bones.", "Blanch the noodles."]);
  });

  it("keeps an empty recipe empty rather than inventing steps", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "snack", MOCK_TODAY);
    expect(data.choices[0]?.recipeSteps).toEqual([]);
  });

  it("pulls today's logged rows for that slot out of the flat history", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.loggedMeals.map((meal) => meal.name)).toEqual(["Lean beef pho"]);
    expect(data.loggedCalories).toBe(420);
  });

  it("sums a slot holding more than one logged meal", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "snack", MOCK_TODAY);

    // The mock logs an apple (180) and a yoghurt (210) as snacks today.
    expect(data.loggedMeals).toHaveLength(2);
    expect(data.loggedCalories).toBe(390);
  });

  it("reports an empty slot without inventing a reading", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "dinner", MOCK_TODAY);

    expect(data.loggedMeals).toEqual([]);
    expect(data.loggedCalories).toBe(0);
    // The mock menu defines no dinner options.
    expect(data.choices).toEqual([]);
  });

  it("labels the slot for the heading", () => {
    expect(adaptMealDetailPageData(menu, [], "snack", MOCK_TODAY).slotLabel).toBe("Snacks");
  });
});
