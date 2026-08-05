"use client";

import { AlertTriangle, Flag, HeartPulse } from "lucide-react";
import { useState } from "react";

import type { AbortReason } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

export type EndDialogVariant = "menu" | "reason" | "overload" | "empty";

const REASONS: Array<{ id: AbortReason; label: string; blurb: string }> = [
  { blurb: "Something hurts — stop now.", id: "pain", label: "Pain or discomfort" },
  { blurb: "No time left today.", id: "out-of-time", label: "Out of time" },
  { blurb: "Not feeling it — that is fine.", id: "uncomfortable", label: "Doesn't feel right" },
];

/**
 * Everything that can happen when a session ends.
 *
 *   menu     — finish normally, or stop early
 *   reason   — ux-flow-spec §5.6: why we are stopping, then a soft landing
 *   overload — BR-WL-02: load above 250% of the recent average needs a yes
 *   empty    — ux-flow-spec §5.5: nothing logged, so offer to cancel instead of saving
 */
export function EndSessionDialog({
  loadRatio,
  onAbort,
  onClose,
  onFinish,
  variant,
}: {
  variant: EndDialogVariant;
  loadRatio: number;
  onClose: () => void;
  onFinish: (confirmOverload: boolean) => void;
  onAbort: (reason: AbortReason) => void;
}) {
  const [view, setView] = useState<EndDialogVariant>(variant);
  const [reason, setReason] = useState<AbortReason | null>(null);

  if (view === "overload") {
    return (
      <Dialog label="Confirm this session">
        <div className="end-dialog__mark end-dialog__mark--warn" aria-hidden="true">
          <AlertTriangle size={24} />
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

        <Button disabled={reason === null} onClick={() => reason && onAbort(reason)} size="large" variant="danger">
          End the session
        </Button>
        <button className="text-action" onClick={onClose} type="button">
          Back to the session
        </button>
      </Dialog>
    );
  }

  return (
    <Dialog label="End session">
      <h2>Finish this session?</h2>
      <p>Your logged sets are saved either way.</p>
      <Button onClick={() => onFinish(false)} size="large">
        Finish and see the report
      </Button>
      <button className="text-action" onClick={() => setView("reason")} type="button">
        <HeartPulse aria-hidden="true" size={17} />
        Stop early — pain or out of time
      </button>
      <button className="text-action" onClick={onClose} type="button">
        Back to the session
      </button>
    </Dialog>
  );
}

function Dialog({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="live-sheet live-sheet--dialog" role="dialog" aria-label={label} aria-modal="true">
      <div className="end-dialog">{children}</div>
    </div>
  );
}
