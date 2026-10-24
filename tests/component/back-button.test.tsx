import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BackButton, canGoBackSafely } from "@/shared/ui/back-button";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

vi.mock("@/shared/lib/haptic-feedback", () => ({
  triggerHaptic: vi.fn(),
}));

describe("BackButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "history", {
      value: { length: 2 },
      writable: true,
    });
    Object.defineProperty(document, "referrer", {
      value: "",
      writable: true,
    });
  });

  it("renders a button with accessible name", () => {
    render(<BackButton ariaLabel="Go back" />);
    const button = screen.getByRole("button", { name: "Go back" });
    expect(button).toBeInTheDocument();
  });

  it("renders custom children when provided", () => {
    render(<BackButton>Back to Home</BackButton>);
    expect(screen.getByText("Back to Home")).toBeInTheDocument();
  });

  it("navigates back when safe history is present", () => {
    Object.defineProperty(window.history, "length", { value: 3, writable: true });
    render(<BackButton fallbackHref="/community" />);

    const button = screen.getByRole("button", { name: "Back" });
    fireEvent.click(button);

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls back to fallbackHref when history.length is 1", () => {
    Object.defineProperty(window.history, "length", { value: 1, writable: true });
    render(<BackButton fallbackHref="/community" />);

    const button = screen.getByRole("button", { name: "Back" });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/community");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("falls back to fallbackHref when arriving directly from external referrer", () => {
    Object.defineProperty(window.history, "length", { value: 2, writable: true });
    Object.defineProperty(document, "referrer", {
      value: "https://www.google.com/search?q=fitai",
      writable: true,
    });

    render(<BackButton fallbackHref="/community" />);

    const button = screen.getByRole("button", { name: "Back" });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/community");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("executes custom onClick callback if provided", () => {
    const customOnClick = vi.fn();
    render(<BackButton onClick={customOnClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(customOnClick).toHaveBeenCalledTimes(1);
  });
});

describe("canGoBackSafely", () => {
  it("returns false if history.length <= 1", () => {
    Object.defineProperty(window.history, "length", { value: 1, writable: true });
    expect(canGoBackSafely()).toBe(false);
  });

  it("returns false if landing from external domain with short history", () => {
    Object.defineProperty(window.history, "length", { value: 2, writable: true });
    Object.defineProperty(document, "referrer", {
      value: "https://facebook.com/posts/1",
      writable: true,
    });
    expect(canGoBackSafely()).toBe(false);
  });

  it("returns true for in-app navigation with history", () => {
    Object.defineProperty(window.history, "length", { value: 3, writable: true });
    Object.defineProperty(document, "referrer", {
      value: "",
      writable: true,
    });
    expect(canGoBackSafely()).toBe(true);
  });
});
