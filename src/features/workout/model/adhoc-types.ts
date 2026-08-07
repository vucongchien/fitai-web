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
  return {
    ...ex,
    id: uniqueSuffix ? `${ex.id}-${uniqueSuffix}` : ex.id,
    sets: 3,
    reps: 10,
    weightKg: ex.isWeighted ? (ex.defaultWeightKg ?? 10) : undefined,
  };
}
