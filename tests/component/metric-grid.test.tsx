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
import { getMockWorkoutStatsData } from "@/features/workout-stats/server/get-mock-workout-stats";

// This project's vitest config does not enable `globals`, so RTL auto-cleanup is off.
afterEach(cleanup);

const card: MetricCard = {
  goal: "of 2,050 kcal",
  goalIsTarget: true,
  icon: "flame",
  id: "calories-consumed",
  percentage: 69,
  title: "Calories consumed",
  value: "1,420",
};

describe("MetricGrid", () => {
  it("shows the actual value alongside its target", () => {
    render(<MetricGrid metrics={[card]} />);

    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("of 2,050 kcal")).toBeInTheDocument();
  });

  it("exposes the target as a progressbar when one exists", () => {
    render(<MetricGrid metrics={[card]} />);

    const bar = screen.getByRole("progressbar", {
      name: "Calories consumed: 69 percent of target",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "69");
  });

  it("omits the progressbar when the wire carries no target", () => {
    render(
      <MetricGrid
        metrics={[{ ...card, goal: "over the last 7 days", goalIsTarget: false, percentage: null }]}
      />,
    );

    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

describe("home overview mapping", () => {
  const overview = adaptHomeOverview(
    getMockNutritionSummary(),
    getMockMealRows(),
    getMockWorkoutStatsData(),
    MOCK_TODAY,
  );

  it("builds exactly six metric cards", () => {
    expect(overview.metrics).toHaveLength(6);
  });

  it("excludes metrics the protos cannot supply", () => {
    const titles = overview.metrics.map((metric) => metric.title.toLowerCase()).join(" ");

    expect(titles).not.toContain("water");
    expect(titles).not.toContain("burned");
    expect(titles).not.toContain("active minutes");
  });

  it("derives the nutrition goal percentage from the summary", () => {
    // 1420 / 2050 = 69.27% -> 69
    expect(overview.nutritionGoalPercentage).toBe(69);
  });

  it("gives volume and sets a trailing comparison instead of a fabricated target", () => {
    const volume = overview.metrics.find((metric) => metric.id === "training-volume");

    expect(volume?.goalIsTarget).toBe(false);
    expect(volume?.percentage).toBeNull();
  });

  it("renders every card with real content", () => {
    render(<MetricGrid metrics={overview.metrics} />);

    expect(screen.getByText("Calories consumed")).toBeInTheDocument();
    expect(screen.getByText("Training volume")).toBeInTheDocument();
    expect(screen.getByText("Meals logged")).toBeInTheDocument();
  });
});
