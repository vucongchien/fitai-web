"use client";

import { AlertTriangle, Award, Flag, HeartPulse, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { estimateCalories } from "@/features/workout/domain/training-load";
import type { AbortReason } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

export type EndDialogVariant = "menu" | "reason" | "overload" | "empty" | "complete";

const REASONS: Array<{ id: AbortReason; label: string; blurb: string }> = [
  { blurb: "Something hurts — stop now.", id: "pain", label: "Pain or discomfort" },
  { blurb: "No time left today.", id: "out-of-time", label: "Out of time" },
  { blurb: "Not feeling it — that is fine.", id: "uncomfortable", label: "Doesn't feel right" },
];

export function EndSessionDialog({
  estimatedCalories,
  loadRatio,
  onAbort,
  onClose,
  onFinish,
  totalSets = 0,
  totalVolumeKg = 0,
  variant,
}: {
  variant: EndDialogVariant;
  loadRatio: number;
  totalSets?: number;
  totalVolumeKg?: number;
  estimatedCalories?: number;
  onClose: () => void;
  onFinish: (confirmOverload: boolean) => void;
  onAbort: (reason: AbortReason) => void;
}) {
  const [view, setView] = useState<EndDialogVariant>(variant);
  const [reason, setReason] = useState<AbortReason | null>(null);

  useEffect(() => {
    setView(variant);
  }, [variant]);

  const calories = estimatedCalories ?? estimateCalories(30, totalVolumeKg);

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

  return (
    <Dialog label="Workout completed">
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div className="w-20 h-20 rounded-3xl bg-[var(--color-action-soft,#eef0ff)] text-[var(--color-action,#4b57f2)] flex items-center justify-center mb-4 shadow-sm relative transform hover:scale-105 transition-transform">
          <ThumbsUp size={38} className="stroke-[2.5]" />
          <Award
            size={20}
            className="absolute -top-1 -right-1 text-[var(--color-effort,#ff5a47)]"
          />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text,#101214)] mb-1">
          Great job! Workout completed
        </h2>
        <p className="text-xs text-[var(--color-text-muted,#50565c)] mb-6">
          You kept your reps controlled and completed today&rsquo;s target load.
        </p>

        <div className="w-full bg-[var(--color-surface-subtle,#eceef0)] rounded-2xl p-4 flex items-center justify-around mb-6 border border-[var(--color-border,#c9cdd1)]">
          <div className="flex-1 text-center border-r border-[var(--color-border,#c9cdd1)] pr-2">
            <strong className="data-value text-2xl font-extrabold text-[var(--color-text,#101214)] block">
              {totalSets}
            </strong>
            <span className="text-xs font-semibold text-[var(--color-text-muted,#50565c)] mt-0.5 block">
              Total Sets
            </span>
          </div>
          <div className="flex-1 text-center pl-2">
            <strong className="data-value text-2xl font-extrabold text-[var(--color-text,#101214)] block">
              {calories}
            </strong>
            <span className="text-xs font-semibold text-[var(--color-text-muted,#50565c)] mt-0.5 block">
              Calories Burnt
            </span>
          </div>
        </div>

        <Button
          className="w-full ui-button--primary bg-[var(--color-action,#4b57f2)] text-white text-base py-3.5 rounded-xl shadow-md hover:brightness-105 transition-all mb-2"
          onClick={() => onFinish(false)}
          size="large"
        >
          Next Challenge
        </Button>
        <button
          className="text-action text-xs text-[var(--color-text-muted,#50565c)] hover:text-[var(--color-danger,#c92f42)] transition-colors"
          onClick={() => setView("reason")}
          type="button"
        >
          Report pain or stop early
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      aria-label={label}
      aria-modal="true"
      className="live-sheet live-sheet--dialog fix-sheet-modal"
      role="dialog"
    >
      <div className="end-dialog max-w-sm mx-auto bg-[var(--color-surface,#ffffff)] rounded-3xl p-6 shadow-2xl border border-[var(--color-border,#c9cdd1)]">
        <div className="w-12 h-1.5 bg-[var(--color-border,#c9cdd1)] rounded-full mx-auto mb-4 opacity-60" />
        {children}
      </div>
    </div>
  );
}
