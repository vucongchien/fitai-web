import { describe, expect, it } from 'vitest';
import { act, render, screen } from "@testing-library/react";

import { ToastProvider, useToast } from "@/shared/ui/toast/toast-context";

function TestConsumer() {
  const { showToast, toasts } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          showToast({
            message: "Test message",
            action: { label: "Undo Test", onClick: () => {} },
          })
        }
      >
        Trigger Toast
      </button>
      <span data-testid="count">{toasts.length}</span>
    </div>
  );
}

describe("global Toast System (ToastProvider)", () => {
  it("provides showToast function and manages toast queue", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    act(() => {
      screen.getByText("Trigger Toast").click();
    });

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
