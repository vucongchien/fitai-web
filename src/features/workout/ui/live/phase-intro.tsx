"use client";

import { ArrowRight, Clock3, Flame, Snowflake, SkipForward } from "lucide-react";

import { PHASE_LABEL } from "@/features/workout/domain/session-flow";
import type { LiveExercise, SessionPhase } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

const PHASE_COPY: Record<SessionPhase, { blurb: string; Icon: typeof Flame }> = {
  cooldown: {
    blurb: "Five easy minutes to bring the heart rate down and let the shoulders open.",
    Icon: Snowflake,
  },
  main: {
    blurb: "The working sets. Take the rest you are given — it is part of the prescription.",
    Icon: Flame,
  },
  warmup: {
    blurb: "A few minutes to warm the joints you are about to load. Worth it, but skippable.",
    Icon: Flame,
  },
};

/**
 * The card that opens each block of the session — ux-flow-spec §5.1 asks for three
 * visibly separate phases, and FR-AC-07 requires warm-up and cooldown to be
 * skippable without any friction or guilt.
 */
export function PhaseIntro({
  exercises,
  onBegin,
  onSkip,
  phase,
}: {
  phase: SessionPhase;
  exercises: LiveExercise[];
  onBegin: () => void;
  onSkip: () => void;
}) {
  const { blurb, Icon } = PHASE_COPY[phase];
  const skippable = phase !== "main";
  const minutes = Math.max(
    1,
    Math.round(
      exercises.reduce((total, exercise) => {
        const work = exercise.durationSeconds > 0 ? exercise.durationSeconds : exercise.targetReps * 4;
        return total + (work + exercise.restSetSec) * Math.max(1, exercise.targetSets);
      }, 0) / 60,
    ),
  );

  return (
    <section className="phase-intro">
      <div className="phase-intro__mark" aria-hidden="true">
        <Icon size={26} />
      </div>
      <p className="utility-label">Next block</p>
      <h1>{PHASE_LABEL[phase]}</h1>
      <p className="phase-intro__blurb">{blurb}</p>

      <div className="phase-intro__facts">
        <span>
          <Clock3 aria-hidden="true" size={16} />~{minutes} min
        </span>
        <span>
          {exercises.length} {exercises.length === 1 ? "movement" : "movements"}
        </span>
      </div>

      <ol className="phase-intro__list">
        {exercises.map((exercise) => (
          <li key={exercise.exerciseId}>
            <strong>{exercise.name}</strong>
            <span>
              {exercise.targetSets} ×{" "}
              {exercise.durationSeconds > 0 ? `${exercise.durationSeconds}s` : `${exercise.targetReps}`}
            </span>
          </li>
        ))}
      </ol>

      <div className="phase-intro__actions">
        <Button onClick={onBegin} size="large">
          Start {PHASE_LABEL[phase].toLowerCase()}
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
        {skippable ? (
          <button className="text-action" onClick={onSkip} type="button">
            <SkipForward aria-hidden="true" size={17} />
            Skip this block
          </button>
        ) : null}
      </div>
    </section>
  );
}
