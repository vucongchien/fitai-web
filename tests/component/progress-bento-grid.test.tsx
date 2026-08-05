import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getMockProgressStats } from "@/features/progress/model/progress-aggregator";
import { ProgressBentoGrid } from "@/features/progress/ui/progress-bento-grid";

describe("ProgressBentoGrid Component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders loading skeleton state correctly", () => {
    render(<ProgressBentoGrid isLoading />);
    expect(screen.getByRole("region", { name: /loading progress stats/i })).toBeInTheDocument();
  });

  it("renders error state with retry button", () => {
    render(<ProgressBentoGrid isError onRetry={() => {}} />);
    expect(screen.getByText(/unable to load progress data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeInTheDocument();
  });

  it("renders empty state when totalWorkoutsCompleted is 0", () => {
    const mockStats = getMockProgressStats();
    mockStats.totalWorkoutsCompleted = 0;
    render(<ProgressBentoGrid stats={mockStats} />);
    expect(screen.getByText(/start your progress journey/i)).toBeInTheDocument();
  });

  it("renders success state with streak, weekly activity, and PRs", () => {
    const mockStats = getMockProgressStats();
    render(<ProgressBentoGrid stats={mockStats} />);

    expect(screen.getAllByText(/consistency streak/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly activity/i)).toBeInTheDocument();
    expect(screen.getByText(/personal records/i)).toBeInTheDocument();
    expect(screen.getByText(/goblet squat/i)).toBeInTheDocument();
  });
});
