import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LandingPage from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("LandingPage", () => {
  it("renders the mascot 4-week hero and primary CTAs", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Ready for your 4-week plan\?/i }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /FitAI waving mascot/i })).toBeTruthy();
    expect(
      screen.getAllByRole("link", {
        name: /Start training|Start your 4-week plan|Start 4-week trial/i,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Open Today view|Preview Today/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders compact user-group cards", () => {
    render(<LandingPage />);
    expect(screen.getByText("Beginners")).toBeTruthy();
    expect(screen.getByText("Fat Loss")).toBeTruthy();
    expect(screen.getByText("Muscle & Strength")).toBeTruthy();
    expect(screen.getByText("Busy Schedule")).toBeTruthy();
  });

  it("renders form assessment with exercise toggles", () => {
    render(<LandingPage />);
    expect(screen.getByRole("img", { name: /Squat biomechanical pose/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Push-up" }));
    expect(screen.getByRole("img", { name: /Push-up biomechanical pose/i })).toBeTruthy();
  });

  it("renders real Solo Match DuelVersusHud and Community FeedCard", () => {
    render(<LandingPage />);
    expect(screen.getByText("Train solo. Compete together.")).toBeTruthy();
    expect(screen.getByText("Minh K.")).toBeTruthy();
    expect(screen.getByText("Linh T.")).toBeTruthy();
    expect(screen.getByText("Lower & Squat Mechanics · Clean Form")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });

  it("renders interactive muscle map, PhotoComparisonSlider, and mascot 4-week CTA", () => {
    render(<LandingPage />);
    expect(screen.getByText("Track every muscle and milestone.")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Interactive human body muscle anatomy" })).toBeTruthy();
    expect(screen.getByText("Transformation Gallery")).toBeTruthy();
    expect(screen.getByText("Ready for your 4-week plan?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lose Fat" }));
    expect(screen.getByText(/1,850 kcal high-protein meals/i)).toBeTruthy();
  });
});
