import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    exerciseId: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    phase: "main",
    equipmentId: "eq-dumbbell",
    targetSets: 1,
    targetReps: 5,
    durationSeconds: 0,
    targetWeightKg: 15,
    isWeighted: true,
    restSetSec: 15,
    restExerciseSec: 15,
    targetRpe: 7.5,
    notes: "AI Camera Tracking (front view recommended)",
    instructions:
      "Raise arms out to the sides up to shoulder height with a slight bend in elbows.",
    formCues: ["Lead with elbows", "Raise to shoulder level", "No torso momentum"],
    commonMistakes: ["Using body swing to lift weights"],
    breathingCue: "Inhale on eccentric, exhale on effort",
    videoUrl: "https://www.youtube.com/watch?v=AJZRMJ7qlbo",
    thumbnailUrl: "https://static.exercisedb.dev/media/DsgkuIt.gif",
    hasAiSupported: true,
    ...overrides,
  };
}

describe("InstructionsSheet Component", () => {
  beforeEach(() => {
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(),
      cancel: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the exercise thumbnail image matching exercise search catalog", () => {
    const exercise = makeExercise();
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    const img = screen.getByRole("img", { name: "Dumbbell Lateral Raise" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("DsgkuIt.gif"));
  });

  it("displays the AI indicator tag on the thumbnail when exercise has AI support", () => {
    const exercise = makeExercise({ hasAiSupported: true });
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.getByLabelText("AI form tracking")).toBeInTheDocument();
  });

  it("does not display the AI tag when exercise has no AI support", () => {
    const exercise = makeExercise({ hasAiSupported: false });
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.queryByLabelText("AI form tracking")).not.toBeInTheDocument();
  });

  it("renders fallback icon gracefully when thumbnailUrl is not provided", () => {
    const exercise = makeExercise({ thumbnailUrl: "" });
    const { container } = render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.queryByRole("img", { name: "Dumbbell Lateral Raise" })).not.toBeInTheDocument();
    expect(container.querySelector(".detail-thumb__fallback")).toBeInTheDocument();
  });

  it("renders all exercise instructional content and form cues", () => {
    const exercise = makeExercise();
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.getByText("How to do it")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Dumbbell Lateral Raise" })).toBeInTheDocument();
    expect(
      screen.getByText("Raise arms out to the sides up to shoulder height with a slight bend in elbows."),
    ).toBeInTheDocument();
    expect(screen.getByText("AI Camera Tracking (front view recommended)")).toBeInTheDocument();
    expect(screen.getByText("Inhale on eccentric, exhale on effort")).toBeInTheDocument();
    expect(screen.getByText("Lead with elbows")).toBeInTheDocument();
    expect(screen.getByText("Raise to shoulder level")).toBeInTheDocument();
    expect(screen.getByText("No torso momentum")).toBeInTheDocument();
  });

  it("shows demo video watch button when videoUrl and onWatchVideo are provided", () => {
    const onWatchVideo = vi.fn();
    render(
      <InstructionsSheet
        exercise={makeExercise()}
        onClose={vi.fn()}
        onWatchVideo={onWatchVideo}
      />,
    );

    const videoBtn = screen.getByRole("button", { name: "Watch tutorial video" });
    expect(videoBtn).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<InstructionsSheet exercise={makeExercise()} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    vi.advanceTimersByTime(250);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
