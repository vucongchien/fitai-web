"use client";

import { Check, Plus } from "lucide-react";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

export function ActiveTimerBar({
  addSeconds = 10,
  disabled = false,
  display,
  onAddTime,
  onDone,
  progress,
}: {
  display: string;
  progress: number | null;
  onDone: () => void;
  onAddTime: () => void;
  addSeconds?: number;
  /** No running clock to extend — the + control has nothing to act on. */
  disabled?: boolean;
}) {
  return (
    <div className="live-screen__footer">
      <button aria-label="Done" className="live-timerbar__side" onClick={onDone} type="button">
        <Check aria-hidden="true" size={20} />
        <span>Done</span>
      </button>

      <CountdownRing
        display={display}
        label="Time remaining in this set"
        progress={progress}
        tone="effort"
      />

      <button
        aria-label={`Add ${addSeconds} seconds`}
        className="live-timerbar__side"
        disabled={disabled}
        onClick={onAddTime}
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
        <span>{addSeconds}s</span>
      </button>
    </div>
  );
}
