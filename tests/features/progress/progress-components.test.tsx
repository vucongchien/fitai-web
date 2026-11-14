import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BodyMetricEntry } from "@/features/progress/model/types";
import { BodySilhouetteCard } from "@/features/progress/ui/body-silhouette-card";
import { ConsistencyHeatmap } from "@/features/progress/ui/consistency-heatmap";
import { MetricTrendSection } from "@/features/progress/ui/metric-trend-section";
import { PhotoComparisonSlider } from "@/features/progress/ui/photo-comparison-slider";

vi.mock("@tanstack/react-charts", () => ({
  Chart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div data-testid="mock-trend-chart" aria-label={ariaLabel} />
  ),
}));

const SAMPLE_ENTRIES: BodyMetricEntry[] = [
  {
    id: "e1",
    loggedAt: "2026-10-01T08:00:00Z",
    dateLabel: "Oct 1",
    weightKg: 75,
    bodyFatPercent: 20,
    heightCm: 175,
    bmi: 24.5,
    leanMassKg: 60,
    fatMassKg: 15,
    progressPhotoUrl: "https://images.unsplash.com/photo-1",
  },
  {
    id: "e2",
    loggedAt: "2026-10-15T08:00:00Z",
    dateLabel: "Oct 15",
    weightKg: 73.2,
    bodyFatPercent: 18.5,
    heightCm: 175,
    bmi: 23.9,
    leanMassKg: 59.7,
    fatMassKg: 13.5,
    progressPhotoUrl: "https://images.unsplash.com/photo-2",
  },
];

describe("Progress UI components", () => {
  it("switches body silhouette zones and displays BMI + composition", () => {
    render(
      <BodySilhouetteCard
        weightKg={73.2}
        heightCm={175}
        bodyFatPercent={18.5}
        preferredMuscleGroups={["CHEST", "LEGS"]}
        activeInjuries={[{ muscleGroup: "SHOULDERS", severity: "MILD" }]}
      />,
    );

    expect(screen.getByText("73.2 kg")).toBeInTheDocument();
    expect(screen.getByText("175 cm")).toBeInTheDocument();
    expect(screen.getByText("23.9")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Upper" }));
    expect(screen.getByText(/Active injury: Shoulders/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Lower" }));
    expect(screen.queryByText(/Active injury: Shoulders/i)).not.toBeInTheDocument();
  });

  it("toggles metric trend between Weight and Body Fat and shows history rows", () => {
    render(
      <MetricTrendSection
        entries={SAMPLE_ENTRIES}
        targetWeightKg={70}
        targetBodyFatPercent={15}
        onOpenLogModal={vi.fn()}
      />,
    );

    expect(screen.getByText(/Down 1.8 kg across 2 check-ins/i)).toBeInTheDocument();
    expect(screen.getByText("73.2 kg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Body Fat (%)" }));
    expect(screen.getByText(/Down 1.5 % across 2 check-ins/i)).toBeInTheDocument();
  });

  it("renders empty, single, and interactive Before/After states in PhotoComparisonSlider", () => {
    const onOpen = vi.fn();
    const { rerender } = render(<PhotoComparisonSlider photos={[]} onOpenLogModal={onOpen} />);
    expect(screen.getByText("No progress photos yet")).toBeInTheDocument();

    rerender(<PhotoComparisonSlider photos={[SAMPLE_ENTRIES[0]]} onOpenLogModal={onOpen} />);
    expect(
      screen.getByText(/Add one more check-in photo to unlock the interactive Before & After/i),
    ).toBeInTheDocument();

    rerender(<PhotoComparisonSlider photos={SAMPLE_ENTRIES} onOpenLogModal={onOpen} />);
    const slider = screen.getByRole("slider", { name: /Before and after comparison slider/i });
    fireEvent.change(slider, { target: { value: "70" } });
    expect(slider).toHaveValue("70");

    // Simulate broken image URL fallback
    const afterImg = screen.getByAltText(/After photo from Oct 15/i);
    fireEvent.error(afterImg);
    expect(screen.getByText("After photo unavailable")).toBeInTheDocument();
  });

  it("inspects a day in ConsistencyHeatmap when clicked", () => {
    render(
      <ConsistencyHeatmap
        weeks={[
          {
            weekIndex: 0,
            monthLabel: "Nov",
            days: [
              { date: "2026-11-09", dayLabel: "Nov 9", count: 1, totalMinutes: 45, intensity: 2 },
              { date: "2026-11-10", dayLabel: "Nov 10", count: 0, totalMinutes: 0, intensity: 0 },
              { date: "2026-11-11", dayLabel: "Nov 11", count: 0, totalMinutes: 0, intensity: 0 },
              { date: "2026-11-12", dayLabel: "Nov 12", count: 0, totalMinutes: 0, intensity: 0 },
              { date: "2026-11-13", dayLabel: "Nov 13", count: 0, totalMinutes: 0, intensity: 0 },
              { date: "2026-11-14", dayLabel: "Nov 14", count: 0, totalMinutes: 0, intensity: 0 },
              { date: "2026-11-15", dayLabel: "Nov 15", count: 0, totalMinutes: 0, intensity: 0 },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nov 9: 1 workouts" }));
    expect(screen.getByText(/Nov 9 · 1 workout \(~45 min\)/i)).toBeInTheDocument();
  });
});
