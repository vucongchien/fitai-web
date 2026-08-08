"use client";

import { AlertCircle, Flag, HeartPulse } from "lucide-react";
import { useEffect, useState } from "react";

import type { AbortReason } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

export type EndDialogVariant = "menu" | "reason" | "overload" | "empty" | "complete";

const REASONS: { id: AbortReason; label: string; blurb: string }[] = [
  { blurb: "Something hurts — stop now.", id: "pain", label: "Pain or discomfort" },
  { blurb: "No time left today.", id: "out-of-time", label: "Out of time" },
  { blurb: "Not feeling it — that is fine.", id: "uncomfortable", label: "Doesn't feel right" },
];

export function EndSessionDialog({
  loadRatio,
  onAbort,
  onClose,
  onFinish,
  totalSets = 0,
  variant,
}: {
  variant: EndDialogVariant;
  loadRatio: number;
  totalSets?: number;
  onClose: () => void;
  onFinish: (confirmOverload: boolean) => void;
  onAbort: (reason: AbortReason) => void;
}) {
  const [view, setView] = useState<EndDialogVariant>(variant);
  const [reason, setReason] = useState<AbortReason | null>(null);

  useEffect(() => {
    setView(variant);
  }, [variant]);

  if (view === "overload") {
    return (
      <Dialog label="Confirm this session">
        <div className="end-dialog__mark end-dialog__mark--warn" aria-hidden="true">
          <AlertCircle size={24} />
        </div>
        <h2>That was a much bigger session than usual</h2>
        <p>
          Today is about {Math.round(loadRatio * 100)}% of your recent average. We can save it, and
          we will add a rest day for this muscle group afterwards.
        </p>
        <Button onClick={() => onFinish(true)} size="large">
          Save it and add a rest day
        </Button>
        <button className="text-action" onClick={onClose} type="button">
          Keep training
        </button>
      </Dialog>
    );
  }

  if (view === "empty") {
    return (
      <Dialog label="Cancel this workout?">
        <div className="end-dialog__mark" aria-hidden="true">
          <Flag size={24} />
        </div>
        <h2>Nothing logged yet</h2>
        <p>There is no set to save. Do you want to cancel this workout instead?</p>
        <Button onClick={() => onAbort("out-of-time")} size="large" variant="danger">
          Cancel the workout
        </Button>
        <button className="text-action" onClick={onClose} type="button">
          Back to the session
        </button>
      </Dialog>
    );
  }

  if (view === "reason") {
    return (
      <Dialog label="Stop the session">
        <div className="end-dialog__mark end-dialog__mark--warn" aria-hidden="true">
          <HeartPulse size={24} />
        </div>
        <h2>Let&rsquo;s stop here</h2>
        <p>What is going on? It changes what the coach does next — nothing more.</p>

        <div className="end-dialog__reasons">
          {REASONS.map((entry) => (
            <button
              aria-pressed={reason === entry.id}
              data-active={reason === entry.id || undefined}
              key={entry.id}
              onClick={() => setReason(entry.id)}
              type="button"
            >
              <strong>{entry.label}</strong>
              <span>{entry.blurb}</span>
            </button>
          ))}
        </div>

        {reason === "pain" ? (
          <p className="end-dialog__note">
            Do not push through new or sharp pain. Today stays out of your completed load and the
            next plan review will avoid this area.
          </p>
        ) : null}
        {reason !== null && reason !== "pain" ? (
          <p className="end-dialog__note">
            Rest today and try again tomorrow. Some easy stretching is plenty.
          </p>
        ) : null}

        <Button
          disabled={reason === null}
          onClick={() => reason && onAbort(reason)}
          size="large"
          variant="danger"
        >
          End the session
        </Button>
        <button className="text-action" onClick={onClose} type="button">
          Back to the session
        </button>
      </Dialog>
    );
  }

  // The confirmation behind the Back button, whenever any set is logged. It used
  // To be a celebration screen — thumbs-up, calorie estimate, "Next Challenge" —
  // Which said the same thing as the summary, less accurately. Now it just asks
  // The question Back raises, and offers the three honest answers: save it, stop
  // Early without saving, or carry on.
  return (
    <Dialog label="Finish this session?">
      <div className="end-dialog__mark" aria-hidden="true">
        <Flag size={24} />
      </div>
      <h2>Finish here?</h2>
      <p>
        {totalSets === 1 ? "1 set is" : `${totalSets} sets are`} logged. We&rsquo;ll save the
        session and show you the summary.
      </p>
      <Button onClick={() => onFinish(false)} size="large">
        Finish and save
      </Button>
      <button className="text-action" onClick={onClose} type="button">
        Keep training
      </button>
      {/* Stopping early is a different outcome from finishing — it must not be
          reachable only by finishing first. */}
      <button className="end-dialog__quiet" onClick={() => setView("reason")} type="button">
        Stop without saving
      </button>
    </Dialog>
  );
}

function Dialog({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      aria-label={label}
      aria-modal="true"
      className="live-sheet live-sheet--dialog"
      role="dialog"
    >
      {/* The grab handle went with the bottom-sheet position: a centred dialog
          cannot be dragged anywhere, so a drag affordance was a lie. */}
      <div className="end-dialog">{children}</div>
    </div>
  );
}
