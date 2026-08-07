import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { SessionHeader } from "@/features/workout/ui/live/session-header";

type SessionHeaderProps = ComponentProps<typeof SessionHeader>;

const noActions: HeaderAction[] = [];

afterEach(cleanup);

describe(SessionHeader, () => {
  it("shows the title in the centre and a back button on the left", () => {
    render(
      <SessionHeader
        actions={noActions}
        onBack={vi.fn<SessionHeaderProps["onBack"]>()}
        title="Plank Hold"
      />,
    );

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = vi.fn<SessionHeaderProps["onBack"]>();
    render(<SessionHeader actions={noActions} onBack={onBack} title="Plank Hold" />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders each action with its accessible name and wires its handler", () => {
    const onGuide = vi.fn<HeaderAction["onClick"]>();
    render(
      <SessionHeader
        actions={[
          { icon: <span />, key: "guide", label: "Exercise guide", onClick: onGuide },
          {
            icon: <span />,
            key: "voice",
            label: "Voice guide",
            onClick: vi.fn<HeaderAction["onClick"]>(),
          },
          {
            icon: <span />,
            key: "full",
            label: "Fullscreen",
            onClick: vi.fn<HeaderAction["onClick"]>(),
          },
        ]}
        onBack={vi.fn<SessionHeaderProps["onBack"]>()}
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
          {
            active: true,
            icon: <span />,
            key: "voice",
            label: "Voice guide",
            onClick: vi.fn<HeaderAction["onClick"]>(),
          },
        ]}
        onBack={vi.fn<SessionHeaderProps["onBack"]>()}
        title="Plank Hold"
      />,
    );

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
