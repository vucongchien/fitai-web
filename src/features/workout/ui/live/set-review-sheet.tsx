"use client";

import { AlertTriangle, Camera, Check, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { isCameraVerified, zeroLoadWarning } from "@/features/workout/domain/session-guards";
import type { LiveExercise, SetLogDraft } from "@/features/workout/model/live-session.types";
import type { SetReview } from "@/features/workout/model/use-live-session";
import { Button } from "@/shared/ui/button";

/** RPE stays optional — N/A is a first-class answer (ux-flow-spec §5.4). */
const RPE_LABELS: Record<number, string> = {
  4: "Easy and controlled",
  5: "Comfortable",
  6: "Working, with room",
  7: "Challenging, still clean",
  8: "Hard, two reps left",
  9: "All I had",
};

/**
 * Confirm or fix the set before it is saved.
 *
 * ux-flow-spec §5.3 calls this out explicitly for the AI branch: the camera
 * pre-fills reps, weight and Form Score, and nothing is written until the user
 * agrees. The manual branch uses the same sheet so both feel identical.
 */
export function SetReviewSheet({
  exercise,
  onCancel,
  onSave,
  review,
  setNumber,
  targetSets,
}: {
  exercise: LiveExercise;
  review: SetReview;
  setNumber: number;
  targetSets: number;
  onSave: (set: Omit<SetLogDraft, "loggedAt" | "synced">) => void;
  onCancel: () => void;
}) {
  const [reps, setReps] = useState(review.reps);
  const [weightKg, setWeightKg] = useState(review.weightKg);
  const [rpe, setRpe] = useState<number | null>(null);
  const [confirmingZeroLoad, setConfirmingZeroLoad] = useState(false);

  const warning = zeroLoadWarning({ actualReps: reps, weightKg }, exercise);
  const unverified = !isCameraVerified({
    source: review.source,
    validFrameRatio: review.validFrameRatio,
  });

  function save() {
    if (warning && !confirmingZeroLoad) {
      setConfirmingZeroLoad(true);
      return;
    }
    onSave({
      actualReps: reps,
      cameraAngle: review.cameraAngle,
      exerciseId: exercise.exerciseId,
      formScore: review.formScore,
      phase: exercise.phase,
      reps: review.repLogs,
      rpe,
      setNumber,
      source: review.source,
      targetReps: exercise.targetReps,
      validFrameRatio: review.validFrameRatio,
      weightKg,
    });
  }

  return (
    <div className="live-sheet" role="dialog" aria-label="Confirm this set">
      <div className="live-sheet__panel">
        <header className="live-sheet__header">
          <div>
            <p className="utility-label">
              Set {setNumber} of {targetSets} · {exercise.name}
            </p>
            <h2>{review.source === "camera" ? "Here is what the camera saw" : "How did that set go?"}</h2>
          </div>
        </header>

        <div className="live-sheet__body">
          {review.source === "camera" ? (
            <div className="set-review__camera">
              <span>
                <Camera aria-hidden="true" size={16} />
                Auto-filled from tracking
              </span>
              {review.formScore !== null ? (
                <span>
                  Form score <strong className="data-value">{review.formScore}</strong>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="set-composer">
            <div className="set-composer__control">
              <span>{exercise.durationSeconds > 0 ? "Reps or rounds" : "Reps"}</span>
              <div>
                <button
                  aria-label="Decrease reps"
                  onClick={() => setReps((value) => Math.max(0, value - 1))}
                  type="button"
                >
                  <Minus aria-hidden="true" size={20} />
                </button>
                <strong className="data-value">{reps}</strong>
                <button aria-label="Increase reps" onClick={() => setReps((value) => value + 1)} type="button">
                  <Plus aria-hidden="true" size={20} />
                </button>
              </div>
            </div>

            {exercise.isWeighted ? (
              <div className="set-composer__control">
                <span>Weight</span>
                <div>
                  <button
                    aria-label="Decrease weight"
                    onClick={() => setWeightKg((value) => Math.max(0, value - 0.5))}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={20} />
                  </button>
                  <strong className="data-value">{weightKg} kg</strong>
                  <button
                    aria-label="Increase weight"
                    onClick={() => setWeightKg((value) => value + 0.5)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={20} />
                  </button>
                </div>
              </div>
            ) : null}

            <fieldset className="rpe-picker">
              <legend>How hard was that set? (optional)</legend>
              <div>
                {[4, 5, 6, 7, 8, 9].map((value) => (
                  <button
                    aria-label={`RPE ${value}: ${RPE_LABELS[value]}`}
                    aria-pressed={rpe === value}
                    data-active={rpe === value || undefined}
                    key={value}
                    onClick={() => setRpe((current) => (current === value ? null : value))}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p>{rpe === null ? "Skip it and we record N/A." : RPE_LABELS[rpe]}</p>
            </fieldset>
          </div>

          {unverified ? (
            <p className="set-review__note">
              Tracking was patchy for this set, so it will be marked as not camera-verified.
            </p>
          ) : null}

          {warning ? (
            <p className="set-review__note set-review__note--warn">
              <AlertTriangle aria-hidden="true" size={16} />
              {warning}
            </p>
          ) : null}
        </div>

        <footer className="live-sheet__footer">
          <Button onClick={save} size="large">
            <Check aria-hidden="true" size={18} />
            {confirmingZeroLoad ? "Save it anyway" : "Save set"}
          </Button>
          <button className="text-action" onClick={onCancel} type="button">
            Back to the set
          </button>
        </footer>
      </div>
    </div>
  );
}
