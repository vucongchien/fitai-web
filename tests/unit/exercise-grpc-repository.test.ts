import { create } from "@bufbuild/protobuf";
import type { Client } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_FILTERS } from "@/features/exercise/domain/exercise";
import {
  GetExerciseResponseSchema,
  SearchExercisesResponseSchema,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import {
  Equipment,
  ExerciseCategory,
  ExerciseLevel,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import type { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";

type ExerciseClient = Client<typeof ExerciseService>;

const mockSearchExercises = vi.fn<ExerciseClient["searchExercises"]>();
const mockGetExercise = vi.fn<ExerciseClient["getExercise"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: vi.fn(() => ({
    searchExercises: mockSearchExercises,
    getExercise: mockGetExercise,
  })),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(() => ({})),
}));

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

const BENCH = {
  id: "ex-bench-press",
  name: "Barbell Bench Press",
  slug: "Barbell_Bench_Press_-_Medium_Grip",
  primaryMuscle: MuscleGroup.CHEST,
  secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  equipment: Equipment.BARBELL,
  category: ExerciseCategory.STRENGTH,
  level: ExerciseLevel.BEGINNER,
  instructions: ["Lie back on the bench.", "Press the bar up."],
  images: ["https://img/0.jpg", "https://img/1.jpg"],
  hasAiSupported: true,
  motionSlug: "bench_press",
};

describe("exercise catalog gRPC repository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSearchExercises.mockReset();
    mockGetExercise.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("search sends enum filters and maps the taxonomy fields", async () => {
    mockSearchExercises.mockResolvedValue(
      create(SearchExercisesResponseSchema, { exercises: [BENCH], totalCount: 1 }),
    );

    const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
    const results = await exerciseSearchRepository.search({
      ...EMPTY_FILTERS,
      q: "bench",
      muscles: [MuscleGroup.CHEST],
      equipment: [Equipment.BARBELL],
      levels: [ExerciseLevel.BEGINNER],
      aiOnly: true,
    });

    expect(mockSearchExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "bench",
        primaryMuscles: [MuscleGroup.CHEST],
        equipment: [Equipment.BARBELL],
        levels: [ExerciseLevel.BEGINNER],
        categories: [],
        hasAiSupported: true,
      }),
    );
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      primaryMuscle: MuscleGroup.CHEST,
      secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
      instructions: ["Lie back on the bench.", "Press the bar up."],
      images: ["https://img/0.jpg", "https://img/1.jpg"],
      motionSlug: "bench_press",
    });
    expect(results[0]).not.toHaveProperty("$typeName");
  });

  it("search leaves hasAiSupported unset when the AI filter is off", async () => {
    mockSearchExercises.mockResolvedValue(create(SearchExercisesResponseSchema, {}));
    const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
    await exerciseSearchRepository.search(EMPTY_FILTERS);
    expect(mockSearchExercises.mock.calls[0][0].hasAiSupported).toBeUndefined();
  });

  it("search returns an empty list when the RPC fails", async () => {
    mockSearchExercises.mockRejectedValue(new Error("down"));
    const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
    await expect(exerciseSearchRepository.search(EMPTY_FILTERS)).resolves.toEqual([]);
  });

  it("getById maps the exercise", async () => {
    mockGetExercise.mockResolvedValue(create(GetExerciseResponseSchema, { exercise: BENCH }));
    const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
    const ex = await exerciseSearchRepository.getById("ex-bench-press");
    expect(ex?.name).toBe("Barbell Bench Press");
    expect(ex?.equipment).toBe(Equipment.BARBELL);
  });

  it("getById returns null when the exercise is missing", async () => {
    mockGetExercise.mockResolvedValue(create(GetExerciseResponseSchema, {}));
    const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
    await expect(exerciseSearchRepository.getById("nope")).resolves.toBeNull();
  });
});
