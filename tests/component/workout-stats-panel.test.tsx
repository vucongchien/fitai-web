import { afterEach, describe, expect, it } from 'vitest';
import { afterEach, describe, expect, it } from '@jest/globals';
import { cleanup, render } from "@testing-library/react";

import { WorkoutStatsPanel } from "@/features/workout-stats/ui/workout-stats-panel";

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
});
