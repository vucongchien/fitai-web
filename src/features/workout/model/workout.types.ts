import type { Equipment } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

export interface ExerciseResult {
  id: string;
  name: string;
  equipment: Equipment;
  /** Anything but BODY_ONLY carries a load. */
  isWeighted: boolean;
  /** BFF-provided default weight based on equipment type */
  defaultWeightKg?: number;
  prescription: string;
  rest: string;
  /** From ExerciseInfo.instructions */
  note: string;
}

export interface AdhocConfig {
  targetRpe: number;
  defaultExercises: ExerciseResult[];
}
