import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    breathingCue: "Breathe slowly and consistently throughout the exercise.",
    commonMistakes: ["Avoid letting your hips drop or rise too high."],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: ["Keep your elbows directly under your shoulders."],
    hasAiSupported: true,
    instructions: "Maintain a straight body line while keeping your core engaged.",
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

const baseProps = {
  cameraActive: false,
  currentSet: 1,
  exercise: makeExercise(),
  onAddTime: vi.fn(),
  onBack: vi.fn(),
  onDone: vi.fn(),
  onOpenGuide: vi.fn(),
  onToggleCamera: vi.fn(),
  onToggleFullscreen: vi.fn(),
  onToggleVoice: vi.fn(),
  secondsLeft: 30,
  totalSets: 3,
  voiceOn: false,
};

describe("ActiveExerciseScreen", () => {
  it("puts the exercise name in the header", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Plank Hold" })).toBeInTheDocument();
  });

  it("offers exactly the three header actions from the spec", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Exercise guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("shows the target and the set counter in the meta row", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByText("30 sec")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 Sets")).toBeInTheDocument();
  });

  it("formats a rep-based prescription as reps, not seconds", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
      />,
    );

    expect(screen.getByText("10 reps")).toBeInTheDocument();
  });

  it("counts down the hold in the timer bar", () => {
    render(<ActiveExerciseScreen {...baseProps} secondsLeft={30} />);

    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("shows tracked reps instead of a clock when the motion engine is counting", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        repCount={4}
      />,
    );

    expect(screen.getByText("4 / 10")).toBeInTheDocument();
  });

  it("shows an em dash and no arc when nothing is counting reps", () => {
    const { container } = render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        secondsLeft={0}
      />,
    );

    // The target belongs to the meta row, and is not echoed by the ring.
    expect(screen.getAllByText("10 reps")).toHaveLength(1);
    expect(screen.getByRole("timer")).toHaveTextContent("—");
    expect(screen.queryByText("00:00")).not.toBeInTheDocument();
    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
  });

  it("depletes the arc as a timed hold runs down", () => {
    const { container } = render(<ActiveExerciseScreen {...baseProps} secondsLeft={15} />);

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));

    // 15 of 30 seconds left — half the arc is gone.
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.5, 1);
  });

  it("renders the coaching blocks", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByText("Form Tip")).toBeInTheDocument();
    expect(screen.getByText("Breathing")).toBeInTheDocument();
  });

  it("reflects the voice toggle state", () => {
    render(<ActiveExerciseScreen {...baseProps} voiceOn />);

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("wires the Done button", () => {
    const onDone = vi.fn();
    render(<ActiveExerciseScreen {...baseProps} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onDone).toHaveBeenCalledOnce();
  });

  // The ring shows three different things. Announcing a rep count as "time
  // remaining" is false, so the name has to follow the same branch as the value.
  it("names the ring for a timed hold", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("timer")).toHaveAccessibleName("Time remaining in this set");
  });

  it("names the ring for a camera-counted rep set", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        repCount={4}
      />,
    );

    expect(screen.getByRole("timer")).toHaveAccessibleName("Reps completed in this set");
  });

  it("names the ring for a set with neither a clock nor a rep count", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
      />,
    );

    expect(screen.getByRole("timer")).toHaveAccessibleName("This set is not timed");
  });

  it("keeps the add-time control live for a timed hold", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Add 10 seconds" })).toBeEnabled();
  });
});
