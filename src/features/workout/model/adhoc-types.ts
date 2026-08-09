import type { PrescribedExercise } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { ExerciseResult } from "@/features/workout/model/workout.types";

export interface AdhocExercise {
  id: string;
  exerciseId?: string;
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
  const rootId = ex.id || "ex-movement";
  return {
    ...ex,
    id: `${rootId}__${suffix}`,
    exerciseId: rootId,
    sets: 3,
    reps: 10,
    weightKg: ex.isWeighted ? (ex.defaultWeightKg ?? 10) : undefined,
  };
}

export function fromPrescribedExercise(
  ex: PrescribedExercise,
  uniqueSuffix?: string,
): AdhocExercise {
  const suffix = uniqueSuffix || Math.random().toString(36).substring(2, 7);
  const sets = ex.targetSets > 0 ? ex.targetSets : 3;
  const reps = ex.targetReps > 0 ? ex.targetReps : 10;
  const restSec = ex.restSetSec > 0 ? ex.restSetSec : 90;
  const rootId = ex.exerciseId || "ex-movement";

  return {
    id: `${rootId}__${suffix}`,
    exerciseId: rootId,
    name: ex.exerciseName || "Prescribed Movement",
    prescription: `${sets} × ${reps}`,
    rest: `${restSec} sec`,
    note: ex.notes || "AI Coach Prescribed",
    sets,
    reps,
    weightKg: ex.targetWeight > 0 ? ex.targetWeight : undefined,
  };
}
