"use client";

import { HeartPulse } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

/** Free-text is a courtesy, not an interrogation — keep it short. */
const NOTE_MAX = 300;

/**
 * "Something hurts" — raised from the live screen while a set is running.
 *
 * Pain is the one interruption that must not cost a second thought, so this
 * asks exactly one question and offers a place to say why. The note is
 * optional: someone who needs to stop should never be blocked on typing.
 */
export function PainReportDialog({
  onDismiss,
  onStop,
}: {
  /** Stop the session. `note` is empty when the user chose not to explain. */
  onStop: (note: string) => void;
  /** Keep training — nothing is recorded. */
  onDismiss: () => void;
}) {
  const [note, setNote] = useState("");
  const noteId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);

  // Escape is the reflex for "I didn't mean to open this", and while in pain the
  // user should not have to find a specific button to get back to the session.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  // Focus lands on "Yes, stop" — the reason this dialog exists. It is not
  // destructive in the data sense: the safe outcome here is stopping.
  useEffect(() => {
    actionsRef.current?.querySelector("button")?.focus();
  }, []);

  return (
    <div
      aria-labelledby={`${noteId}-title`}
      aria-modal="true"
      className="live-sheet live-sheet--dialog"
      role="dialog"
    >
      <div className="pain-dialog">
        <div className="pain-dialog__mark" aria-hidden="true">
          <HeartPulse size={26} />
        </div>

        <h2 className="pain-dialog__title" id={`${noteId}-title`}>
          Stop the workout?
        </h2>
        <p className="pain-dialog__body">
          Never push through new or sharp pain. We&rsquo;ll end today here and keep it out of your
          completed load.
        </p>

        <div className="pain-dialog__field">
          <label htmlFor={noteId}>What hurts? (optional)</label>
          <textarea
            id={noteId}
            maxLength={NOTE_MAX}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. sharp pain in left knee"
            rows={3}
            value={note}
          />
        </div>

        <div className="pain-dialog__actions" ref={actionsRef}>
          <Button onClick={() => onStop(note.trim())} size="large" variant="danger">
            Yes, stop now
          </Button>
          <button className="text-action" onClick={onDismiss} type="button">
            No, keep training
          </button>
        </div>
      </div>
    </div>
  );
}
