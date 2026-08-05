import type { ExerciseResult } from "@/shared/api/bff/workout/types";

export type AdhocExercise = {
  id: string;
  name: string;
  prescription: string;
  rest: string;
  note: string;
  sets: number;
  reps: number;
  weightKg?: number;
};

// Weighted Exercise Keywords Helper
const WEIGHTED_KEYWORDS = [
  "dumbbell",
  "barbell",
  "kettlebell",
  "press",
  "row",
  "deadlift",
  "squat",
  "curl",
  "extension",
  "pulldown",
  "cable",
  "machine",
  "bench",
  "lunge",
];

export function isWeightedExercise(name: string): boolean {
  const lower = name.toLowerCase();
  return WEIGHTED_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Chuyển ExerciseResult từ BFF sang AdhocExercise cho local state.
 */
export function toAdhocExercise(ex: ExerciseResult, uniqueSuffix?: string): AdhocExercise {
  const parsedReps = parseInt(ex.prescription.split("×")[1] ?? "10", 10);
  const reps = isNaN(parsedReps) ? 10 : parsedReps;

  return {
    ...ex,
    id: uniqueSuffix ? `${ex.id}-${uniqueSuffix}` : ex.id,
    sets: 3,
    reps,
    weightKg: isWeightedExercise(ex.name)
      ? ex.name.toLowerCase().includes("dumbbell")
        ? 14
        : 16
      : undefined,
  };
}
