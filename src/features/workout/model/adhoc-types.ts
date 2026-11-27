import type { ExerciseResult } from "@/features/workout/model/workout.types";
import type { PrescribedExercise } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";

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
  /** Part of the session; a hand-picked movement is main work. */
  phase?: AdhocPhase;
  durationSeconds?: number;
  restSetSec?: number;
  /** The coach's suggested effort; the backend applies its default when absent. */
  targetRpe?: number;
}

export type AdhocPhase = "warmup" | "main" | "cooldown";

/** Line as sent to CreateAdhocSessionPlan, so the coach's numbers survive the save. */
export interface AdhocPrescriptionLine {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  durationSeconds: number;
  restSetSec: number;
  targetRpe: number;
}

export interface AdhocPrescription {
  warmUps: AdhocPrescriptionLine[];
  mainExercises: AdhocPrescriptionLine[];
  coolDowns: AdhocPrescriptionLine[];
}

/** Rest seconds from a "90 sec" label, when the line carries no number. */
function restSeconds(ex: AdhocExercise): number {
  if (ex.restSetSec && ex.restSetSec > 0) return ex.restSetSec;
  const parsed = Number.parseInt(ex.rest, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Groups the builder list into the session the coach is asked to store, in order. */
export function toAdhocPrescription(list: AdhocExercise[]): AdhocPrescription {
  const out: AdhocPrescription = { warmUps: [], mainExercises: [], coolDowns: [] };
  for (const ex of list) {
    const timed = (ex.durationSeconds ?? 0) > 0;
    const line: AdhocPrescriptionLine = {
      exerciseId: ex.exerciseId || ex.id.split("__")[0] || ex.id,
      targetSets: ex.sets,
      targetReps: timed ? 0 : ex.reps,
      targetWeight: ex.weightKg ?? 0,
      durationSeconds: timed ? (ex.durationSeconds ?? 0) : 0,
      restSetSec: restSeconds(ex),
      targetRpe: ex.targetRpe ?? 0,
    };
    if (ex.phase === "warmup") out.warmUps.push(line);
    else if (ex.phase === "cooldown") out.coolDowns.push(line);
    else out.mainExercises.push(line);
  }
  return out;
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
