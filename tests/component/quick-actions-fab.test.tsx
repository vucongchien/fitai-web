import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import type { QuickAction } from "@/features/home/model/home-page.types";

const mockActions: QuickAction[] = [
  {
    id: "extra-workout",
    label: "Extra workout",
    href: "/workout/adhoc",
    icon: "dumbbell",
    colorVariant: "blue",
  },
  {
    id: "log-weight",
    label: "Log weight",
    href: "/progress/weight",
    icon: "scale",
    colorVariant: "green",
  },
  {
    id: "log-meal",
    label: "Log meal",
    href: "/nutrition/log",
    icon: "utensils",
    colorVariant: "coral",
  },
];

describe("QuickActionsFab Component", () => {
  it("renders closed by default", () => {
    const { container } = render(<QuickActionsFab actions={mockActions} />);

    const trigger = container.querySelector(".home-fab-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens options menu with animation when trigger is clicked", () => {
    const { container } = render(<QuickActionsFab actions={mockActions} />);

    const trigger = container.querySelector(".home-fab-trigger")!;
    fireEvent.click(trigger);

    expect(screen.getAllByText("Extra workout").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Log weight").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Log meal").length).toBeGreaterThan(0);
  });

  it("toggles trigger aria-expanded state when clicked twice", () => {
    const { container } = render(<QuickActionsFab actions={mockActions} />);

    const trigger = container.querySelector(".home-fab-trigger")!;
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders correct number of action items from props", () => {
    const { container } = render(<QuickActionsFab actions={mockActions} />);

    const trigger = container.querySelector(".home-fab-trigger")!;
    fireEvent.click(trigger);

    const menuItems = container.querySelectorAll("[role='menuitem']");
    expect(menuItems).toHaveLength(mockActions.length);
  });
});
