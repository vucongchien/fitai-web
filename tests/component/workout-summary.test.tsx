import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { WorkoutSummaryView } from "@/features/workout/ui/live/workout-summary-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/shared/ui/page-transition", () => ({
  PageTransition: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe("WorkoutSummaryView", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders report stats from sessionStorage when available", async () => {
    const mockReport: SessionReport = {
      averageFormScore: 88,
      averageRpe: 7.2,
      durationMin: 35,
      estimatedCalories: 280,
      hasUnverifiedSets: false,
      personalRecords: [
        { exerciseId: "bench_press", name: "Barbell Bench Press", oneRepMaxKg: 100 },
      ],
      sessionId: "session_test_1",
      totalSets: 8,
      totalVolumeKg: 3200,
    };

    sessionStorage.setItem(reportStorageKey("session_test_1"), JSON.stringify(mockReport));

    render(<WorkoutSummaryView sessionId="session_test_1" />);

    expect(await screen.findByText("Session complete.")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3,200 kg")).toBeInTheDocument();
    expect(screen.getByText("7.2 RPE")).toBeInTheDocument();
    expect(screen.getByText("Form Score: 88%")).toBeInTheDocument();
    expect(screen.getByText("New Personal Records!")).toBeInTheDocument();
    expect(screen.getByText("Barbell Bench Press (100 kg 1RM)")).toBeInTheDocument();
  });

  it("shows unavailable state when no report in sessionStorage", async () => {
    render(<WorkoutSummaryView sessionId="session_non_existent" />);

    expect(await screen.findByText("Session Summary Unavailable")).toBeInTheDocument();
    expect(screen.getByText("No workout report was found for this session.")).toBeInTheDocument();
  });
});
