import { afterEach, describe, expect, it, vi } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";

type RestScreenProps = ComponentProps<typeof RestScreen>;

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
  onAddTime: vi.fn<RestScreenProps["onAddTime"]>(),
  onBack: vi.fn<RestScreenProps["onBack"]>(),
  onReportPain: vi.fn<RestScreenProps["onReportPain"]>(),
  onSkipRest: vi.fn<RestScreenProps["onSkipRest"]>(),
  onToggleFullscreen: vi.fn<RestScreenProps["onToggleFullscreen"]>(),
  onToggleVoice: vi.fn<RestScreenProps["onToggleVoice"]>(),
  secondsLeft: 20,
  totalExercises: 8,
  totalSeconds: 45,
  voiceOn: false,
  workoutTitle: "Full Body Beginner",
};

describe(RestScreen, () => {
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

  // Pain does not wait for the next set to begin.
  it("offers the pain report during rest too", () => {
    const onReportPain = vi.fn<RestScreenProps["onReportPain"]>();
    render(<RestScreen {...baseProps} onReportPain={onReportPain} />);

    fireEvent.click(screen.getByRole("button", { name: "Report pain" }));

    expect(onReportPain).toHaveBeenCalledTimes(1);
  });

  it("labels the upcoming exercise and names it", () => {
    const { container } = render(<RestScreen {...baseProps} />);

    expect(container.querySelector(".live-next__badge")?.textContent).toContain("Next");
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

  // The position folded into the "Next" line rather than occupying a fourth
  // Row of its own, which is what freed the vertical space for the media.
  it("shows the session-wide position on the Next line", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("2/8")).toBeInTheDocument();
  });

  it("shows the rest countdown, named for screen readers", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("00:20")).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: "Rest time remaining" })).toBeInTheDocument();
  });

  it("offers +10 Seconds and Skip Rest as two equal buttons", () => {
    const onAddTime = vi.fn<RestScreenProps["onAddTime"]>();
    const onSkipRest = vi.fn<RestScreenProps["onSkipRest"]>();
    render(<RestScreen {...baseProps} onAddTime={onAddTime} onSkipRest={onSkipRest} />);

    fireEvent.click(screen.getByRole("button", { name: "+10 Seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip Rest" }));

    expect(onAddTime).toHaveBeenCalledTimes(1);
    expect(onSkipRest).toHaveBeenCalledTimes(1);
  });

  it("explains the automatic transition", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Next exercise starts automatically at zero.")).toBeInTheDocument();
  });

  // Rest is rest. Nothing is being tracked, so there is no camera to offer and
  // No reason to hold the stream (and its recording indicator) open.
  it("offers no camera controls at all during rest", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });
});
