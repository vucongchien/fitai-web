"use client";

import { Check, Play } from "lucide-react";

import { formatClock } from "@/features/workout/model/use-session-timer";
import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

/**
 * The non-AI set surface — ux-flow-spec §5.4: a countdown for holds, a plain rep
 * target for rep work, and a single button to finish the set.
 */
export function SetTimer({
  exercise,
  onFinish,
  onStart,
  running,
  secondsLeft,
}: {
  exercise: LiveExercise;
  running: boolean;
  secondsLeft: number;
  onStart: () => void;
  onFinish: () => void;
}) {
  const timed = exercise.durationSeconds > 0;

  if (!running) {
    return (
      <div className="set-stage">
        <div className="set-stage__target">
          <span className="utility-label">Target</span>
          <strong className="data-value">
            {timed ? `${exercise.durationSeconds}s` : `${exercise.targetReps} reps`}
          </strong>
          {exercise.isWeighted ? <span>{exercise.targetWeightKg} kg suggested</span> : <span>Bodyweight</span>}
        </div>
        <Button onClick={onStart} size="large">
          <Play aria-hidden="true" size={18} />
          {timed ? "Start the hold" : "Start the set"}
        </Button>
      </div>
    );
  }

  return (
    <div className="set-stage">
      <div className="set-stage__target" aria-live="polite">
        <span className="utility-label">{timed ? "Time left" : "Working"}</span>
        <strong className="data-value">
          {timed ? formatClock(secondsLeft) : `${exercise.targetReps} reps`}
        </strong>
        <span>{timed ? "Breathe steadily" : "Finish when the reps feel done"}</span>
      </div>
      <Button onClick={onFinish} size="large">
        <Check aria-hidden="true" size={18} />
        Set done
      </Button>
    </div>
  );
}
