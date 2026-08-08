import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import type { DailyMenuRows } from "@/features/nutrition/model/meal-detail.mapper";
import {
  adaptMealDetailPageData,
  toPriceTier,
} from "@/features/nutrition/model/meal-detail.mapper";
import { getMockMealRows, MOCK_TODAY } from "../mocks/nutrition-fixtures";

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

describe(toPriceTier, () => {
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

describe(adaptMealDetailPageData, () => {
  it("picks the requested slot's options and rounds them for display", () => {
    // Nothing is logged, so the option stays in the suggestions.
    const data = adaptMealDetailPageData(menu, [], "breakfast", MOCK_TODAY);

    expect(data.choices).toHaveLength(1);
    expect(data.choices[0]?.name).toBe("Lean beef pho");
    expect(data.choices[0]?.calories).toBe(420);
    expect(data.choices[0]?.priceTier).toBe("medium");
  });

  it("carries the recipe steps through in order", () => {
    const data = adaptMealDetailPageData(menu, [], "breakfast", MOCK_TODAY);

    expect(data.choices[0]?.recipeSteps).toStrictEqual([
      "Simmer the bones.",
      "Blanch the noodles.",
    ]);
  });

  it("keeps an empty recipe empty rather than inventing steps", () => {
    const data = adaptMealDetailPageData(menu, [], "snack", MOCK_TODAY);
    expect(data.choices[0]?.recipeSteps).toStrictEqual([]);
  });

  it("does not offer a dish that was already eaten", () => {
    // The mock logs "Lean beef pho" for breakfast, which is the slot's only option.
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.loggedMeals.map((meal) => meal.name)).toStrictEqual(["Lean beef pho"]);
    expect(data.choices).toStrictEqual([]);
  });

  it("moves the eaten dish's recipe onto the logged row rather than losing it", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.loggedMeals[0]?.recipeSteps).toStrictEqual([
      "Simmer the bones.",
      "Blanch the noodles.",
    ]);
  });

  it("matches dish names case-insensitively and ignoring surrounding space", () => {
    const rows = getMockMealRows().map((row) =>
      row.mealType === "BREAKFAST" ? { ...row, mealName: "  lean BEEF pho " } : row,
    );

    expect(adaptMealDetailPageData(menu, rows, "breakfast", MOCK_TODAY).choices).toStrictEqual([]);
  });

  it("leaves a logged row with no recipe when the menu carries no match", () => {
    const rows = getMockMealRows().map((row) =>
      row.mealType === "BREAKFAST" ? { ...row, mealName: "Something off-menu" } : row,
    );
    const data = adaptMealDetailPageData(menu, rows, "breakfast", MOCK_TODAY);

    expect(data.loggedMeals[0]?.recipeSteps).toStrictEqual([]);
    // The unmatched option stays available as a suggestion.
    expect(data.choices).toHaveLength(1);
  });

  it("pulls today's logged rows for that slot out of the flat history", () => {
    const data = adaptMealDetailPageData(menu, getMockMealRows(), "breakfast", MOCK_TODAY);

    expect(data.loggedMeals.map((meal) => meal.name)).toStrictEqual(["Lean beef pho"]);
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

    expect(data.loggedMeals).toStrictEqual([]);
    expect(data.loggedCalories).toBe(0);
    // The mock menu defines no dinner options.
    expect(data.choices).toStrictEqual([]);
  });

  it("labels the slot for the heading", () => {
    expect(adaptMealDetailPageData(menu, [], "snack", MOCK_TODAY).slotLabel).toBe("Snacks");
  });
});
