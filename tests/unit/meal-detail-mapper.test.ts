import { describe, expect, it } from 'vitest';
import type { DailyMenuRows } from "@/features/nutrition/model/meal-detail.mapper";
import {
  adaptMealDetailPageData,
  normalizeTodayMenu,
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

  it("correctly parses user backend meals_json array structure into 4 slots", () => {
    const rawBeJson = [
      {
        mealType: "Breakfast",
        options: [
          { mealName: "Ức gà hấp bông cải xanh kèm cơm trắng", calories: 553.25, isNutiFoodProduct: false },
          { mealName: "Sữa NutiFood Varna Elite Hoàng Gia", calories: 553.25, isNutiFoodProduct: true },
        ],
      },
      {
        mealType: "Lunch",
        options: [
          { mealName: "Ức gà hấp bông cải kèm cơm trắng", calories: 774.55, isNutiFoodProduct: false },
          { mealName: "Sữa NutiFood Varna Elite Hoàng Gia", calories: 774.55, isNutiFoodProduct: true },
        ],
      },
      {
        mealType: "Dinner",
        options: [
          { mealName: "Ức gà áp chảo ăn kèm khoai lang và bông cải xanh", calories: 663.9, isNutiFoodProduct: false },
          { mealName: "Sữa NutiFood Varna Elite Hoàng Gia", calories: 663.9, isNutiFoodProduct: true },
        ],
      },
      {
        mealType: "Snack",
        options: [
          { mealName: "Ức gà áp chảo sốt tiêu ăn kèm khoai lang...", calories: 221.3, isNutiFoodProduct: false },
          { mealName: "Sữa NutiFood Varna Elite Hoàng Gia", calories: 221.3, isNutiFoodProduct: true },
        ],
      },
    ];

    const bfData = adaptMealDetailPageData(rawBeJson as any, [], "breakfast", MOCK_TODAY);
    const luData = adaptMealDetailPageData(rawBeJson as any, [], "lunch", MOCK_TODAY);
    const dnData = adaptMealDetailPageData(rawBeJson as any, [], "dinner", MOCK_TODAY);
    const snData = adaptMealDetailPageData(rawBeJson as any, [], "snack", MOCK_TODAY);

    expect(bfData.choices.map((c) => c.name)).toStrictEqual([
      "Ức gà hấp bông cải xanh kèm cơm trắng",
      "Sữa NutiFood Varna Elite Hoàng Gia",
    ]);
    expect(luData.choices.map((c) => c.name)).toStrictEqual([
      "Ức gà hấp bông cải kèm cơm trắng",
      "Sữa NutiFood Varna Elite Hoàng Gia",
    ]);
    expect(dnData.choices.map((c) => c.name)).toStrictEqual([
      "Ức gà áp chảo ăn kèm khoai lang và bông cải xanh",
      "Sữa NutiFood Varna Elite Hoàng Gia",
    ]);
    expect(snData.choices.map((c) => c.name)).toStrictEqual([
      "Ức gà áp chảo sốt tiêu ăn kèm khoai lang...",
      "Sữa NutiFood Varna Elite Hoàng Gia",
    ]);
  });

  it("extracts ingredients, cookingSteps, scheduledTime and optionId correctly from user DB schema", () => {
    const userDbPayload = [
      {
        mealType: "Breakfast",
        options: [
          {
            calories: 908.0084999999999,
            carbGrams: 39.9,
            cookingSteps: [
              "Boil the chicken eggs in a pot of water for 10 minutes until hard-boiled, then peel and slice.",
              "Warm up the brown rice in a microwave or pan.",
              "Steam the broccoli florets for 4-5 minutes until tender-crisp.",
              "Assemble everything on a plate and season with a pinch of black pepper and olive oil.",
            ],
            fatGrams: 6.38,
            ingredients: [
              { grams: 150, ingredientName: "Chicken Eggs", isSupplementary: false },
              { grams: 200, ingredientName: "Cơm gạo lứt luộc", isSupplementary: false },
              { grams: 120, ingredientName: "Bông cải xanh (Broccoli)", isSupplementary: false },
              { grams: 5, ingredientName: "Olive oil", isSupplementary: false },
              { grams: 1, ingredientName: "Black pepper", isSupplementary: false },
            ],
            isLogged: false,
            isNutiFoodProduct: false,
            mealName: "Boiled Eggs with Brown Rice and Steamed Broccoli",
            optionId: "b2f28d6b-1e4f-4f33-bb4b-812ae9314cc3",
            proteinGrams: 17.68,
          },
        ],
        scheduledTime: "12:00",
      },
      {
        mealType: "Lunch",
        options: [
          {
            calories: 908.0084999999999,
            carbGrams: 48,
            cookingSteps: [
              "Crack the chicken eggs into a bowl, whisk well, and scramble them in a non-stick pan with a touch of olive oil.",
              "Peel and slice the pre-boiled sweet potato.",
              "Blanch the broccoli in boiling water for 3 minutes.",
              "Serve the scrambled eggs alongside the sweet potato and broccoli.",
            ],
            fatGrams: 6.58,
            ingredients: [
              { grams: 150, ingredientName: "Chicken Eggs", isSupplementary: false },
              { grams: 200, ingredientName: "Khoai lang mật luộc", isSupplementary: false },
              { grams: 120, ingredientName: "Bông cải xanh (Broccoli)", isSupplementary: false },
              { grams: 5, ingredientName: "Olive oil", isSupplementary: false },
              { grams: 1, ingredientName: "Salt", isSupplementary: false },
            ],
            isLogged: false,
            isNutiFoodProduct: false,
            mealName: "Scrambled Eggs with Boiled Sweet Potato and Broccoli",
            optionId: "9e459430-d240-47e7-a7e8-f4182abcdd26",
            proteinGrams: 16.4,
          },
        ],
        scheduledTime: "12:00",
      },
    ];

    const bf = adaptMealDetailPageData(userDbPayload as any, [], "breakfast", MOCK_TODAY);
    expect(bf.choices).toHaveLength(1);
    expect(bf.choices[0]?.name).toBe("Boiled Eggs with Brown Rice and Steamed Broccoli");
    expect(bf.choices[0]?.optionId).toBe("b2f28d6b-1e4f-4f33-bb4b-812ae9314cc3");
    expect(bf.choices[0]?.calories).toBe(908);
    expect(bf.choices[0]?.protein).toBe(18);
    expect(bf.choices[0]?.carbs).toBe(40);
    expect(bf.choices[0]?.fat).toBe(6);
    expect(bf.choices[0]?.scheduledTime).toBe("12:00");
    expect(bf.choices[0]?.ingredients).toHaveLength(5);
    expect(bf.choices[0]?.ingredients[0]?.ingredientName).toBe("Chicken Eggs");
    expect(bf.choices[0]?.ingredients[0]?.grams).toBe(150);
    expect(bf.choices[0]?.cookingSteps).toHaveLength(4);

    const lu = adaptMealDetailPageData(userDbPayload as any, [], "lunch", MOCK_TODAY);
    expect(lu.choices).toHaveLength(1);
    expect(lu.choices[0]?.name).toBe("Scrambled Eggs with Boiled Sweet Potato and Broccoli");
    expect(lu.choices[0]?.optionId).toBe("9e459430-d240-47e7-a7e8-f4182abcdd26");
    expect(lu.choices[0]?.ingredients).toHaveLength(5);
    expect(lu.choices[0]?.cookingSteps).toHaveLength(4);
  });
});
