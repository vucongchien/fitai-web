import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { CoachingPanel } from "@/features/workout/ui/live/coaching-panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

describe("CoachingPanel", () => {
  it("renders all four coaching blocks with their labels", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Form Tip")).toBeInTheDocument();
    expect(screen.getByText("Breathing")).toBeInTheDocument();
    expect(screen.getByText("Common Mistake")).toBeInTheDocument();
  });

  it("renders the coaching copy itself", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(
      screen.getByText("Maintain a straight body line while keeping your core engaged."),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep your elbows directly under your shoulders.")).toBeInTheDocument();
    expect(
      screen.getByText("Breathe slowly and consistently throughout the exercise."),
    ).toBeInTheDocument();
    expect(screen.getByText("Avoid letting your hips drop or rise too high.")).toBeInTheDocument();
  });

  it("omits a block the exercise has no data for", () => {
    render(<CoachingPanel exercise={makeExercise({ breathingCue: undefined })} />);

    expect(screen.queryByText("Breathing")).not.toBeInTheDocument();
  });

  it("shows only the first form cue and first mistake to keep each block to 1-2 lines", () => {
    render(
      <CoachingPanel
        exercise={makeExercise({
          commonMistakes: ["Hips drop", "Neck cranes forward"],
          formCues: ["Elbows under shoulders", "Squeeze the glutes"],
        })}
      />,
    );

    expect(screen.getByText("Elbows under shoulders")).toBeInTheDocument();
    expect(screen.queryByText("Squeeze the glutes")).not.toBeInTheDocument();
    expect(screen.getByText("Hips drop")).toBeInTheDocument();
    expect(screen.queryByText("Neck cranes forward")).not.toBeInTheDocument();
  });

  it("is reachable by keyboard so its content can be scrolled without a pointer", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(screen.getByRole("region", { name: "Coaching instructions" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("marks itself scrollable when the content overflows the panel", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 200 });
    fireEvent.scroll(panel);

    expect(panel).toHaveAttribute("data-scrollable", "true");
  });

  it("drops the scroll affordance once the panel is scrolled to the bottom", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(panel, "scrollTop", { configurable: true, value: 200 });
    fireEvent.scroll(panel);

    expect(panel).toHaveAttribute("data-scrollable", "false");
  });

  it("re-measures when the panel is resized, not only when it is scrolled", () => {
    let trigger: (() => void) | null = null;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          trigger = callback;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );

    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    expect(observe).toHaveBeenCalled();
    expect(panel).toHaveAttribute("data-scrollable", "false");

    // The viewport shrank: the same content now overflows.
    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 120 });
    act(() => trigger!());

    expect(panel).toHaveAttribute("data-scrollable", "true");
  });

  it("still renders when the browser has no ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);

    expect(() => render(<CoachingPanel exercise={makeExercise()} />)).not.toThrow();
  });
});
