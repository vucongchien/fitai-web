import { createClient } from "@connectrpc/connect";

import { toExerciseSummary } from "@/features/exercise/domain/exercise";
import type { ExerciseFilters, ExerciseSummary } from "@/features/exercise/domain/exercise";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

export interface ExerciseSearchRepository {
  search(filters: ExerciseFilters, limit?: number): Promise<ExerciseSummary[]>;
  getById(id: string): Promise<ExerciseSummary | null>;
}

const DEFAULT_SEARCH_LIMIT = 100;

export const exerciseSearchRepository: ExerciseSearchRepository = {
  async search(filters, limit = DEFAULT_SEARCH_LIMIT) {
    if (!process.env.FITAI_RPC_URL) {
      return [];
    }
    try {
      const accessToken = await getAccessToken();
      const client = createClient(ExerciseService, createServerTransport(accessToken));
      const res = await client.searchExercises({
        keyword: filters.q,
        primaryMuscles: filters.muscles,
        equipment: filters.equipment,
        categories: filters.categories,
        levels: filters.levels,
        hasAiSupported: filters.aiOnly ? true : undefined,
        limit,
      });
      return res.exercises.map(toExerciseSummary);
    } catch (error) {
      console.warn("[exerciseSearchRepository.search] gRPC error:", error);
      return [];
    }
  },

  async getById(id: string) {
    if (!process.env.FITAI_RPC_URL) {
      return null;
    }
    try {
      const accessToken = await getAccessToken();
      const client = createClient(ExerciseService, createServerTransport(accessToken));
      const res = await client.getExercise({ id });
      return res.exercise ? toExerciseSummary(res.exercise) : null;
    } catch (error) {
      console.warn("[exerciseSearchRepository.getById] gRPC error:", error);
      return null;
    }
  },
};
