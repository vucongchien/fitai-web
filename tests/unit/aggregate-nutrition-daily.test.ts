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
