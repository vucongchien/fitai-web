import { createClient } from "@connectrpc/connect";

import type {
  CatalogMetadata,
  Difficulty,
  ExerciseFilters,
  ExerciseSummary,
} from "@/features/exercise/domain/exercise";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

function mapDifficulty(diff?: string): Difficulty {
  switch (diff?.toUpperCase()) {
    case "BEGINNER": {
      return "beginner";
    }
    case "ADVANCED": {
      return "advanced";
    }
    default: {
      return "intermediate";
    }
  }
}

export interface ExerciseSearchRepository {
  search(filters: ExerciseFilters): Promise<ExerciseSummary[]>;
  getCatalog(): Promise<CatalogMetadata>;
  getById(id: string): Promise<ExerciseSummary | null>;
}

const DEFAULT_CATALOG = {
  bodyParts: [
    { id: "legs", name: "Legs" },
    { id: "chest", name: "Chest" },
    { id: "back", name: "Back" },
    { id: "core", name: "Core" },
    { id: "arms", name: "Arms" },
    { id: "shoulders", name: "Shoulders" },
    { id: "full_body", name: "Full Body" },
  ],
  equipments: [
    { id: "barbell", name: "Barbell" },
    { id: "dumbbells", name: "Dumbbells" },
    { id: "bodyweight", name: "Bodyweight" },
    { id: "kettlebell", name: "Kettlebell" },
    { id: "machine", name: "Machine" },
    { id: "resistance_band", name: "Resistance Band" },
  ],
  muscles: [
    { id: "quadriceps", name: "Quadriceps", bodyPartId: "legs" },
    { id: "glutes", name: "Glutes", bodyPartId: "legs" },
    { id: "hamstrings", name: "Hamstrings", bodyPartId: "legs" },
    { id: "pectorals", name: "Pectorals", bodyPartId: "chest" },
    { id: "latissimus", name: "Lats", bodyPartId: "back" },
    { id: "rectus-abdominis", name: "Abs", bodyPartId: "core" },
    { id: "biceps", name: "Biceps", bodyPartId: "arms" },
    { id: "triceps", name: "Triceps", bodyPartId: "arms" },
    { id: "deltoids", name: "Deltoids", bodyPartId: "shoulders" },
  ],
  tags: [
    { id: "hypertrophy", name: "Hypertrophy" },
    { id: "strength", name: "Strength" },
    { id: "core", name: "Core" },
    { id: "endurance", name: "Endurance" },
  ],
};

export const exerciseSearchRepository: ExerciseSearchRepository = {
  async search(filters) {
    const raw = filters as any;
    const keyword = filters.q || raw.query || "";

    if (process.env.FITAI_RPC_URL) {
      try {
        const accessToken = await getAccessToken();
        const client = createClient(ExerciseService, createServerTransport(accessToken));
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

        if (res.exercises && res.exercises.length > 0) {
          return res.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            bodyPartId: ex.bodyPartId,
            equipmentId: ex.equipmentId,
            targetMuscleId: ex.targetMuscleId,
            secondaryMuscleIds: ex.secondaryMuscleIds || [],
            tagIds: ex.tagIds || [],
            instructions: ex.instructions || "",
            videoUrl: ex.videoUrl || ex.mediaUrl || "",
            mediaUrl: ex.mediaUrl || "",
            thumbnailUrl: ex.thumbnailUrl || ex.mediaUrl || "",
            difficulty: mapDifficulty(ex.difficulty),
            defaultRestSeconds: ex.defaultRestSeconds || 90,
            hasAiSupported: Boolean(ex.hasAiSupported),
          }));
        }
      } catch (error) {
        console.warn("[exerciseSearchRepository.search] gRPC error:", error);
      }
    }

    return [];
  },

  async getCatalog() {
    if (process.env.FITAI_RPC_URL) {
      try {
        const accessToken = await getAccessToken();
        const client = createClient(ExerciseService, createServerTransport(accessToken));
        const res = await client.getCatalogMetadata({});

        const bodyParts = (res.bodyParts || []).map((b) => ({ id: b.id, name: b.name }));
        const equipments = (res.equipments || []).map((e) => ({ id: e.id, name: e.name }));
        const muscles = (res.muscles || []).map((m) => ({ id: m.id, name: m.name, bodyPartId: m.bodyPartId }));
        const tags = (res.tags || []).map((t) => ({ id: t.id, name: t.name }));

        return {
          bodyParts: bodyParts.length > 0 ? bodyParts : DEFAULT_CATALOG.bodyParts,
          equipments: equipments.length > 0 ? equipments : DEFAULT_CATALOG.equipments,
          muscles: muscles.length > 0 ? muscles : DEFAULT_CATALOG.muscles,
          tags: tags.length > 0 ? tags : DEFAULT_CATALOG.tags,
        };
      } catch (error) {
        console.warn("[exerciseSearchRepository.getCatalog] gRPC error:", error);
      }
    }

    return DEFAULT_CATALOG;
  },

  async getById(id: string) {
    if (process.env.FITAI_RPC_URL) {
      try {
        const accessToken = await getAccessToken();
        const client = createClient(ExerciseService, createServerTransport(accessToken));
        const res = await client.getExercise({ id });
        const ex = res.exercise;
        if (ex) {
          return {
            id: ex.id,
            name: ex.name,
            bodyPartId: ex.bodyPartId,
            equipmentId: ex.equipmentId,
            targetMuscleId: ex.targetMuscleId,
            secondaryMuscleIds: ex.secondaryMuscleIds || [],
            tagIds: ex.tagIds || [],
            instructions: ex.instructions || "",
            videoUrl: ex.videoUrl || ex.mediaUrl || "",
            mediaUrl: ex.mediaUrl || "",
            thumbnailUrl: ex.thumbnailUrl || ex.mediaUrl || "",
            difficulty: mapDifficulty(ex.difficulty),
            defaultRestSeconds: ex.defaultRestSeconds || 90,
            hasAiSupported: Boolean(ex.hasAiSupported),
          };
        }
      } catch (error) {
        console.warn("[exerciseSearchRepository.getById] gRPC error:", error);
      }
    }

    return null;
  },
};
