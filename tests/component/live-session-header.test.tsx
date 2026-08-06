import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionHeader } from "@/features/workout/ui/live/session-header";

afterEach(cleanup);

describe("SessionHeader", () => {
  it("shows the title in the centre and a back button on the left", () => {
    render(<SessionHeader actions={[]} onBack={vi.fn()} title="Plank Hold" />);

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = vi.fn();
    render(<SessionHeader actions={[]} onBack={onBack} title="Plank Hold" />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders each action with its accessible name and wires its handler", () => {
    const onGuide = vi.fn();
    render(
      <SessionHeader
        actions={[
          { icon: <span />, key: "guide", label: "Exercise guide", onClick: onGuide },
          { icon: <span />, key: "voice", label: "Voice guide", onClick: vi.fn() },
          { icon: <span />, key: "full", label: "Fullscreen", onClick: vi.fn() },
        ]}
        onBack={vi.fn()}
        title="Plank Hold"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Exercise guide" }));

    expect(onGuide).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("marks an active action with aria-pressed so the on-state is announced", () => {
    render(
      <SessionHeader
        actions={[
          { active: true, icon: <span />, key: "voice", label: "Voice guide", onClick: vi.fn() },
        ]}
        onBack={vi.fn()}
        title="Plank Hold"
      />,
    );

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
