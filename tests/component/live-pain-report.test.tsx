import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PainReportDialog } from "@/features/workout/ui/live/pain-report-dialog";

afterEach(cleanup);

describe("PainReportDialog", () => {
  it("asks one question and offers both answers", () => {
    render(<PainReportDialog onDismiss={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Stop the workout?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, stop now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, keep training" })).toBeInTheDocument();
  });

  // The whole point: someone in pain must never be blocked on typing.
  it("stops with an empty note when the user explains nothing", () => {
    const onStop = vi.fn();
    render(<PainReportDialog onDismiss={vi.fn()} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledWith("");
  });

  it("passes the note along when the user does explain", () => {
    const onStop = vi.fn();
    render(<PainReportDialog onDismiss={vi.fn()} onStop={onStop} />);

    fireEvent.change(screen.getByLabelText(/what hurts/i), {
      target: { value: "  sharp pain in left knee  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledWith("sharp pain in left knee");
  });

  it("keeps training when the user says no", () => {
    const onDismiss = vi.fn();
    const onStop = vi.fn();
    render(<PainReportDialog onDismiss={onDismiss} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "No, keep training" }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onStop).not.toHaveBeenCalled();
  });

  it("closes on Escape, so a mis-tap costs nothing", () => {
    const onDismiss = vi.fn();
    render(<PainReportDialog onDismiss={onDismiss} onStop={vi.fn()} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("focuses the stop button, the reason the dialog was opened", () => {
    render(<PainReportDialog onDismiss={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Yes, stop now" })).toHaveFocus();
  });
});
