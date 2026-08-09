import { describe, expect, it } from 'vitest';
import { render, screen } from "@testing-library/react";

import { TripleLane } from "@/shared/ui/triple-lane";

describe(TripleLane, () => {
  it("provides a text alternative when it carries meaning", () => {
    render(<TripleLane active="plan" labelled />);

    const lane = screen.getByRole("img", { name: "Plan, move, recover" });
    expect(lane).toHaveAttribute("data-active", "plan");
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByText("Recover")).toBeInTheDocument();
  });
});
