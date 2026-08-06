"use client";

import { Check, Plus } from "lucide-react";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

export function ActiveTimerBar({
  addSeconds = 10,
  display,
  hasInstrument,
  label,
  onAddTime,
  onDone,
  progress,
  timed,
}: {
  display: string;
  /**
   * Accessible name for the ring. The ring has two display modes — countdown and
   * rep count — and only the caller knows which one it is showing, so the name
   * is passed in rather than assumed.
   */
  label: string;
  progress: number | null;
  onDone: () => void;
  onAddTime: () => void;
  addSeconds?: number;
  /**
   * Whether there is anything to display in the ring — a clock or a live rep
   * count. When there is not, the whole footer collapses to a single confirm
   * button instead of a dead ring flanked by a disabled "+10s".
   */
  hasInstrument: boolean;
  /** Whether a clock is actually running, which is what "+10s" acts on. */
  timed: boolean;
}) {
  if (!hasInstrument) {
    return (
      <div className="live-screen__footer live-screen__footer--confirm">
        <button
          aria-label="Complete this set"
          className="live-timerbar__confirm"
          onClick={onDone}
          type="button"
        >
          <Check aria-hidden="true" size={34} />
        </button>
      </div>
    );
  }

  return (
    <div className="live-screen__footer">
      {/* Only a running clock can be extended. On a rep-counted set the ring is
          tracking reps, so "+10s" would have nothing to add to — an empty slot
          keeps the ring centred. */}
      {timed ? (
        <button
          aria-label={`Add ${addSeconds} seconds`}
          className="live-timerbar__side"
          onClick={onAddTime}
          type="button"
        >
          <Plus aria-hidden="true" size={20} />
          <span>{addSeconds}s</span>
        </button>
      ) : (
        <span />
      )}

      <CountdownRing display={display} label={label} progress={progress} tone="effort" />

      {/* Done is the set's primary action and sits on the right, under the
          thumb that just finished the work. */}
      <button aria-label="Done" className="live-timerbar__done" onClick={onDone} type="button">
        <Check aria-hidden="true" size={22} />
        <span>Done</span>
      </button>
    </div>
  );
}
