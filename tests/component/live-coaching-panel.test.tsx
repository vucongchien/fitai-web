import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";


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

describe(CoachingPanel, () => {
  it("renders the instruction itself, with no label above it", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(
      screen.getByText("Maintain a straight body line while keeping your core engaged."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("splits a multi-paragraph instruction into separate paragraphs", () => {
    const { container } = render(
      <CoachingPanel exercise={makeExercise({ instructions: "Set up square.\n\nThen press." })} />,
    );

    expect(container.querySelectorAll(".live-coach__text")).toHaveLength(2);
    expect(screen.getByText("Set up square.")).toBeInTheDocument();
    expect(screen.getByText("Then press.")).toBeInTheDocument();
  });

  // The other three cues moved to the exercise guide sheet: a running set is
  // Read at a glance, and four labelled blocks is not a glance.
  it("leaves form cues, breathing and mistakes to the guide sheet", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(
      screen.queryByText("Keep your elbows directly under your shoulders."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Breathe slowly and consistently throughout the exercise."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Avoid letting your hips drop or rise too high."),
    ).not.toBeInTheDocument();
  });

  it("renders nothing but an empty panel when the exercise has no instruction", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise({ instructions: "" })} />);

    expect(container.querySelectorAll(".live-coach__text")).toHaveLength(0);
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
    const observe = vi.fn<ResizeObserver["observe"]>();
    const disconnect = vi.fn<ResizeObserver["disconnect"]>();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          trigger = callback;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn<ResizeObserver["unobserve"]>();
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
    vi.stubGlobal("ResizeObserver");

    expect(() => render(<CoachingPanel exercise={makeExercise()} />)).not.toThrow();
  });
});
