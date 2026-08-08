import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  GetCatalogMetadataResponseSchema,
  GetExerciseResponseSchema,
  SearchExercisesResponseSchema,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import type { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";

type ExerciseClient = Client<typeof ExerciseService>;

const mockSearchExercises = vi.fn<ExerciseClient["searchExercises"]>();
const mockGetCatalogMetadata = vi.fn<ExerciseClient["getCatalogMetadata"]>();
const mockGetExercise = vi.fn<ExerciseClient["getExercise"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    searchExercises: mockSearchExercises,
    getCatalogMetadata: mockGetCatalogMetadata,
    getExercise: mockGetExercise,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

describe("Exercise Catalog gRPC Repository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSearchExercises.mockReset();
    mockGetCatalogMetadata.mockReset();
    mockGetExercise.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("search returns mapped exercises from gRPC ExerciseService", async () => {
    mockSearchExercises.mockResolvedValue(
      create(SearchExercisesResponseSchema, {
        exercises: [
          {
            id: "ex-bench-press",
            name: "Barbell Bench Press",
            bodyPartId: "chest",
            equipmentId: "barbell",
            targetMuscleId: "pectoralis",
            instructions: "Lie back on bench and press up",
            hasAiSupported: true,
          },
        ],
      }),
    );

    const { exerciseSearchRepository } = await import(
      "@/features/exercise/api/search-repository"
    );
    const results = await exerciseSearchRepository.search({
      query: "bench",
    });

    expect(mockSearchExercises).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "bench" }),
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ex-bench-press");
    expect(results[0].hasAiSupported).toBe(true);
  });

  it("getCatalog fetches metadata taxonomy from backend", async () => {
    mockGetCatalogMetadata.mockResolvedValue(
      create(GetCatalogMetadataResponseSchema, {
        bodyParts: [{ id: "chest", name: "Chest" }],
        equipments: [{ id: "barbell", name: "Barbell" }],
        muscles: [{ id: "pectoralis", name: "Pectoralis Major", bodyPartId: "chest" }],
        tags: [{ id: "hypertrophy", name: "Hypertrophy" }],
      }),
    );

    const { exerciseSearchRepository } = await import(
      "@/features/exercise/api/search-repository"
    );
    const catalog = await exerciseSearchRepository.getCatalog();

    expect(mockGetCatalogMetadata).toHaveBeenCalled();
    expect(catalog.bodyParts).toHaveLength(1);
    expect(catalog.equipments).toHaveLength(1);
  });

  it("getById returns individual exercise details", async () => {
    mockGetExercise.mockResolvedValue(
      create(GetExerciseResponseSchema, {
        exercise: {
          id: "ex-deadlift",
          name: "Barbell Deadlift",
          instructions: "Hinge at the hips",
          hasAiSupported: true,
        },
      }),
    );

    const { exerciseSearchRepository } = await import(
      "@/features/exercise/api/search-repository"
    );
    const ex = await exerciseSearchRepository.getById("ex-deadlift");

    expect(mockGetExercise).toHaveBeenCalledWith({ id: "ex-deadlift" });
    expect(ex).toBeDefined();
    expect(ex?.name).toBe("Barbell Deadlift");
  });
});
