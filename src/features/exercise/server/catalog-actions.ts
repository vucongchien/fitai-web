"use server";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import type { ExerciseFilters, ExerciseSummary } from "@/features/exercise/domain/exercise";

export async function searchExercisesServerAction(
  filters: ExerciseFilters,
): Promise<ExerciseSummary[]> {
  return exerciseSearchRepository.search(filters);
}
