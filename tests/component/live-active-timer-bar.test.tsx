import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActiveTimerBar } from "@/features/workout/ui/live/active-timer-bar";

afterEach(cleanup);

describe("ActiveTimerBar", () => {
  it("shows the timer as the dominant element", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("offers Done on the left and +10s on the right", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 10 seconds" })).toBeInTheDocument();
  });

  it("never offers a skip control", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
  });

  it("wires both handlers", () => {
    const onDone = vi.fn();
    const onAddTime = vi.fn();
    render(<ActiveTimerBar display="00:30" onAddTime={onAddTime} onDone={onDone} progress={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Add 10 seconds" }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(onAddTime).toHaveBeenCalledOnce();
  });

  it("names the timer for assistive tech without announcing every tick", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    const timer = screen.getByRole("timer", { name: "Time remaining in this set" });
    expect(timer).toBeInTheDocument();
    expect(timer).not.toHaveAttribute("aria-live", "polite");
  });

  it("passes the set progress straight through to the ring", () => {
    const { container } = render(
      <ActiveTimerBar display="00:15" onAddTime={vi.fn()} onDone={vi.fn()} progress={0.5} />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.5, 1);
  });

  it("shows a bare track when the set has no honest progress denominator", () => {
    const { container } = render(
      <ActiveTimerBar display="10 reps" onAddTime={vi.fn()} onDone={vi.fn()} progress={null} />,
    );

    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
    expect(container.querySelector(".countdown-ring__track")).not.toBeNull();
  });
});
