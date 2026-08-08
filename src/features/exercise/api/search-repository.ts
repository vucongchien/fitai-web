import { createClient } from "@connectrpc/connect";

import type {
  CatalogMetadata,
  Difficulty,
  ExerciseFilters,
  ExerciseSummary,
} from "@/features/exercise/domain/exercise";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

function mapDifficulty(diff?: string): Difficulty {
  switch (diff?.toUpperCase()) {
    case "BEGINNER":
      return "beginner";
    case "ADVANCED":
      return "advanced";
    default:
      return "intermediate";
  }
}

export interface ExerciseSearchRepository {
  search(filters: ExerciseFilters): Promise<ExerciseSummary[]>;
  getCatalog(): Promise<CatalogMetadata>;
  getById(id: string): Promise<ExerciseSummary | null>;
}

export const exerciseSearchRepository: ExerciseSearchRepository = {
  async search(filters) {
    if (!process.env.FITAI_RPC_URL) {
      return [];
    }
    try {
      const client = createClient(ExerciseService, createServerTransport());
      const raw = filters as any;
      const keyword = filters.q || raw.query || "";
      const bodyPartId = filters.bodyPartIds?.[0] || raw.bodyPartId || "";
      const equipmentId = filters.equipmentIds?.[0] || raw.equipmentId || "";
      const difficulty = filters.difficulty?.[0] || raw.difficulty || "";

      const res = await client.searchExercises({
        keyword,
        bodyPartId,
        equipmentId,
        difficulty,
        limit: 50,
      });

      if (!res.exercises || res.exercises.length === 0) {
        return [];
      }

      return res.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        bodyPartId: ex.bodyPartId,
        equipmentId: ex.equipmentId,
        targetMuscleId: ex.targetMuscleId,
        secondaryMuscleIds: ex.secondaryMuscleIds || [],
        tagIds: ex.tagIds || [],
        instructions: ex.instructions || "",
        videoUrl: ex.videoUrl || "",
        thumbnailUrl: ex.thumbnailUrl || "",
        difficulty: mapDifficulty(ex.difficulty),
        defaultRestSeconds: ex.defaultRestSeconds || 90,
        hasAiSupported: Boolean(ex.hasAiSupported),
      }));
    } catch (error) {
      console.warn("[exerciseSearchRepository.search] failed:", error);
      return [];
    }
  },

  async getCatalog() {
    if (!process.env.FITAI_RPC_URL) {
      return {
        bodyParts: [],
        equipments: [],
        muscles: [],
        tags: [],
      };
    }
    try {
      const client = createClient(ExerciseService, createServerTransport());
      const res = await client.getCatalogMetadata({});

      return {
        bodyParts: res.bodyParts.map((b) => ({ id: b.id, name: b.name })),
        equipments: res.equipments.map((e) => ({ id: e.id, name: e.name })),
        muscles: res.muscles.map((m) => ({ id: m.id, name: m.name, bodyPartId: m.bodyPartId })),
        tags: res.tags.map((t) => ({ id: t.id, name: t.name })),
      };
    } catch (error) {
      console.warn("[exerciseSearchRepository.getCatalog] failed:", error);
      return {
        bodyParts: [],
        equipments: [],
        muscles: [],
        tags: [],
      };
    }
  },

  async getById(id: string) {
    if (!process.env.FITAI_RPC_URL) {
      return null;
    }
    try {
      const client = createClient(ExerciseService, createServerTransport());
      const res = await client.getExercise({ id });
      const ex = res.exercise;
      if (!ex) {
        return null;
      }
      return {
        id: ex.id,
        name: ex.name,
        bodyPartId: ex.bodyPartId,
        equipmentId: ex.equipmentId,
        targetMuscleId: ex.targetMuscleId,
        secondaryMuscleIds: ex.secondaryMuscleIds || [],
        tagIds: ex.tagIds || [],
        instructions: ex.instructions || "",
        videoUrl: ex.videoUrl || "",
        thumbnailUrl: ex.thumbnailUrl || "",
        difficulty: mapDifficulty(ex.difficulty),
        defaultRestSeconds: ex.defaultRestSeconds || 90,
        hasAiSupported: Boolean(ex.hasAiSupported),
      };
    } catch (error) {
      console.warn("[exerciseSearchRepository.getById] failed:", error);
      return null;
    }
  },
};
