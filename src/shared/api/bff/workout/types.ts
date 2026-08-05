/**
 * BFF Workout layer types.
 *
 * Tổng hợp từ:
 *   - ExerciseService.searchExercises → ExerciseResult[]
 *   - (future) AI recommendation service → AiRecommendResult
 */

/**
 * Exercise item được BFF trả về cho FE.
 * Map từ ExerciseInfo proto:
 *   id, name, instructions → notes, defaultRestSeconds → rest
 */
export type ExerciseResult = {
  id: string;
  name: string;
  /** Hiển thị prescription mặc định, vd: "3 × 10" */
  prescription: string;
  /** Hiển thị rest time, vd: "60 sec" */
  rest: string;
  /** Từ ExerciseInfo.instructions */
  note: string;
};

/**
 * Config cho adhoc workout session — từ active roadmap của user.
 * BFF tổng hợp từ CoachingService.getActiveRoadmap.
 */
export type AdhocConfig = {
  /** Target RPE cho adhoc session, từ weekPlan.targetRpe */
  targetRpe: number;
  /** Exercises mặc định khi mở adhoc builder */
  defaultExercises: ExerciseResult[];
};

export type AiRecommendResult = {
  exercises: Array<{
    id: string;
    name: string;
    prescription: string;
    rest: string;
    note: string;
    sets: number;
    reps: number;
    weightKg?: number;
  }>;
};
