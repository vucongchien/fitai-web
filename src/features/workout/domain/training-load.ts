/**
 * Training load, 1RM and anomaly detection.
 *
 * BR-WL-02: load > 250% of the mean of the last 5 comparable sessions requires
 *           confirmation before saving.
 * BR-WL-04 / FR-WL-04: estimated 1RM via the Epley formula, celebrated on a PR.
 */

import type { SetLogDraft } from "@/features/workout/model/live-session.types";

/** BR-WL-02 threshold: 250% of the recent average. */
export const ANOMALOUS_LOAD_RATIO = 2.5;

/** Volume of one set in kg. Bodyweight work carries no external load. */
export function setVolumeKg(set: Pick<SetLogDraft, "actualReps" | "weightKg">): number {
  const reps = Math.max(0, set.actualReps);
  const weight = Math.max(0, set.weightKg);
  return reps * weight;
}

export function sessionVolumeKg(sets: Array<Pick<SetLogDraft, "actualReps" | "weightKg">>): number {
  return sets.reduce((total, set) => total + setVolumeKg(set), 0);
}

export function totalReps(sets: Array<Pick<SetLogDraft, "actualReps">>): number {
  return sets.reduce((total, set) => total + Math.max(0, set.actualReps), 0);
}

/**
 * BR-WL-02. Returns false when there is no usable baseline (first sessions, or a
 * bodyweight-only history where volume is 0) — we never block on a zero divisor.
 */
export function isAnomalousLoad(currentVolumeKg: number, recentAvgVolumeKg: number): boolean {
  if (recentAvgVolumeKg <= 0) return false;
  return currentVolumeKg > recentAvgVolumeKg * ANOMALOUS_LOAD_RATIO;
}

export function loadRatio(currentVolumeKg: number, recentAvgVolumeKg: number): number {
  if (recentAvgVolumeKg <= 0) return 0;
  return currentVolumeKg / recentAvgVolumeKg;
}

/** Epley: 1RM = w × (1 + reps / 30). Returns 0 for bodyweight or empty sets. */
export function epley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

/** Best estimated 1RM per exercise across the session's sets. */
export function bestOneRepMaxByExercise(sets: SetLogDraft[]): Record<string, number> {
  const best: Record<string, number> = {};
  for (const set of sets) {
    const estimate = epley1RM(set.weightKg, set.actualReps);
    if (estimate <= 0) continue;
    if (estimate > (best[set.exerciseId] ?? 0)) best[set.exerciseId] = estimate;
  }
  return best;
}

/** Small epsilon so floating point noise never fakes a personal record. */
const PR_EPSILON_KG = 0.01;

export function isNewPersonalRecord(estimatedOneRepMax: number, previousBest: number): boolean {
  if (estimatedOneRepMax <= 0) return false;
  return estimatedOneRepMax > previousBest + PR_EPSILON_KG;
}

/** Exercises where this session beat the stored 1RM — drives the PR celebration. */
export function findNewPersonalRecords(
  sets: SetLogDraft[],
  previousBests: Record<string, number>,
): Array<{ exerciseId: string; oneRepMaxKg: number }> {
  return Object.entries(bestOneRepMaxByExercise(sets))
    .filter(([exerciseId, estimate]) =>
      isNewPersonalRecord(estimate, previousBests[exerciseId] ?? 0),
    )
    .map(([exerciseId, estimate]) => ({ exerciseId, oneRepMaxKg: estimate }));
}

export function averageRpe(sets: SetLogDraft[]): number | null {
  const scored = sets.filter((set) => typeof set.rpe === "number");
  if (scored.length === 0) return null;
  return scored.reduce((total, set) => total + (set.rpe ?? 0), 0) / scored.length;
}

/** BR-WL-03: only camera sets carry a Form Score; manual sets stay N/A. */
export function averageFormScore(sets: SetLogDraft[]): number | null {
  const scored = sets.filter((set) => typeof set.formScore === "number");
  if (scored.length === 0) return null;
  return scored.reduce((total, set) => total + (set.formScore ?? 0), 0) / scored.length;
}

/**
 * Rough session burn. Deliberately coarse: ~6 kcal/min of work at moderate
 * effort, nudged by the volume actually moved. Report copy calls it an estimate.
 */
export function estimateCalories(durationMin: number, volumeKg: number): number {
  const base = Math.max(0, durationMin) * 6;
  return Math.round(base + volumeKg * 0.02);
}
