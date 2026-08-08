import type { ExerciseResult } from "@/features/workout/model/workout.types";

export interface AdhocExercise {
  id: string;
  name: string;
  prescription: string;
  rest: string;
  note: string;
  sets: number;
  reps: number;
  weightKg?: number;
}

export function toAdhocExercise(ex: ExerciseResult, uniqueSuffix?: string): AdhocExercise {
  const suffix = uniqueSuffix || Math.random().toString(36).substring(2, 7);
  return {
    ...ex,
    id: ex.id.includes("-") ? ex.id : `${ex.id}-${suffix}`,
    sets: 3,
    reps: 10,
    weightKg: ex.isWeighted ? (ex.defaultWeightKg ?? 10) : undefined,
  };
}
