import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsRow } from "@/features/profile/components/settings-row";
import { TabButton } from "@/shared/ui/tab-button";

describe("Shared UI - TabButton", () => {
  it("renders active tab with aria-selected true and indicator bar", () => {
    const handleClick = vi.fn();
    render(
      <TabButton active={true} onClick={handleClick}>
        OVERVIEW
      </TabButton>,
    );

    const button = screen.getByRole("tab", { name: "OVERVIEW" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-selected", "true");
    expect(button.className).toContain("text-sky-500");

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders inactive tab with aria-selected false", () => {
    render(<TabButton active={false}>POSTS</TabButton>);

    const button = screen.getByRole("tab", { name: "POSTS" });
    expect(button).toHaveAttribute("aria-selected", "false");
    expect(button.className).toContain("text-neutral-400");
  });

  it("applies uppercase styling when uppercase prop is true", () => {
    render(
      <TabButton active={true} uppercase>
        Following
      </TabButton>,
    );

    const button = screen.getByRole("tab", { name: "Following" });
    expect(button.className).toContain("uppercase");
  });
});

describe("Profile UI - SettingsRow", () => {
  it("renders button row with label, value, and triggers onClick", () => {
    const handleClick = vi.fn();
    render(<SettingsRow label="Body Metrics" value="68.5 kg • 175 cm" onClick={handleClick} />);

    expect(screen.getByText("Body Metrics")).toBeInTheDocument();
    expect(screen.getByText("68.5 kg • 175 cm")).toBeInTheDocument();

    const row = screen.getByRole("button");
    fireEvent.click(row);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders link row when href is provided", () => {
    render(<SettingsRow label="Notifications" value="System alerts" href="/notifications" />);

    const link = screen.getByRole("link", { name: /Notifications/ });
    expect(link).toHaveAttribute("href", "/notifications");
    expect(screen.getByText("System alerts")).toBeInTheDocument();
  });
});
