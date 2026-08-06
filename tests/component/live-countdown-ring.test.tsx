import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

afterEach(cleanup);

describe("CountdownRing", () => {
  it("shows the formatted value inside the ring", () => {
    render(<CountdownRing display="00:24" label="Time remaining" progress={0.8} tone="effort" />);

    expect(screen.getByText("00:24")).toBeInTheDocument();
  });

  it("exposes a stable accessible name instead of announcing every tick", () => {
    render(<CountdownRing display="00:24" label="Time remaining" progress={0.8} tone="effort" />);

    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-label", "Time remaining");
    expect(timer).not.toHaveAttribute("aria-live", "polite");
  });

  it("draws the arc proportionally to the progress it is given", () => {
    const { container } = render(
      <CountdownRing display="00:15" label="Time remaining" progress={0.5} tone="effort" />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));
    const offset = Number(arc.getAttribute("stroke-dashoffset"));

    expect(offset).toBeCloseTo(circumference * 0.5, 1);
  });

  it("fills the whole arc at full progress and none of it at zero", () => {
    const { container, rerender } = render(
      <CountdownRing display="00:30" label="Time remaining" progress={1} tone="effort" />,
    );

    const arc = () => container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc().getAttribute("stroke-dasharray"));

    expect(Number(arc().getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 1);

    rerender(<CountdownRing display="00:00" label="Time remaining" progress={0} tone="effort" />);

    expect(Number(arc().getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference, 1);
  });

  it("clamps negative progress to an empty arc", () => {
    const { container } = render(
      <CountdownRing display="00:00" label="Time remaining" progress={-0.4} tone="effort" />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference, 1);
  });

  it("renders a bare track with no arc when progress is unknowable", () => {
    const { container } = render(
      <CountdownRing display="0 / —" label="Reps completed" progress={null} tone="effort" />,
    );

    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
    expect(container.querySelector(".countdown-ring__track")).not.toBeNull();
  });

  it("carries the lane tone as a data attribute so the arc colour is one rule", () => {
    const { container } = render(
      <CountdownRing display="00:20" label="Rest remaining" progress={0.4} tone="recovery" />,
    );

    expect(container.querySelector(".countdown-ring")).toHaveAttribute("data-tone", "recovery");
  });

  it("clamps out-of-range progress rather than drawing a broken arc", () => {
    const { container } = render(
      <CountdownRing display="00:30" label="Time remaining" progress={1.7} tone="effort" />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBe(0);
  });
});
