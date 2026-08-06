"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/**
 * "Read the guide" — instructions, form cues and common mistakes for the current
 * movement. Same content shape as the exercise detail page so the two never drift.
 */
export function InstructionsSheet({
  exercise,
  onClose,
}: {
  exercise: LiveExercise;
  onClose: () => void;
}) {
  return (
    <div className="live-sheet" role="dialog" aria-label={`How to do ${exercise.name}`}>
      <div className="live-sheet__panel">
        <header className="live-sheet__header">
          <div>
            <p className="utility-label">How to do it</p>
            <h2>{exercise.name}</h2>
          </div>
          <button aria-label="Close" className="workout-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="live-sheet__body">
          {exercise.instructions ? <p className="detail-body">{exercise.instructions}</p> : null}

          {exercise.notes ? (
            <section className="detail-section">
              <h3>Coach note for today</h3>
              <p className="detail-body">{exercise.notes}</p>
            </section>
          ) : null}

          {exercise.breathingCue ? (
            <section className="detail-section">
              <h3>Breathing</h3>
              <p className="detail-body">{exercise.breathingCue}</p>
            </section>
          ) : null}

          {exercise.formCues.length > 0 ? (
            <section className="detail-section">
              <h3>Form cues</h3>
              <ul className="cue-list">
                {exercise.formCues.map((cue) => (
                  <li key={cue}>
                    <CheckCircle2 aria-hidden="true" size={16} />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {exercise.commonMistakes.length > 0 ? (
            <section className="detail-section">
              <h3>Common mistakes</h3>
              <ul className="cue-list cue-list--warn">
                {exercise.commonMistakes.map((mistake) => (
                  <li key={mistake}>
                    <AlertCircle aria-hidden="true" size={16} />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
