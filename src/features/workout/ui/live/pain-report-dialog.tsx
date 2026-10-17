"use client";
import { HeartPulse } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/shared/ui/button";

/** Free-text is a courtesy, not an interrogation — keep it short. */
const NOTE_MAX = 300;

// Safe exit dialog when a user encounters pain during a live set
export function PainReportDialog({
  onDismiss,
  onStop,
}: {
  /** Stop the session. `note` is empty when the user chose not to explain. */
  onStop: (note?: string) => void;
  /** Keep training — nothing is recorded. */
  onDismiss: () => void;
}) {
  const [note, setNote] = useState("");
  const noteId = useId();

  // React 19 Ref Callback Cleanup: Handles Escape key and initial focus on safe stop button
  const dialogRef = (node: HTMLDivElement | null) => {
    if (!node) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Focus lands on "Yes, stop" — the safe outcome
    node.querySelector<HTMLButtonElement>(".pain-dialog__actions button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  };

  return (
    <div
      ref={dialogRef}
      aria-labelledby={`${noteId}-title`}
      aria-modal="true"
      className="live-sheet live-sheet--dialog cursor-pointer"
      role="dialog"
      onClick={onDismiss}
    >
      <div
        className="pain-dialog cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="pain-dialog__actions">
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
