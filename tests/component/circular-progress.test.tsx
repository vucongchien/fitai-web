import { cleanup, render, screen } from "@testing-library/react";
import { Salad } from "lucide-react";

import { CircularProgress, toPercentage } from "@/shared/ui/charts/circular-progress";

// This project's vitest config does not enable `globals`, so RTL auto-cleanup is off.
afterEach(cleanup);

describe(toPercentage, () => {
  it("rounds to a whole percentage", () => {
    expect(toPercentage(1420, 2050)).toBe(69);
  });

  it("returns zero rather than dividing by zero", () => {
    expect(toPercentage(5, 0)).toBe(0);
  });

  it("clamps to the 0..100 range", () => {
    expect(toPercentage(3000, 2050)).toBe(100);
    expect(toPercentage(-40, 2050)).toBe(0);
  });

  it("guards against non-finite input", () => {
    expect(toPercentage(Number.NaN, 100)).toBe(0);
    expect(toPercentage(50, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe(CircularProgress, () => {
  it("carries the real reading in its accessible name, not just a percentage", () => {
    render(
      <CircularProgress
        ariaLabel="1,420 of 2,050 kcal logged"
        Icon={Salad}
        max={2050}
        value={1420}
      />,
    );

    expect(screen.getByRole("img", { name: "1,420 of 2,050 kcal logged" })).toBeInTheDocument();
  });

  it("draws the value arc proportionally to the reading", () => {
    const { container } = render(
      <CircularProgress ariaLabel="Half done" Icon={Salad} max={100} value={50} />,
    );

    const arc = container.querySelector(".progress-ring__value");
    const circumference = 2 * Math.PI * 52;
    // 50% complete leaves half the circumference as the dash offset.
    expect(Number(arc?.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference / 2, 1);
  });

  it("omits the value arc when nothing is scheduled, so zero is not drawn as progress", () => {
    const { container } = render(
      <CircularProgress ariaLabel="Nothing scheduled" Icon={Salad} max={0} value={0} />,
    );

    expect(container.querySelector(".progress-ring__value")).toBeNull();
    expect(container.querySelector(".progress-ring__track")).not.toBeNull();
  });

  it("renders the subject icon at the centre, hidden from assistive technology", () => {
    const { container } = render(
      <CircularProgress ariaLabel="Calories" Icon={Salad} max={2050} value={1420} />,
    );

    const icon = container.querySelector(".progress-ring__icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon?.querySelector("svg")).not.toBeNull();
  });

  it("prints no percentage text, leaving the arc to carry the ratio", () => {
    const { container } = render(
      <CircularProgress ariaLabel="Calories" Icon={Salad} max={2050} value={1420} />,
    );

    expect(container.textContent).not.toContain("69");
    expect(container.textContent).not.toContain("%");
  });
});
