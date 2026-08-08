import { afterEach, describe, expect, it } from 'vitest';
import { afterEach, describe, expect, it, vi } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";

type ActiveScreenProps = ComponentProps<typeof ActiveExerciseScreen>;

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
  onAddTime: vi.fn<ActiveScreenProps["onAddTime"]>(),
  onBack: vi.fn<ActiveScreenProps["onBack"]>(),
  onDone: vi.fn<ActiveScreenProps["onDone"]>(),
  onOpenGuide: vi.fn<ActiveScreenProps["onOpenGuide"]>(),
  onReportPain: vi.fn<ActiveScreenProps["onReportPain"]>(),
  onToggleCamera: vi.fn<NonNullable<ActiveScreenProps["onToggleCamera"]>>(),
  onToggleFullscreen: vi.fn<ActiveScreenProps["onToggleFullscreen"]>(),
  onToggleVoice: vi.fn<ActiveScreenProps["onToggleVoice"]>(),
  secondsLeft: 30,
  totalSets: 3,
  voiceOn: false,
};

describe(ActiveExerciseScreen, () => {
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
    const { container } = render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByText("30 sec")).toBeInTheDocument();
    // The counter splits the current set from the total so the two can be
    // Weighted differently, so read the whole element rather than one node.
    expect(container.querySelector(".live-meta__sets")?.textContent).toBe("1 / 3 Sets");
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

  // No clock and no live rep count means there is no instrument to show. The
  // Footer becomes a single confirm button rather than a dead ring showing "—".
  it("replaces the ring with a confirm button when nothing is counting reps", () => {
    const { container } = render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        secondsLeft={0}
      />,
    );

    // The target belongs to the meta row, and is not echoed by the footer.
    expect(screen.getAllByText("10 reps")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Complete this set" })).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
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

  // A safety control must be present and must not be the one the header drops.
  it("offers the pain report from the header", () => {
    const onReportPain = vi.fn<ActiveScreenProps["onReportPain"]>();
    render(<ActiveExerciseScreen {...baseProps} onReportPain={onReportPain} />);

    fireEvent.click(screen.getByRole("button", { name: "Report pain" }));

    expect(onReportPain).toHaveBeenCalledOnce();
  });

  it("renders the instruction, unlabelled", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("region", { name: "Coaching instructions" })).toBeInTheDocument();
    expect(screen.queryByText("Form Tip")).not.toBeInTheDocument();
    expect(screen.queryByText("Breathing")).not.toBeInTheDocument();
  });

  it("reflects the voice toggle state", () => {
    render(<ActiveExerciseScreen {...baseProps} voiceOn />);

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("wires the Done button", () => {
    const onDone = vi.fn<ActiveScreenProps["onDone"]>();
    render(<ActiveExerciseScreen {...baseProps} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onDone).toHaveBeenCalledOnce();
  });

  // The ring shows three different things. Announcing a rep count as "time
  // Remaining" is false, so the name has to follow the same branch as the value.
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

  it("offers no timer and no add-time control on a set with neither", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
      />,
    );

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add 10 seconds" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete this set" })).toBeInTheDocument();
  });

  it("keeps the add-time control live for a timed hold", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Add 10 seconds" })).toBeEnabled();
  });
});
