import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActiveTimerBar } from "@/features/workout/ui/live/active-timer-bar";

type TimerBarProps = ComponentProps<typeof ActiveTimerBar>;

afterEach(cleanup);

/** A running hold: clock on screen, "+10s" has something to extend. */
const timedProps = {
  display: "00:30",
  hasInstrument: true,
  label: "Time remaining in this set",
  progress: 1,
  timed: true,
};

describe("ActiveTimerBar", () => {
  it("shows the timer as the dominant element", () => {
    render(
      <ActiveTimerBar
        {...timedProps}
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
      />,
    );

    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("offers +10s on the left and Done on the right", () => {
    const { container } = render(
      <ActiveTimerBar
        {...timedProps}
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
      />,
    );

    const buttons = [...container.querySelectorAll("button")].map((b) =>
      b.getAttribute("aria-label"),
    );
    expect(buttons).toEqual(["Add 10 seconds", "Done"]);
  });

  it("never offers a skip control", () => {
    render(
      <ActiveTimerBar
        {...timedProps}
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
      />,
    );

    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
  });

  it("wires both handlers", () => {
    const onDone = vi.fn<TimerBarProps["onDone"]>();
    const onAddTime = vi.fn<TimerBarProps["onAddTime"]>();
    render(<ActiveTimerBar {...timedProps} onAddTime={onAddTime} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Add 10 seconds" }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(onAddTime).toHaveBeenCalledOnce();
  });

  it("names the timer for assistive tech without announcing every tick", () => {
    render(
      <ActiveTimerBar
        {...timedProps}
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
      />,
    );

    const timer = screen.getByRole("timer", { name: "Time remaining in this set" });
    expect(timer).toBeInTheDocument();
    expect(timer).not.toHaveAttribute("aria-live", "polite");
  });

  it("passes the set progress straight through to the ring", () => {
    const { container } = render(
      <ActiveTimerBar
        {...timedProps}
        display="00:15"
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
        progress={0.5}
      />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.5, 1);
  });

  it("shows a bare track when the set has no honest progress denominator", () => {
    const { container } = render(
      <ActiveTimerBar
        {...timedProps}
        display="0 / 10"
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
        progress={null}
      />,
    );

    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
    expect(container.querySelector(".countdown-ring__track")).not.toBeNull();
  });

  // A rep-counted set has a ring (the count) but no clock, so there is nothing
  // for "+10s" to add to — it is absent rather than present-but-dead.
  it("drops the add-time control on a set with no running clock", () => {
    render(
      <ActiveTimerBar
        display="4 / 10"
        hasInstrument
        label="Reps completed in this set"
        onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
        onDone={vi.fn<TimerBarProps["onDone"]>()}
        progress={0.4}
        timed={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Add 10 seconds" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(screen.getByText("4 / 10")).toBeInTheDocument();
  });

  // Untimed and untracked: no clock, no live count. One big confirm button.
  describe("when the set has nothing to display", () => {
    const untrackedProps = {
      display: "—",
      hasInstrument: false,
      label: "This set is not timed",
      progress: null,
      timed: false,
    };

    it("collapses to a single confirm control", () => {
      render(
        <ActiveTimerBar
          {...untrackedProps}
          onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
          onDone={vi.fn<TimerBarProps["onDone"]>()}
        />,
      );

      expect(screen.getByRole("button", { name: "Complete this set" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add 10 seconds" })).not.toBeInTheDocument();
      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    });

    it("finishes the set when confirmed", () => {
      const onDone = vi.fn<TimerBarProps["onDone"]>();
      render(
        <ActiveTimerBar
          {...untrackedProps}
          onAddTime={vi.fn<TimerBarProps["onAddTime"]>()}
          onDone={onDone}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Complete this set" }));

      expect(onDone).toHaveBeenCalledOnce();
    });
  });
});
