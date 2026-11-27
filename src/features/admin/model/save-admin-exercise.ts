import { createExercise, updateExercise } from "@/features/admin/api/admin-exercise-service";
import type { AdminExerciseInput, AdminExerciseResult } from "@/features/admin/domain/admin-types";

/** Creates on first save (the backend derives the slug from the real name), updates afterwards. */
export function saveAdminExercise(
  exerciseId: string | null,
  input: AdminExerciseInput,
): Promise<AdminExerciseResult> {
  return exerciseId ? updateExercise(exerciseId, input) : createExercise(input);
}
