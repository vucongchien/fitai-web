
import { act, fireEvent, render } from "@testing-library/react";

import { CoachingPanel } from "@/features/workout/ui/live/coaching-panel";
import type { LiveExercise } from "@/features/workout/domain/session-flow";

function makeExercise(): LiveExercise {
  return {
    id: "ex_bench",
    exerciseId: "ex_bench",
    name: "Bench Press",
    phase: "work",
    targetSets: 3,
    targetReps: 8,
    targetWeightKg: 80,
    instructions: "Maintain a straight body line while keeping your core engaged.",
    cues: ["Maintain a straight body line while keeping your core engaged."],
    targetRestSeconds: 90,
  };
}

describe(CoachingPanel, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is reachable by keyboard so its content can be scrolled without a pointer", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach");

    expect(panel).not.toBeNull();
    expect(panel).toHaveAttribute("tabindex", "0");
  });

  it("marks itself data-scrollable=true when content height exceeds element height", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 120 });
    fireEvent.scroll(panel);

    expect(panel).toHaveAttribute("data-scrollable", "true");
  });

  it("marks itself data-scrollable=false when content fits in element height", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 100 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 120 });
    fireEvent.scroll(panel);

    expect(panel).toHaveAttribute("data-scrollable", "false");
  });

  it("re-measures when the panel is resized, not only when it is scrolled", () => {
    let trigger: (() => void) | undefined;
    const disconnect = vi.fn<ResizeObserver["disconnect"]>();
    const unobserve = vi.fn<ResizeObserver["unobserve"]>();

    const observe = vi.fn<ResizeObserver["observe"]>((_target, _options) => {
      // Mock observe
    });

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          trigger = () =>
            cb(
              [
                {
                  target: document.createElement("div"),
                  contentRect: {} as DOMRectReadOnly,
                  borderBoxSize: [],
                  contentBoxSize: [],
                  devicePixelContentBoxSize: [],
                },
              ],
              this,
            );
        }

        observe = observe;

        disconnect = disconnect;

        unobserve = unobserve;
      },
    );

    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    expect(observe).toHaveBeenCalledWith();

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
