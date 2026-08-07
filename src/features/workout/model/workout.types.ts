export interface ExerciseResult {
  id: string;
  name: string;
  /** From ExerciseInfo.equipment_id */
  equipmentId: string;
  /** BFF resolves: equipment.name !== "bodyweight" */
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

export interface AiRecommendResult {
  exercises: {
    id: string;
    name: string;
    prescription: string;
    rest: string;
    note: string;
    sets: number;
    reps: number;
    weightKg?: number;
  }[];
}
