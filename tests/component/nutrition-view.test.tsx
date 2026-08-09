import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from "@testing-library/react";

import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import { NutritionView } from "@/features/nutrition/ui/nutrition-view";

afterEach(cleanup);

describe(NutritionView, () => {
  const mockData: NutritionPageData = {
    calorieSeries: [{ calories: 2000, key: "2026-08-06" }],
    caloriesAverage: 1950,
    caloriesTargetPerDay: 2000,
    dateLabel: "Thursday 6 August",
    daysLogged: 5,
    macros: [
      { gramsPerDay: 150, label: "Protein" },
      { gramsPerDay: 220, label: "Carbs" },
      { gramsPerDay: 65, label: "Fat" },
    ],
    mealsLogged: 12,
    slots: [],
  };

  it("renders with recovery tone (green) for nutrition view", () => {
    const { container } = render(<NutritionView data={mockData} />);

    const ring = container.querySelector(".progress-ring");
    expect(ring).toHaveClass("progress-ring--recovery");

    const iconSpan = container.querySelector(".progress-ring__icon");
    expect(iconSpan).not.toBeNull();
    expect(iconSpan?.querySelector("svg")).not.toBeNull();
  });
});
