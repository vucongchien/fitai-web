"use client";

import { ArrowRight, Plus } from "lucide-react";

import type { SessionStep } from "@/features/workout/domain/session-flow";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { Button } from "@/shared/ui/button";

/**
 * Rest between sets. Shows what is coming so the user can set up in advance, and
 * the countdown can always be cut short or stretched — rest is guidance, not a gate.
 */
export function RestView({
  nextStep,
  onAddTime,
  onSkip,
  secondsLeft,
}: {
  secondsLeft: number;
  nextStep: SessionStep | null;
  onSkip: () => void;
  onAddTime: () => void;
}) {
  return (
    <div className="rest-instrument" aria-live="polite">
      <span>Recovery</span>
      <strong className="data-value">{formatClock(secondsLeft)}</strong>

      {nextStep ? (
        <p className="rest-instrument__next">
          Next: {nextStep.exercise.name} · set {nextStep.setNumber} of{" "}
          {Math.max(1, nextStep.exercise.targetSets)}
        </p>
      ) : null}

      <div className="rest-instrument__actions">
        <Button onClick={onSkip} size="large">
          Next set
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
        <button className="text-action" onClick={onAddTime} type="button">
          <Plus aria-hidden="true" size={16} />
          20 seconds more
        </button>
      </div>
    </div>
  );
}
