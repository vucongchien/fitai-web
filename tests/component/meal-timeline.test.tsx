import { afterEach, describe, expect, it } from 'vitest';
import { afterEach, describe, expect, it } from '@jest/globals';
import { cleanup, render, screen } from "@testing-library/react";

import { getMockMealRows, MOCK_TODAY } from "../mocks/nutrition-fixtures";
import { MealTimeline } from "@/features/nutrition/ui/meal-timeline";
import { groupMealsBySlot } from "@/shared/api/bff/aggregate/nutrition-daily";

// This project's vitest config does not enable `globals`, so RTL auto-cleanup is off.
afterEach(cleanup);

describe(MealTimeline, () => {
  const slots = groupMealsBySlot(getMockMealRows(), MOCK_TODAY);

  it("renders all four slots so the day reads as a complete plan", () => {
    render(<MealTimeline slots={slots} />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Snacks")).toBeInTheDocument();
  });

  it("marks an unlogged slot as not logged instead of showing zero calories", () => {
    render(<MealTimeline slots={slots} />);

    // The mock logs no dinner today.
    expect(screen.getByText("Not logged")).toBeInTheDocument();
    expect(screen.queryByText("0 kcal")).toBeNull();
  });

  it("shows each logged meal with its clock time", () => {
    render(<MealTimeline slots={slots} />);

    expect(screen.getByText("Lean beef pho")).toBeInTheDocument();
    expect(screen.getByText("07:30")).toBeInTheDocument();
  });

  it("sums calories for a slot holding more than one meal", () => {
    render(<MealTimeline slots={slots} />);

    // Two snacks: 180 + 210.
    expect(screen.getByText("390 kcal")).toBeInTheDocument();
  });

  it("renders an all-empty day without inventing readings", () => {
    render(<MealTimeline slots={groupMealsBySlot([], MOCK_TODAY)} />);

    expect(screen.getAllByText("Not logged")).toHaveLength(4);
  });
});
