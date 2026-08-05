"use client";

import { ArrowRight } from "lucide-react";

import type { SessionStep } from "@/features/workout/domain/session-flow";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { Button } from "@/shared/ui/button";

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
  const buttonLabel = nextStep
    ? `Next: ${nextStep.exercise.name} · set ${nextStep.setNumber} of ${Math.max(1, nextStep.exercise.targetSets)}`
    : "Complete Workout";

  return (
    <div className="rest-view" aria-live="polite">
      <div className="rest-view__card">
        <span className="rest-view__label">Recovery</span>
        <strong className="data-value">{formatClock(Math.max(0, secondsLeft))}</strong>
      </div>

      <div className="rest-view__actions">
        <Button className="ui-button--primary" onClick={onSkip} size="large" type="button">
          <span>{buttonLabel}</span>
          <ArrowRight aria-hidden="true" size={16} />
        </Button>

        <button className="text-action rest-view__add" onClick={onAddTime} type="button">
          + 20 seconds more
        </button>
      </div>
    </div>
  );
}
