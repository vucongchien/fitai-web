import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise, SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
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

// The old `SetTimer` offered a "Restart" control because its "+10s" label was
// ambiguous. The redesigned footer replaces both with two explicitly named
// controls — "Done" and "Add 10 seconds" — and no restart at all, so the same
// concern is now asserted against the screen that replaced it.
describe("ActiveExerciseScreen set controls", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the footer controls explicitly and offers no restart", () => {
    const mockExercise: LiveExercise = {
      breathingCue: "Exhale as you press.",
      commonMistakes: [],
      durationSeconds: 0,
      equipmentId: "eq_bench",
      exerciseId: "ex_bench",
      formCues: [],
      hasAiSupported: false,
      instructions: "",
      isWeighted: true,
      name: "Bench Press",
      notes: "Control tempo",
      phase: "main",
      restExerciseSec: 90,
      restSetSec: 60,
      targetReps: 10,
      targetRpe: 8,
      targetSets: 3,
      targetWeightKg: 60,
    };

    render(
      <ActiveExerciseScreen
        cameraActive={false}
        currentSet={1}
        exercise={mockExercise}
        onAddTime={vi.fn()}
        onBack={vi.fn()}
        onDone={vi.fn()}
        onOpenGuide={vi.fn()}
        onToggleFullscreen={vi.fn()}
        onToggleVoice={vi.fn()}
        secondsLeft={0}
        totalSets={3}
        voiceOn={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 10 seconds" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restart/i })).not.toBeInTheDocument();
  });
});
