"use client";
import { HeartPulse } from "lucide-react";
import { useId, useState } from "react";

import type { PainReport } from "@/features/workout/domain/pain-report";
import {
  BodySide,
  JointRegion,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import { BODY_SIDE_OPTIONS, JOINT_REGION_OPTIONS } from "@/shared/lib/taxonomy";
import { Button } from "@/shared/ui/button";

/** Free-text is a courtesy, not an interrogation — keep it short. */
const NOTE_MAX = 300;

// Safe exit dialog when a user encounters pain during a live set
export function PainReportDialog({
  onDismiss,
  onStop,
}: {
  /** Stop the session. Every field is optional: region stays UNSPECIFIED when skipped. */
  onStop: (report: PainReport) => void;
  /** Keep training — nothing is recorded. */
  onDismiss: () => void;
}) {
  const [note, setNote] = useState("");
  const [region, setRegion] = useState<JointRegion>(JointRegion.UNSPECIFIED);
  const [side, setSide] = useState<BodySide>(BodySide.BOTH);
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

  // Tapping the picked region again clears it.
  const toggleRegion = (value: JointRegion) =>
    setRegion((current) => (current === value ? JointRegion.UNSPECIFIED : value));

  return (
    <div
      ref={dialogRef}
      aria-labelledby={`${noteId}-title`}
      aria-modal="true"
      className="live-sheet live-sheet--dialog cursor-pointer"
      role="dialog"
      onClick={onDismiss}
    >
      <div className="pain-dialog cursor-default" onClick={(e) => e.stopPropagation()}>
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

        <fieldset className="pain-dialog__field">
          <legend>Where does it hurt? (optional)</legend>
          <div className="pain-dialog__chips">
            {JOINT_REGION_OPTIONS.map((option) => {
              const active = region === option.value;
              return (
                <button
                  aria-pressed={active}
                  className="chip"
                  data-active={active || undefined}
                  key={option.value}
                  onClick={() => toggleRegion(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {region !== JointRegion.UNSPECIFIED ? (
          <fieldset className="pain-dialog__field">
            <legend>Side</legend>
            <div className="pain-dialog__chips">
              {BODY_SIDE_OPTIONS.map((option) => {
                const active = side === option.value;
                return (
                  <button
                    aria-pressed={active}
                    className="chip"
                    data-active={active || undefined}
                    key={option.value}
                    onClick={() => setSide(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

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
          <Button
            onClick={() => onStop({ note: note.trim(), region, side })}
            size="large"
            variant="danger"
          >
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
