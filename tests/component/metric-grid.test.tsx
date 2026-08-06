import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { adaptHomeOverview } from "@/features/home/model/home-overview.mapper";
import type { MetricCard } from "@/features/home/model/home-overview.types";
import { MetricGrid } from "@/features/home/ui/metric-grid";
import {
  getMockMealRows,
  getMockNutritionSummary,
  MOCK_TODAY,
} from "@/features/nutrition/server/get-mock-nutrition-data";
import {
  getMockSessionPlans,
  getMockWorkoutStatsData,
} from "@/features/workout-stats/server/get-mock-workout-stats";

// This project's vitest config does not enable `globals`, so RTL auto-cleanup is off.
afterEach(cleanup);

const card: MetricCard = {
  caption: "Today",
  unit: "kcal",
  icon: "flame",
  id: "calories-consumed",
  title: "Calories consumed",
  value: "1,420",
};

describe("MetricGrid", () => {
  it("shows the reading with its unit and period", () => {
    render(<MetricGrid metrics={[card]} />);

    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders no progress bar, because targets live on the overview card", () => {
    render(<MetricGrid metrics={[card]} />);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("omits the unit when a metric carries none", () => {
    render(<MetricGrid metrics={[{ ...card, unit: undefined, value: "5.4t" }]} />);

    expect(screen.getByText("5.4t")).toBeInTheDocument();
    expect(screen.queryByText("kcal")).toBeNull();
  });
});

describe("home overview mapping", () => {
  const overview = adaptHomeOverview(
    getMockNutritionSummary(),
    getMockMealRows(),
    getMockWorkoutStatsData(),
    getMockSessionPlans(),
    MOCK_TODAY,
  );

  it("keeps the grid to the two readings that appear nowhere else", () => {
    expect(overview.metrics.map((metric) => metric.id)).toEqual([
      "calories-consumed",
      "training-volume",
    ]);
  });

  it("excludes metrics the protos cannot supply", () => {
    const titles = overview.metrics.map((metric) => metric.title.toLowerCase()).join(" ");

    expect(titles).not.toContain("water");
    expect(titles).not.toContain("burned");
    expect(titles).not.toContain("active minutes");
  });

  it("derives the nutrition goal percentage for the overview card", () => {
    // 1420 / 2050 = 69.27% -> 69
    expect(overview.nutritionGoalPercentage).toBe(69);
  });

  it("renders both cards with real content", () => {
    render(<MetricGrid metrics={overview.metrics} />);

    expect(screen.getByText("Calories consumed")).toBeInTheDocument();
    expect(screen.getByText("Training volume")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
  });
});
