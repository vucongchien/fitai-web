import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 0,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-russian-twist",
    formCues: [],
    hasAiSupported: true,
    isWeighted: false,
    name: "Russian Twist",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 20,
    targetReps: 10,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

const baseProps = {
  exerciseNumber: 2,
  nextExercise: makeExercise(),
  onAddTime: vi.fn(),
  onBack: vi.fn(),
  onSkipRest: vi.fn(),
  onToggleFullscreen: vi.fn(),
  onToggleVoice: vi.fn(),
  secondsLeft: 20,
  totalExercises: 8,
  totalSeconds: 45,
  voiceOn: false,
  workoutTitle: "Full Body Beginner",
};

describe("RestScreen", () => {
  it("shows the workout name in the header, not the exercise name", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Full Body Beginner" })).toBeInTheDocument();
  });

  it("offers only the audio and fullscreen header actions", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exercise guide" })).not.toBeInTheDocument();
  });

  it("badges the upcoming exercise and names it", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Next Exercise")).toBeInTheDocument();
    expect(screen.getByText("Russian Twist")).toBeInTheDocument();
  });

  it("states the rep prescription", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("10 Reps")).toBeInTheDocument();
  });

  it("states a time prescription in seconds when the next exercise is a hold", () => {
    render(
      <RestScreen
        {...baseProps}
        nextExercise={makeExercise({ durationSeconds: 30, targetReps: 0 })}
      />,
    );

    expect(screen.getByText("30 Seconds")).toBeInTheDocument();
  });

  it("shows the session-wide progress line", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Exercise 2 of 8")).toBeInTheDocument();
  });

  it("labels and shows the rest countdown", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Rest Time Remaining")).toBeInTheDocument();
    expect(screen.getByText("00:20")).toBeInTheDocument();
  });

  it("offers +10 Seconds and Skip Rest as two equal buttons", () => {
    const onAddTime = vi.fn();
    const onSkipRest = vi.fn();
    render(<RestScreen {...baseProps} onAddTime={onAddTime} onSkipRest={onSkipRest} />);

    fireEvent.click(screen.getByRole("button", { name: "+10 Seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip Rest" }));

    expect(onAddTime).toHaveBeenCalledOnce();
    expect(onSkipRest).toHaveBeenCalledOnce();
  });

  it("explains the automatic transition", () => {
    render(<RestScreen {...baseProps} />);

    expect(
      screen.getByText("The next exercise will start automatically when the timer reaches zero."),
    ).toBeInTheDocument();
  });

  it("offers a live-preview camera button when the next exercise is AI-supported", () => {
    render(<RestScreen {...baseProps} onToggleCamera={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open AI camera" })).toBeInTheDocument();
  });

  it("hides the camera button when the next exercise has no AI support", () => {
    render(
      <RestScreen
        {...baseProps}
        nextExercise={makeExercise({ hasAiSupported: false })}
        onToggleCamera={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });
});
