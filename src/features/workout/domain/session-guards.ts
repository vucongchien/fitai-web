import type {
  LiveExercise,
  MotionSpec,
  SetLogDraft,
} from "@/features/workout/model/live-session.types";

export const SESSION_WARN_MIN = 90;
export const SESSION_LONG_WARN_MIN = 180;
export const SESSION_AUTO_CLOSE_MIN = 240;

export const VERIFIED_FRAME_RATIO = 0.5;

export type DurationState = "ok" | "long" | "very-long" | "auto-close";

export function durationState(elapsedMin: number): DurationState {
  if (elapsedMin >= SESSION_AUTO_CLOSE_MIN) {
    return "auto-close";
  }
  if (elapsedMin >= SESSION_LONG_WARN_MIN) {
    return "very-long";
  }
  if (elapsedMin >= SESSION_WARN_MIN) {
    return "long";
  }
  return "ok";
}

export function durationWarning(elapsedMin: number): string | null {
  const state = durationState(elapsedMin);
  if (state === "ok") {
    return null;
  }
  if (state === "auto-close") {
    return "This session hit 4 hours, so FITAI closed it and kept the data out of your load trend.";
  }
  return "This session has run long. Want to wrap it up?";
}

export function needsEmptySessionPrompt(sets: SetLogDraft[]): boolean {
  return sets.length === 0;
}

export function allowsZeroLoad(exercise: LiveExercise): boolean {
  return !exercise.isWeighted || exercise.phase !== "main" || exercise.durationSeconds > 0;
}

export function zeroLoadWarning(
  set: Pick<SetLogDraft, "actualReps" | "weightKg">,
  exercise: LiveExercise,
): string | null {
  if (allowsZeroLoad(exercise)) {
    return null;
  }
  if (set.actualReps > 0 || set.weightKg > 0) {
    return null;
  }
  return "This set has no reps and no weight. Save it anyway?";
}

export function isCameraVerified(set: Pick<SetLogDraft, "source" | "validFrameRatio">): boolean {
  if (set.source !== "camera") {
    return true;
  }
  if (set.validFrameRatio === null) {
    return true;
  }
  return set.validFrameRatio >= VERIFIED_FRAME_RATIO;
}

export function countUnverifiedSets(sets: SetLogDraft[]): number {
  return sets.filter((set) => !isCameraVerified(set)).length;
}

export function verificationNote(sets: SetLogDraft[]): string | null {
  const unverified = countUnverifiedSets(sets);
  if (unverified === 0) {
    return null;
  }
  return unverified === 1
    ? "One set could not be verified by the camera."
    : `${unverified} sets could not be verified by the camera.`;
}

export function isTimedExercise(
  exercise?: Partial<LiveExercise> | null,
  spec?: Partial<MotionSpec> | null,
): boolean {
  if (spec) {
    const generic = spec as {
      rep_type?: string;
      phase_detection?: { metric?: string; thresholds?: Record<string, unknown> };
    };
    if (generic.rep_type !== undefined) {
      return generic.rep_type === "timed";
    }
    if (generic.phase_detection?.thresholds?.always !== undefined) {
      return true;
    }
    if (generic.phase_detection?.metric !== undefined) {
      return generic.phase_detection.metric === "none";
    }
  }

  if (exercise && (exercise.durationSeconds ?? 0) > 0) {
    return true;
  }

  return false;
}
