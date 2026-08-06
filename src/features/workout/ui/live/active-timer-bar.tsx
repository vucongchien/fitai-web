"use client";

import { Check, Plus } from "lucide-react";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

export function ActiveTimerBar({
  addSeconds = 10,
  disabled = false,
  display,
  label,
  onAddTime,
  onDone,
  progress,
}: {
  display: string;
  /**
   * Accessible name for the ring. The ring has three display modes — countdown,
   * rep count, untimed — and only the caller knows which one it is showing, so
   * the name is passed in rather than assumed.
   */
  label: string;
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

      <CountdownRing display={display} label={label} progress={progress} tone="effort" />

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
