import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";

describe("QuickActionsFab Component", () => {
  it("renders closed by default", () => {
    render(<QuickActionsFab />);

    const trigger = screen.getByRole("button", { name: "Open quick actions" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens options menu with animation when trigger is clicked", () => {
    render(<QuickActionsFab />);

    const trigger = screen.getByRole("button", { name: "Open quick actions" });
    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "Close quick actions" })).toBeInTheDocument();
    expect(screen.getByText("Extra workout")).toBeInTheDocument();
    expect(screen.getByText("Log weight")).toBeInTheDocument();
    expect(screen.getByText("Log meal")).toBeInTheDocument();
  });

  it("closes menu when clicking an option link", () => {
    render(<QuickActionsFab />);

    const trigger = screen.getByRole("button", { name: "Open quick actions" });
    fireEvent.click(trigger);

    const workoutLink = screen.getByRole("menuitem", { name: /Extra workout/i });
    fireEvent.click(workoutLink);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
