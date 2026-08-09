import { describe, expect, it } from 'vitest';
import { render, screen } from "@testing-library/react";

import { MetricTrace } from "@/shared/ui/metric-trace";

describe(MetricTrace, () => {
  const defaultProps = {
    label: "Body weight",
    value: "72.4 kg",
    points: [70, 71, 71.5, 72, 72.4],
  };

  it("exposes the SVG chart as an img with a descriptive aria-label", () => {
    render(<MetricTrace {...defaultProps} />);

    // Role="img" + aria-label on the SVG
    expect(
      screen.getByRole("img", { name: /body weight: 72\.4 kg/i }),
    ).toBeInTheDocument();
  });

  it("renders inside a <figure> element with a <figcaption>", () => {
    const { container } = render(<MetricTrace {...defaultProps} />);

    expect(container.querySelector("figure.metric-trace")).not.toBeNull();
    expect(container.querySelector("figcaption")).not.toBeNull();
  });

  it("shows the label and value in the figcaption for sighted readers", () => {
    render(<MetricTrace {...defaultProps} />);

    expect(screen.getByText("Body weight")).toBeInTheDocument();
    expect(screen.getByText("72.4 kg")).toBeInTheDocument();
  });

  it("applies the tone modifier class", () => {
    const { container: greenContainer } = render(
      <MetricTrace {...defaultProps} tone="green" />,
    );
    expect(greenContainer.querySelector(".metric-trace--green")).not.toBeNull();

    const { container: coralContainer } = render(
      <MetricTrace {...defaultProps} tone="coral" />,
    );
    expect(coralContainer.querySelector(".metric-trace--coral")).not.toBeNull();
  });

  it("defaults to the blue tone when tone prop is omitted", () => {
    const { container } = render(<MetricTrace {...defaultProps} />);

    expect(container.querySelector(".metric-trace--blue")).not.toBeNull();
  });

  it("renders a path element for the line chart inside the SVG", () => {
    const { container } = render(<MetricTrace {...defaultProps} />);

    const path = container.querySelector(".metric-trace__line");
    expect(path).not.toBeNull();
    // Path should start with 'M' (moveto)
    expect(path?.getAttribute("d")).toMatch(/^M/);
  });

  it("handles a single-point dataset without throwing", () => {
    expect(() =>
      render(<MetricTrace label="Weight" value="72 kg" points={[72]} />),
    ).not.toThrow();
  });
});
