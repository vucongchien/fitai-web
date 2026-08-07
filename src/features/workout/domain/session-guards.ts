/**
 * Guard rails around saving and ending a session.
 *
 * BR-WL-01: warn at 90 min (beginner) / 180 min (experienced); at 240 min with no
 *           interaction the session auto-closes and is flagged `Anomalous Session`.
 * BR-CC-02: < 50% valid skeleton frames → the set is not camera-verified.
 * ux-flow-spec §5.4: bodyweight/warm-up/stretch sets may have weight 0 silently;
 *           other work with reps 0 and weight 0 gets a soft warning before saving.
 * ux-flow-spec §5.5: ending with no logged set asks to cancel instead of saving empty.
 */

import type { LiveExercise, SetLogDraft } from "@/features/workout/model/live-session.types";

export const SESSION_WARN_MIN = 90;
export const SESSION_LONG_WARN_MIN = 180;
export const SESSION_AUTO_CLOSE_MIN = 240;

/** Share of frames that must track for a camera set to count as verified. */
export const VERIFIED_FRAME_RATIO = 0.5;

export type DurationState = "ok" | "long" | "very-long" | "auto-close";

export function durationState(elapsedMin: number): DurationState {
  if (elapsedMin >= SESSION_AUTO_CLOSE_MIN) {return "auto-close";}
  if (elapsedMin >= SESSION_LONG_WARN_MIN) {return "very-long";}
  if (elapsedMin >= SESSION_WARN_MIN) {return "long";}
  return "ok";
}

/** Soft banner copy — the user can always keep going (ux-flow-spec §5.5). */
export function durationWarning(elapsedMin: number): string | null {
  const state = durationState(elapsedMin);
  if (state === "ok") {return null;}
  if (state === "auto-close") {
    return "This session hit 4 hours, so FITAI closed it and kept the data out of your load trend.";
  }
  return "This session has run long. Want to wrap it up?";
}

/** Ux-flow-spec §5.5 — never save an empty session; offer to cancel it. */
export function needsEmptySessionPrompt(sets: SetLogDraft[]): boolean {
  return sets.length === 0;
}

/** Ux-flow-spec §5.4 — weight 0 is normal for bodyweight, warm-ups and stretches. */
export function allowsZeroLoad(exercise: LiveExercise): boolean {
  return !exercise.isWeighted || exercise.phase !== "main" || exercise.durationSeconds > 0;
}

export function zeroLoadWarning(
  set: Pick<SetLogDraft, "actualReps" | "weightKg">,
  exercise: LiveExercise,
): string | null {
  if (allowsZeroLoad(exercise)) {return null;}
  if (set.actualReps > 0 || set.weightKg > 0) {return null;}
  return "This set has no reps and no weight. Save it anyway?";
}

/** BR-CC-02 — only meaningful for camera sets; manual sets are never "unverified". */
export function isCameraVerified(set: Pick<SetLogDraft, "source" | "validFrameRatio">): boolean {
  if (set.source !== "camera") {return true;}
  if (set.validFrameRatio === null) {return true;}
  return set.validFrameRatio >= VERIFIED_FRAME_RATIO;
}

export function countUnverifiedSets(sets: SetLogDraft[]): number {
  return sets.filter((set) => !isCameraVerified(set)).length;
}

/** Gentle wording — ux-flow-spec §5.3 forbids accusatory copy such as "cheating". */
export function verificationNote(sets: SetLogDraft[]): string | null {
  const unverified = countUnverifiedSets(sets);
  if (unverified === 0) {return null;}
  return unverified === 1
    ? "One set could not be verified by the camera."
    : `${unverified} sets could not be verified by the camera.`;
}
