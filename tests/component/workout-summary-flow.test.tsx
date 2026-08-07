import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { LiveExercise, SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
import { WorkoutSummaryView } from "@/features/workout/ui/live/workout-summary-view";

type ActiveScreenProps = ComponentProps<typeof ActiveExerciseScreen>;

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

describe("workoutSummaryView Component", () => {
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
      recentAvgVolumeKg: 1200,
      sessionId,
      totalSets: 6,
      totalVolumeKg: 1500,
    };

    sessionStorage.setItem(reportStorageKey(sessionId), JSON.stringify(report));

    render(<WorkoutSummaryView sessionId={sessionId} />);

    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
    // Time and volume are the two numbers the summary keeps; set count, RPE and
    // Form score were dropped so the page has a focus.
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText(/1,500 kg/i)).toBeInTheDocument();
    expect(screen.queryByText(/RPE/i)).not.toBeInTheDocument();
    expect(screen.getByText(/barbell squat/i)).toBeInTheDocument();
    // 1500 vs a 1200 average is +25%.
    expect(screen.getByText("25% more volume than your recent average.")).toBeInTheDocument();
  });

  it("offers a way back out of the summary", () => {
    const sessionId = "session_back";
    const report: SessionReport = {
      averageFormScore: null,
      averageRpe: null,
      durationMin: 20,
      estimatedCalories: 100,
      hasUnverifiedSets: false,
      personalRecords: [],
      recentAvgVolumeKg: 0,
      sessionId,
      totalSets: 2,
      totalVolumeKg: 400,
    };
    sessionStorage.setItem(reportStorageKey(sessionId), JSON.stringify(report));

    render(<WorkoutSummaryView sessionId={sessionId} />);

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/home");
  });

  it("omits the comparison when there is no history to compare against", () => {
    const sessionId = "session_first";
    const report: SessionReport = {
      averageFormScore: null,
      averageRpe: null,
      durationMin: 20,
      estimatedCalories: 100,
      hasUnverifiedSets: false,
      personalRecords: [],
      recentAvgVolumeKg: 0,
      sessionId,
      totalSets: 2,
      totalVolumeKg: 400,
    };
    sessionStorage.setItem(reportStorageKey(sessionId), JSON.stringify(report));

    render(<WorkoutSummaryView sessionId={sessionId} />);

    expect(screen.queryByText(/recent average/i)).not.toBeInTheDocument();
  });

  it("renders Error State cleanly when sessionStorage has no data (no fake 2160kg report)", () => {
    render(<WorkoutSummaryView sessionId="non_existent_session" />);

    expect(screen.getByText(/session summary unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/no workout report was found for this session/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toBeInTheDocument();
  });
});

// The old `SetTimer` offered a "Restart" control because its "+10s" label was
// Ambiguous. The redesigned footer replaces both with two explicitly named
// Controls — "Done" and "Add 10 seconds" — and no restart at all, so the same
// Concern is now asserted against the screen that replaced it.
describe("activeExerciseScreen set controls", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the footer controls explicitly and offers no restart", () => {
    render(
      <ActiveExerciseScreen
        cameraActive={false}
        currentSet={1}
        exercise={mockExercise}
        onAddTime={vi.fn<ActiveScreenProps["onAddTime"]>()}
        onBack={vi.fn<ActiveScreenProps["onBack"]>()}
        onDone={vi.fn<ActiveScreenProps["onDone"]>()}
        onOpenGuide={vi.fn<ActiveScreenProps["onOpenGuide"]>()}
        onReportPain={vi.fn<ActiveScreenProps["onReportPain"]>()}
        onToggleFullscreen={vi.fn<ActiveScreenProps["onToggleFullscreen"]>()}
        onToggleVoice={vi.fn<ActiveScreenProps["onToggleVoice"]>()}
        secondsLeft={0}
        totalSets={3}
        voiceOn={false}
      />,
    );

    // This set is rep-based with no camera counting, so there is no clock and
    // Nothing to extend: one confirm control, and still no restart.
    expect(screen.getByRole("button", { name: "Complete this set" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add 10 seconds" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restart/i })).not.toBeInTheDocument();
  });
});
