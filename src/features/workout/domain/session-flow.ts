/**
 * Session timeline — turns a prescription into an ordered list of set-sized steps.
 *
 * Pure module: no React, no browser APIs. ux-flow-spec §5.1 requires three
 * distinct blocks (warm-up → main → cooldown) inside one linear flow, each
 * skippable, so the timeline is the single source of truth for "where am I".
 */

import type {
  LiveExercise,
  LiveSessionPlan,
  SessionPhase,
} from "@/features/workout/model/live-session.types";

export const PHASE_ORDER: SessionPhase[] = ["warmup", "main", "cooldown"];

export interface SessionStep {
  /** Index inside the timeline. */
  index: number;
  phase: SessionPhase;
  exercise: LiveExercise;
  /** 1-based position of this exercise inside its phase. */
  exercisePosition: number;
  /** 1-based position of this exercise across the whole session, all phases combined. */
  sessionPosition: number;
  /** 1-based set number for this exercise. */
  setNumber: number;
  isLastSetOfExercise: boolean;
}

/** Warm-ups, then main work, then cooldowns — the order the user experiences. */
export function flattenPlan(plan: LiveSessionPlan): LiveExercise[] {
  return [...plan.warmUps, ...plan.mainExercises, ...plan.coolDowns];
}

export function exercisesOfPhase(plan: LiveSessionPlan, phase: SessionPhase): LiveExercise[] {
  if (phase === "warmup") {return plan.warmUps;}
  if (phase === "cooldown") {return plan.coolDowns;}
  return plan.mainExercises;
}

/** How many exercises the session contains in total — the "of 8" in "Exercise 2 of 8". */
export function totalExerciseCount(plan: LiveSessionPlan): number {
  return flattenPlan(plan).length;
}

/** One step per prescribed set, in execution order. */
export function buildTimeline(plan: LiveSessionPlan): SessionStep[] {
  const steps: SessionStep[] = [];
  let sessionPosition = 0;

  for (const phase of PHASE_ORDER) {
    const exercises = exercisesOfPhase(plan, phase);
    exercises.forEach((exercise, exerciseIndex) => {
      sessionPosition += 1;
      const sets = Math.max(1, exercise.targetSets);
      for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
        steps.push({
          index: steps.length,
          phase,
          exercise,
          exercisePosition: exerciseIndex + 1,
          sessionPosition,
          setNumber,
          isLastSetOfExercise: setNumber === sets,
        });
      }
    });
  }

  return steps;
}

export function phasesPresent(plan: LiveSessionPlan): SessionPhase[] {
  return PHASE_ORDER.filter((phase) => exercisesOfPhase(plan, phase).length > 0);
}

/** Steps that belong to `phase` — used by the phase intro and skip actions. */
export function stepsOfPhase(timeline: SessionStep[], phase: SessionPhase): SessionStep[] {
  return timeline.filter((step) => step.phase === phase);
}

export function firstStepIndexOfPhase(timeline: SessionStep[], phase: SessionPhase): number {
  return timeline.findIndex((step) => step.phase === phase);
}

/**
 * Index of the first step after every step of `phase`.
 * Returns timeline.length when nothing follows (the session is over).
 */
export function stepIndexAfterPhase(timeline: SessionStep[], phase: SessionPhase): number {
  const next = timeline.findIndex(
    (step) => PHASE_ORDER.indexOf(step.phase) > PHASE_ORDER.indexOf(phase),
  );
  return next === -1 ? timeline.length : next;
}

/** Index of the first step of the next exercise — the "skip this exercise" target. */
export function stepIndexAfterExercise(timeline: SessionStep[], fromIndex: number): number {
  const current = timeline[fromIndex];
  if (!current) {return timeline.length;}
  for (let i = fromIndex + 1; i < timeline.length; i += 1) {
    if (timeline[i]!.exercise.exerciseId !== current.exercise.exerciseId) {return i;}
  }
  return timeline.length;
}

/**
 * Rest to run after finishing the step at `index`.
 * Between sets of one exercise it is restSetSec; crossing into the next
 * exercise it is restExerciseSec. No rest after the final step.
 */
export function restSecondsAfter(timeline: SessionStep[], index: number): number {
  const current = timeline[index];
  const next = timeline[index + 1];
  if (!current || !next) {return 0;}
  return next.exercise.exerciseId === current.exercise.exerciseId
    ? current.exercise.restSetSec
    : current.exercise.restExerciseSec;
}

export function isLastStep(timeline: SessionStep[], index: number): boolean {
  return index >= timeline.length - 1;
}

/** 0..1 — replaces the old hard-coded `exercises.length * 3` assumption. */
export function progressRatio(completedSets: number, timeline: SessionStep[]): number {
  if (timeline.length === 0) {return 0;}
  return Math.min(Math.max(completedSets / timeline.length, 0), 1);
}

/** Rough session length, used for the pre-session estimate and pacing copy. */
export function estimatedDurationMin(plan: LiveSessionPlan): number {
  const seconds = flattenPlan(plan).reduce((total, exercise) => {
    const sets = Math.max(1, exercise.targetSets);
    const workPerSet =
      exercise.durationSeconds > 0
        ? exercise.durationSeconds
        : Math.max(exercise.targetReps, 1) * 4;
    const rest = exercise.restSetSec * (sets - 1) + exercise.restExerciseSec;
    return total + workPerSet * sets + rest;
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}
