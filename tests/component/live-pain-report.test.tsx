import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { PainReportDialog } from "@/features/workout/ui/live/pain-report-dialog";
import {
  BodySide,
  JointRegion,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

type PainReportProps = ComponentProps<typeof PainReportDialog>;

afterEach(cleanup);

describe(PainReportDialog, () => {
  it("asks one question and offers both answers", () => {
    render(
      <PainReportDialog
        onDismiss={vi.fn<PainReportProps["onDismiss"]>()}
        onStop={vi.fn<PainReportProps["onStop"]>()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Stop the workout?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, stop now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, keep training" })).toBeInTheDocument();
  });

  // The whole point: someone in pain must never be blocked on typing.
  it("stops with an empty note when the user explains nothing", () => {
    const onStop = vi.fn<PainReportProps["onStop"]>();
    render(<PainReportDialog onDismiss={vi.fn<PainReportProps["onDismiss"]>()} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledWith({
      note: "",
      region: JointRegion.UNSPECIFIED,
      side: BodySide.BOTH,
    });
  });

  it("passes the note along when the user does explain", () => {
    const onStop = vi.fn<PainReportProps["onStop"]>();
    render(<PainReportDialog onDismiss={vi.fn<PainReportProps["onDismiss"]>()} onStop={onStop} />);

    fireEvent.change(screen.getByLabelText(/what hurts/i), {
      target: { value: "  sharp pain in left knee  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledWith(
      expect.objectContaining({ note: "sharp pain in left knee", region: JointRegion.UNSPECIFIED }),
    );
  });

  it("hides the side picker until a region is picked", () => {
    render(
      <PainReportDialog
        onDismiss={vi.fn<PainReportProps["onDismiss"]>()}
        onStop={vi.fn<PainReportProps["onStop"]>()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Left" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Knee" }));
    expect(screen.getByRole("button", { name: "Left" })).toBeInTheDocument();
  });

  it("passes the picked region and side, still in one tap on stop", () => {
    const onStop = vi.fn<PainReportProps["onStop"]>();
    render(<PainReportDialog onDismiss={vi.fn<PainReportProps["onDismiss"]>()} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "Knee" }));
    fireEvent.click(screen.getByRole("button", { name: "Left" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledOnce();
    expect(onStop).toHaveBeenCalledWith({
      note: "",
      region: JointRegion.KNEE,
      side: BodySide.LEFT,
    });
  });

  it("clears the region when it is tapped again", () => {
    const onStop = vi.fn<PainReportProps["onStop"]>();
    render(<PainReportDialog onDismiss={vi.fn<PainReportProps["onDismiss"]>()} onStop={onStop} />);

    const knee = screen.getByRole("button", { name: "Knee" });
    fireEvent.click(knee);
    expect(knee).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(knee);
    fireEvent.click(screen.getByRole("button", { name: "Yes, stop now" }));

    expect(onStop).toHaveBeenCalledWith(
      expect.objectContaining({ region: JointRegion.UNSPECIFIED }),
    );
  });

  it("keeps training when the user says no", () => {
    const onDismiss = vi.fn<PainReportProps["onDismiss"]>();
    const onStop = vi.fn<PainReportProps["onStop"]>();
    render(<PainReportDialog onDismiss={onDismiss} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "No, keep training" }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onStop).not.toHaveBeenCalled();
  });

  it("closes on Escape, so a mis-tap costs nothing", () => {
    const onDismiss = vi.fn<PainReportProps["onDismiss"]>();
    render(<PainReportDialog onDismiss={onDismiss} onStop={vi.fn<PainReportProps["onStop"]>()} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("focuses the stop button, the reason the dialog was opened", () => {
    render(
      <PainReportDialog
        onDismiss={vi.fn<PainReportProps["onDismiss"]>()}
        onStop={vi.fn<PainReportProps["onStop"]>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Yes, stop now" })).toHaveFocus();
  });
});
