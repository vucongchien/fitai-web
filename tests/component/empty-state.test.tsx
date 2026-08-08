import { describe, expect, it } from '@jest/globals';
import { render, screen } from "@testing-library/react";
import { Dumbbell } from "lucide-react";

import { EmptyState } from "@/shared/ui/empty-state";

describe(EmptyState, () => {
  it("renders as an <output> element (implicit status role)", () => {
    const { container } = render(<EmptyState title="No data yet" />);

    // <output> has implicit ARIA role="status"
    expect(container.querySelector("output.empty-state")).not.toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows the title as an h3 heading", () => {
    render(<EmptyState title="Nothing here" />);

    expect(screen.getByRole("heading", { level: 3, name: /nothing here/i })).toBeInTheDocument();
  });

  it("renders description text when provided", () => {
    render(<EmptyState title="Empty" description="Add your first entry to get started" />);

    expect(screen.getByText(/add your first entry to get started/i)).toBeInTheDocument();
  });

  it("omits description paragraph when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);

    expect(container.querySelector("p")).toBeNull();
  });

  it("hides the decorative icon from assistive technology", () => {
    const { container } = render(<EmptyState icon={Dumbbell} title="No workouts" />);

    const iconWrapper = container.querySelector(".empty-state__icon");
    expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
  });

  it("renders without an icon when icon prop is omitted", () => {
    const { container } = render(<EmptyState title="No data" />);

    expect(container.querySelector(".empty-state__icon")).toBeNull();
  });

  it("renders the action slot when provided", () => {
    render(
      <EmptyState
        title="No meals"
        action={<button type="button">Log first meal</button>}
      />,
    );

    expect(screen.getByRole("button", { name: /log first meal/i })).toBeInTheDocument();
  });

  it("omits the action container when action prop is not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);

    expect(container.querySelector(".empty-state__action")).toBeNull();
  });
});
