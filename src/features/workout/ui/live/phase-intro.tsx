"use client";

import { useMemo } from "react";
import { ArrowRight, Clock3, Flame, SkipForward, Snowflake } from "lucide-react";

import { PHASE_LABEL } from "@/features/workout/domain/session-flow";
import type { LiveExercise, SessionPhase } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

const PHASE_COPY: Record<SessionPhase, { blurb: string; Icon: typeof Flame }> = {
  cooldown: {
    blurb: "Five easy minutes to bring your heart rate down and relax your muscles.",
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
  const minutes = useMemo(
    () =>
      Math.max(
        1,
        Math.round(
          exercises.reduce((total, exercise) => {
            const work = exercise.durationSeconds > 0 ? exercise.durationSeconds : exercise.targetReps * 4;
            return total + (work + exercise.restSetSec) * Math.max(1, exercise.targetSets);
          }, 0) / 60,
        ),
      ),
    [exercises],
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-4">
      <section className="w-full max-w-md bg-[var(--color-surface,#ffffff)] rounded-3xl p-6 md:p-8 shadow-xl border border-[var(--color-border,#c9cdd1)] flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-action-soft,#eef0ff)] text-[var(--color-action,#4b57f2)] flex items-center justify-center mb-4 shadow-sm">
          <Icon size={32} />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-action,#4b57f2)] mb-1">
          NEXT BLOCK
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text,#101214)] mb-2">
          {PHASE_LABEL[phase]}
        </h1>
        <p className="text-xs md:text-sm text-[var(--color-text-muted,#50565c)] mb-5 max-w-xs leading-relaxed">
          {blurb}
        </p>

        <div className="flex items-center gap-4 bg-[var(--color-surface-subtle,#eceef0)] px-4 py-2 rounded-xl mb-6 text-xs font-semibold text-[var(--color-text,#101214)]">
          <span className="flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={14} className="text-[var(--color-action,#4b57f2)]" />
            ~{minutes} min
          </span>
          <span className="text-[var(--color-border,#c9cdd1)]">•</span>
          <span>
            {exercises.length} {exercises.length === 1 ? "movement" : "movements"}
          </span>
        </div>

        <ol className="w-full text-left space-y-2 mb-6 divide-y divide-[var(--color-surface-subtle,#eceef0)]">
          {exercises.map((exercise, idx) => (
            <li key={exercise.exerciseId} className="pt-2 first:pt-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-muted,#50565c)] w-5">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <strong className="text-sm font-semibold text-[var(--color-text,#101214)]">
                  {exercise.name}
                </strong>
              </div>
              <span className="text-xs font-medium text-[var(--color-text-muted,#50565c)] bg-[var(--color-surface-subtle,#eceef0)] px-2 py-0.5 rounded-md">
                {exercise.targetSets} ×{" "}
                {exercise.durationSeconds > 0 ? `${exercise.durationSeconds}s` : `${exercise.targetReps}`}
              </span>
            </li>
          ))}
        </ol>

        <div className="w-full flex flex-col items-center gap-3">
          <Button
            className="w-full ui-button--primary bg-[var(--color-action,#4b57f2)] text-white text-base py-3.5 rounded-xl shadow-md hover:brightness-105 transition-all"
            onClick={onBegin}
            size="large"
          >
            <span>Start {PHASE_LABEL[phase].toLowerCase()}</span>
            <ArrowRight aria-hidden="true" size={18} />
          </Button>
          {skippable ? (
            <button
              className="text-action text-xs text-[var(--color-text-muted,#50565c)] hover:text-[var(--color-action,#4b57f2)] transition-colors flex items-center gap-1 mt-1"
              onClick={onSkip}
              type="button"
            >
              <SkipForward aria-hidden="true" size={14} />
              Skip this block
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
