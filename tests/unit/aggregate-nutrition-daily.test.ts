import { describe, expect, it } from 'vitest';
import type { MealLogRow } from "@/shared/api/bff/aggregate/nutrition-daily";
import {
  averageDailyProtein,
  countLoggedDays,
  countMeals,
  dailyCalorieSeries,
  groupMealsBySlot,
  toMealSlot,
} from "@/shared/api/bff/aggregate/nutrition-daily";

function row(
  overrides: Partial<MealLogRow> & Pick<MealLogRow, "loggedAt" | "mealType">,
): MealLogRow {
  return {
    calories: 500,
    carbs: 40,
    fat: 15,
    mealLogId: `${overrides.mealType}-${overrides.loggedAt}`,
    mealName: "Meal",
    protein: 30,
    ...overrides,
  };
}

const rows: MealLogRow[] = [
  row({ calories: 420, loggedAt: "2026-08-06T07:30:00Z", mealName: "Pho", mealType: "BREAKFAST" }),
  row({ calories: 180, loggedAt: "2026-08-06T10:00:00Z", mealName: "Apple", mealType: "SNACK" }),
  row({ calories: 620, loggedAt: "2026-08-06T12:30:00Z", mealName: "Chicken", mealType: "LUNCH" }),
  row({ calories: 700, loggedAt: "2026-08-05T19:00:00Z", mealName: "Salmon", mealType: "DINNER" }),
];

describe(toMealSlot, () => {
  it("normalizes the proto's bare string values", () => {
    expect(toMealSlot("BREAKFAST")).toBe("breakfast");
    expect(toMealSlot("lunch")).toBe("lunch");
    expect(toMealSlot(" Dinner ")).toBe("dinner");
    expect(toMealSlot("SNACKS")).toBe("snack");
  });

  it("returns null for an unrecognized value instead of guessing", () => {
    expect(toMealSlot("BRUNCH")).toBeNull();
  });
});

describe(countMeals, () => {
  it("counts only rows logged on the given day", () => {
    expect(countMeals(rows, "2026-08-06")).toBe(3);
    expect(countMeals(rows, "2026-08-05")).toBe(1);
  });

  it("returns zero for a day with nothing logged", () => {
    expect(countMeals(rows, "2026-08-04")).toBe(0);
  });
});

describe(groupMealsBySlot, () => {
  it("always returns all four slots so each can render its own empty state", () => {
    const groups = groupMealsBySlot(rows, "2026-08-06");
    expect(groups.map((group) => group.slot)).toStrictEqual([
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ]);
  });

  it("sums calories per slot and keeps the day's rows only", () => {
    const groups = groupMealsBySlot(rows, "2026-08-06");
    const bySlot = Object.fromEntries(groups.map((group) => [group.slot, group.calories]));

    expect(bySlot.breakfast).toBe(420);
    expect(bySlot.lunch).toBe(620);
    expect(bySlot.snack).toBe(180);
    expect(bySlot.dinner).toBe(0);
  });

  it("orders meals within a slot by clock time", () => {
    const sameSlot = [
      row({ loggedAt: "2026-08-06T21:00:00Z", mealName: "Late", mealType: "SNACK" }),
      row({ loggedAt: "2026-08-06T09:00:00Z", mealName: "Early", mealType: "SNACK" }),
    ];
    const snack = groupMealsBySlot(sameSlot, "2026-08-06").find((group) => group.slot === "snack");

    expect(snack?.meals.map((meal) => meal.name)).toStrictEqual(["Early", "Late"]);
  });

  it("exposes a clock label per meal", () => {
    const breakfast = groupMealsBySlot(rows, "2026-08-06").find(
      (group) => group.slot === "breakfast",
    );
    expect(breakfast?.meals[0]?.time).toBe("07:30");
  });
});

describe(dailyCalorieSeries, () => {
  it("buckets calories by day across the window, oldest first", () => {
    const series = dailyCalorieSeries(rows, "2026-08-06", 3);

    expect(series).toStrictEqual([
      { calories: null, key: "2026-08-04" },
      { calories: 700, key: "2026-08-05" },
      { calories: 1220, key: "2026-08-06" },
    ]);
  });

  it("marks an unlogged day as null rather than a measured zero", () => {
    const series = dailyCalorieSeries([], "2026-08-06", 2);
    expect(series.every((point) => point.calories === null)).toBe(true);
  });
});

describe(averageDailyProtein, () => {
  it("averages across days that have logs, not across the whole window", () => {
    // 2026-08-06 has 3 rows x 30g = 90g; 2026-08-05 has 1 row x 30g = 30g.
    // Two logged days -> (90 + 30) / 2 = 60.
    expect(averageDailyProtein(rows, "2026-08-06", 7)).toBe(60);
  });

  it("returns null when nothing is logged instead of zero", () => {
    expect(averageDailyProtein([], "2026-08-06", 7)).toBeNull();
  });

  it("ignores rows outside the window", () => {
    expect(averageDailyProtein(rows, "2026-08-06", 1)).toBe(90);
  });
});

describe(countLoggedDays, () => {
  it("counts distinct days with at least one meal", () => {
    expect(countLoggedDays(rows, "2026-08-06", 7)).toBe(2);
  });

  it("returns zero for an empty log", () => {
    expect(countLoggedDays([], "2026-08-06", 7)).toBe(0);
  });
});

describe("normalizeTodayMenu with real DB JSON payload", () => {
  const realDbJson = [
    {
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
      mealType: "Breakfast",
      scheduledTime: "12:00",
    },
    {
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
      mealType: "Lunch",
      scheduledTime: "12:00",
    },
    {
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
      mealType: "Dinner",
      scheduledTime: "12:00",
    },
    {
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
      mealType: "Snack",
      scheduledTime: "12:00",
    },
  ];

  it("correctly normalizes all 4 separate slots without bundling into snack", () => {
    const normalized = groupMealsBySlot([], "2026-08-06", realDbJson);

    expect(normalized).toHaveLength(4);

    const bf = normalized.find((g) => g.slot === "breakfast");
    const lu = normalized.find((g) => g.slot === "lunch");
    const dn = normalized.find((g) => g.slot === "dinner");
    const sn = normalized.find((g) => g.slot === "snack");

    expect(bf?.plannedMeal?.name).toBe("Boiled Eggs with Brown Rice and Steamed Broccoli");
    expect(bf?.plannedMeal?.scheduledTime).toBe("12:00");
    expect(bf?.plannedMeal?.ingredients).toHaveLength(5);
    expect(bf?.plannedMeal?.cookingSteps).toHaveLength(4);

    expect(lu?.plannedMeal?.name).toBe("Scrambled Eggs with Boiled Sweet Potato and Broccoli");
    expect(lu?.plannedMeal?.scheduledTime).toBe("12:00");
    expect(lu?.plannedMeal?.ingredients).toHaveLength(5);

    expect(dn?.plannedMeal?.name).toBe("Boiled Eggs with Brown Rice and Steamed Broccoli");
    expect(sn?.plannedMeal?.name).toBe("Scrambled Eggs with Boiled Sweet Potato and Broccoli");
  });
});
