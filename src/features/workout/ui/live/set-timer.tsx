"use client";

import { Check, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { Button } from "@/shared/ui/button";

export function SetTimer({
  children,
  exercise,
  onFinish,
  onRestart,
  onSkip,
  onStart,
  repCount,
  running,
  secondsLeft,
}: {
  exercise: LiveExercise;
  running: boolean;
  secondsLeft: number;
  repCount?: number;
  onStart: () => void;
  onFinish: () => void;
  onRestart?: () => void;
  onSkip?: () => void;
  children?: ReactNode;
}) {
  const timed = exercise.durationSeconds > 0;
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!running) {
      onStart();
    }
  }, [running, onStart]);

  useEffect(() => {
    if (!running) {
      setElapsedSec(0);
      return;
    }
    if (timed) return;

    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running, timed]);

  useEffect(() => {
    if (timed && running && secondsLeft <= 0) {
      onFinish();
    }
  }, [timed, running, secondsLeft, onFinish]);

  const targetGoal = timed
    ? `${exercise.durationSeconds}s hold`
    : exercise.isWeighted
      ? `${exercise.targetReps || 0} reps · ${exercise.targetWeightKg} kg`
      : `${exercise.targetReps || 0} reps`;

  const displayTime = timed
    ? formatClock(secondsLeft)
    : repCount !== undefined
      ? `${repCount} / ${exercise.targetReps || "—"}`
      : formatClock(elapsedSec);

  return (
    <div className="set-stage">
      <div className="set-stage__header">
        <h1>{exercise.name}</h1>
        <p className="set-stage__goal">{targetGoal}</p>
      </div>

      {children ? (
        children
      ) : (
        <div className="set-stage__thumbnail">
          <div className="set-stage__circle">
            <span className="set-stage__label">{exercise.name.charAt(0)}</span>
          </div>
        </div>
      )}

      <div className="set-stage__timer">
        <strong className="data-value">{displayTime}</strong>
      </div>

      <div className="set-stage__actions">
        <Button
          className="ui-button--secondary"
          onClick={() => {
            if (!timed) setElapsedSec(0);
            if (onRestart) onRestart();
          }}
          size="large"
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} />
          <span>Restart</span>
        </Button>

        <Button className="ui-button--primary" onClick={onFinish} size="large" type="button">
          <Check aria-hidden="true" size={16} />
          <span>Done</span>
        </Button>
      </div>

      {onSkip ? (
        <button className="text-action set-stage__skip" onClick={onSkip} type="button">
          Skip
        </button>
      ) : null}
    </div>
  );
}
