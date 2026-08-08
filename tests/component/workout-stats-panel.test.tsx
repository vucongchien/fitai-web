import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from "@testing-library/react";

import {
  WorkoutStatsPanel,
  WorkoutMetricHero,
  TrainingVolumeSection,
} from "@/features/workout-stats/ui/workout-stats-panel";

afterEach(cleanup);

describe(WorkoutStatsPanel, () => {
  const mockData = {
    adherence: { completed: 3, scheduled: 4 },
    dateLabel: "3 – 9 August",
    minutesToday: 45,
    volumeKg: 1250,
    volumeTrend: [
      { key: "W1", volumeKg: 1000 },
      { key: "W2", volumeKg: 1250 },
    ],
  };

  it("renders with action tone (blue) and Dumbbell icon for workout stats", () => {
    const { container } = render(<WorkoutStatsPanel data={mockData} />);

    const ring = container.querySelector(".progress-ring");
    expect(ring).toHaveClass("progress-ring--action");

    // Dumbbell icon in progress ring center
    const iconSpan = container.querySelector(".progress-ring__icon");
    expect(iconSpan).not.toBeNull();
    expect(iconSpan?.querySelector("svg")).not.toBeNull();
  });

  it("renders children between WorkoutMetricHero and TrainingVolumeSection", () => {
    const { container } = render(
      <WorkoutStatsPanel data={mockData}>
        <div data-testid="week-1-content">Week 1 Sessions</div>
      </WorkoutStatsPanel>
    );

    const childrenNode = screen.getByTestId("week-1-content");
    expect(childrenNode).toBeInTheDocument();
    expect(childrenNode.textContent).toBe("Week 1 Sessions");

    // Verify ordering: Progress Ring -> Children (Week 1) -> Training Volume Header
    const ring = container.querySelector(".progress-ring");
    const volumeHeader = screen.getByRole("heading", { name: /training volume/i });

    expect(ring).not.toBeNull();
    expect(volumeHeader).not.toBeNull();

    // Verify children appears after ring and before volume header in DOM order
    expect(
      ring!.compareDocumentPosition(childrenNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      childrenNode.compareDocumentPosition(volumeHeader) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("renders children even if workout stats data has an error", () => {
    const errorData = {
      ...mockData,
      error: { type: "CONNECTION_ERROR" as const, message: "gRPC error" },
    };

    render(
      <WorkoutStatsPanel data={errorData}>
        <div data-testid="week-1-fallback">Week 1 Fallback Content</div>
      </WorkoutStatsPanel>
    );

    expect(screen.getByTestId("week-1-fallback")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /training volume/i })).toBeNull();
  });

  it("renders standalone WorkoutMetricHero and TrainingVolumeSection cleanly", () => {
    const { container: heroContainer } = render(<WorkoutMetricHero data={mockData} />);
    expect(heroContainer.querySelector(".progress-ring")).not.toBeNull();

    const { container: volumeContainer } = render(<TrainingVolumeSection data={mockData} />);
    expect(volumeContainer.querySelector(".content-section")).not.toBeNull();
  });
});
