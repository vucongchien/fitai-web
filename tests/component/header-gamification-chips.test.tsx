import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderGamificationChips } from "@/features/gamification/ui/header-gamification-chips";

describe("HeaderGamificationChips", () => {
  it("renders inline when usePortal is false", () => {
    render(
      <HeaderGamificationChips streakDays={7} isActiveToday={true} coins={150} usePortal={false} />,
    );

    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("150")).toBeDefined();
    expect(screen.getByTitle("7 days streak")).toBeDefined();
    expect(screen.getByTitle("150 FitCoins")).toBeDefined();
  });

  it("portals into target element when usePortal is true and target exists", () => {
    const target = document.createElement("div");
    target.id = "today-header-badges";
    document.body.appendChild(target);

    render(
      <HeaderGamificationChips
        streakDays={12}
        isActiveToday={false}
        coins={500}
        usePortal={true}
      />,
    );

    expect(target.querySelector("[title='12 days streak']")).not.toBeNull();
    expect(target.textContent).toContain("12");
    expect(target.textContent).toContain("500");

    document.body.removeChild(target);
  });
});
