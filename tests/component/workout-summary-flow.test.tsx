import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { SetTimer } from "@/features/workout/ui/live/set-timer";
import { WorkoutSummaryView } from "@/features/workout/ui/live/workout-summary-view";

describe("WorkoutSummaryView Component", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("renders report successfully when sessionStorage has report data", () => {
    const sessionId = "session_123";
    const report: SessionReport = {
      averageFormScore: 92,
      averageRpe: 7.5,
      durationMin: 30,
      estimatedCalories: 250,
      hasUnverifiedSets: false,
      personalRecords: [{ exerciseId: "ex_1", name: "Barbell Squat", oneRepMaxKg: 100 }],
      sessionId,
      totalSets: 6,
      totalVolumeKg: 1500,
    };

    sessionStorage.setItem(reportStorageKey(sessionId), JSON.stringify(report));

    render(<WorkoutSummaryView sessionId={sessionId} />);

    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText(/1,500 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/7.5 RPE/i)).toBeInTheDocument();
    expect(screen.getByText(/barbell squat/i)).toBeInTheDocument();
  });

  it("renders Error State cleanly when sessionStorage has no data (no fake 2160kg report)", () => {
    render(<WorkoutSummaryView sessionId="non_existent_session" />);

    expect(screen.getByText(/session summary unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/no workout report was found for this session/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toBeInTheDocument();
  });
});

describe("SetTimer Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Restart button with RotateCcw icon instead of confusing +10s label", () => {
    const mockExercise = {
      exerciseId: "ex_bench",
      name: "Bench Press",
      phase: "main" as const,
      equipmentId: "eq_bench",
      targetSets: 3,
      targetReps: 10,
      durationSeconds: 0,
      targetWeightKg: 60,
      isWeighted: true,
      restSetSec: 60,
      restExerciseSec: 90,
      targetRpe: 8,
      notes: "Control tempo",
      formCues: [],
      commonMistakes: [],
      hasAiSupported: false,
    };

    const handleRestart = vi.fn();
    const handleFinish = vi.fn();
    const handleStart = vi.fn();

    render(
      <SetTimer
        exercise={mockExercise}
        onFinish={handleFinish}
        onRestart={handleRestart}
        onStart={handleStart}
        running={true}
        secondsLeft={0}
      />,
    );

    const restartBtn = screen.getByRole("button", { name: /restart/i });
    expect(restartBtn).toBeInTheDocument();
  });
});
