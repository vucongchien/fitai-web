import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ToastContainer, ToastProvider, toast, useToast } from "@/shared/ui/toast";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (typeof Element.prototype.animate !== "function") {
    Element.prototype.animate = () =>
      ({
        cancel() {},
        finish() {},
        onfinish: null,
      }) as unknown as Animation;
  }
});

function ToastTriggerHarness() {
  const { showToast, dismissToast } = useToast();

  return (
    <div>
      <button
        onClick={() => showToast({ message: "Saved via context", type: "success" })}
        type="button"
      >
        Trigger context toast
      </button>
      <button onClick={() => dismissToast("ctx-1")} type="button">
        Dismiss context toast
      </button>
    </div>
  );
}

describe("Ding toast integration", () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it("renders Toaster region and displays imperative toast messages", () => {
    render(<ToastContainer />);

    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();

    act(() => {
      toast.success("Workout saved!");
    });
    expect(screen.getAllByText("Workout saved!").length).toBeGreaterThan(0);

    act(() => {
      toast.error("Sync failed");
    });
    expect(screen.getAllByText("Sync failed").length).toBeGreaterThan(0);

    act(() => {
      toast.info("Offline mode");
    });
    expect(screen.getAllByText("Offline mode").length).toBeGreaterThan(0);
  });

  it("supports action callbacks on toast", () => {
    const onAction = vi.fn();
    render(<ToastContainer />);

    act(() => {
      toast.info("Item removed", {
        action: { label: "Undo", onClick: onAction },
      });
    });

    const undoButton = screen.getByRole("button", { name: "Undo" });
    fireEvent.click(undoButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders toast via ToastProvider and useToast", () => {
    render(
      <ToastProvider>
        <ToastTriggerHarness />
        <ToastContainer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger context toast" }));
    expect(screen.getAllByText("Saved via context").length).toBeGreaterThan(0);
  });

  it("invokes onClick when tapping/clicking a clickable toast", () => {
    const onNavigate = vi.fn();
    render(<ToastContainer />);

    act(() => {
      toast.info("New comment on your post", { onClick: onNavigate });
    });

    const slot = screen.getByRole("button", { name: /new comment on your post/i });
    fireEvent.pointerDown(slot, { button: 0, clientX: 100, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(slot, { button: 0, clientX: 101, clientY: 50, pointerId: 1 });

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("dismisses without invoking onClick when swiping a clickable toast away", () => {
    const onNavigate = vi.fn();
    render(<ToastContainer />);

    act(() => {
      toast.info("Swipe me away", { onClick: onNavigate });
    });

    const slot = screen.getByRole("button", { name: /swipe me away/i });
    fireEvent.pointerDown(slot, { button: 0, clientX: 100, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(slot, { button: 0, clientX: 240, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(slot, { button: 0, clientX: 240, clientY: 50, pointerId: 1 });
    fireEvent.click(slot);

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
