import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { Equipment } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    exerciseId: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    phase: "main",
    equipment: Equipment.DUMBBELL,
    targetSets: 1,
    targetReps: 5,
    durationSeconds: 0,
    targetWeightKg: 15,
    isWeighted: true,
    restSetSec: 15,
    restExerciseSec: 15,
    targetRpe: 7.5,
    notes: "AI Camera Tracking (front view recommended)",
    instructions: [
      "Raise arms out to the sides up to shoulder height with a slight bend in elbows.",
    ],
    formCues: ["Lead with elbows", "Raise to shoulder level", "No torso momentum"],
    commonMistakes: ["Using body swing to lift weights"],
    breathingCue: "Inhale on eccentric, exhale on effort",
    videoUrl: "https://www.youtube.com/watch?v=AJZRMJ7qlbo",
    images: ["https://static.exercisedb.dev/media/DsgkuIt.gif"],
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

  it("renders the start frame image", () => {
    const exercise = makeExercise();
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    const img = screen.getByRole("img", { name: "Dumbbell Lateral Raise – start position" });
    expect(img).toHaveAttribute("src", expect.stringContaining("DsgkuIt.gif"));
  });

  it("renders both static frames when the exercise has a start and an end image", () => {
    const exercise = makeExercise({ images: ["https://img/0.jpg", "https://img/1.jpg"] });
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.getByRole("img", { name: /start position/u })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /end position/u })).toBeInTheDocument();
  });

  it("lists every instruction step", () => {
    const exercise = makeExercise({ instructions: ["Stand tall.", "Raise the arms."] });
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.getByText("Stand tall.")).toBeInTheDocument();
    expect(screen.getByText("Raise the arms.")).toBeInTheDocument();
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

  it("renders fallback icon gracefully when no image is provided", () => {
    const exercise = makeExercise({ images: [] });
    const { container } = render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.queryByRole("img", { name: "Dumbbell Lateral Raise" })).not.toBeInTheDocument();
    expect(container.querySelector(".detail-thumb__fallback")).toBeInTheDocument();
  });

  it("renders all exercise instructional content and form cues", () => {
    const exercise = makeExercise();
    render(<InstructionsSheet exercise={exercise} onClose={vi.fn()} />);

    expect(screen.getByText("How to do it")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Dumbbell Lateral Raise" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Raise arms out to the sides up to shoulder height with a slight bend in elbows.",
      ),
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
      <InstructionsSheet exercise={makeExercise()} onClose={vi.fn()} onWatchVideo={onWatchVideo} />,
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
