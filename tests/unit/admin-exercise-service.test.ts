import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminExerciseInput } from "@/features/admin/domain/admin-types";
import { DEFAULT_EXERCISE_ADMIN_FILTERS } from "@/features/admin/domain/admin-types";
import {
  ApproveExerciseResponseSchema,
  CreateExerciseResponseSchema,
  DeleteExerciseResponseSchema,
  ExerciseStatus,
  RestoreExerciseResponseSchema,
  SearchExercisesResponseSchema,
  UpdateExerciseResponseSchema,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import {
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
  ExerciseMechanic,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import type { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";

type ExerciseClient = Client<typeof ExerciseService>;

const mockSearchExercises = vi.fn<ExerciseClient["searchExercises"]>();
const mockApproveExercise = vi.fn<ExerciseClient["approveExercise"]>();
const mockUpdateExercise = vi.fn<ExerciseClient["updateExercise"]>();
const mockCreateExercise = vi.fn<ExerciseClient["createExercise"]>();
const mockDeleteExercise = vi.fn<ExerciseClient["deleteExercise"]>();
const mockRestoreExercise = vi.fn<ExerciseClient["restoreExercise"]>();

vi.mock("@connectrpc/connect", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@connectrpc/connect")>()),
  createClient: () => ({
    searchExercises: mockSearchExercises,
    approveExercise: mockApproveExercise,
    updateExercise: mockUpdateExercise,
    createExercise: mockCreateExercise,
    deleteExercise: mockDeleteExercise,
    restoreExercise: mockRestoreExercise,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: vi.fn(async () => ({ accessToken: "test-token", userId: "test-user" })),
}));

const PLANK_INPUT: AdminExerciseInput = {
  name: "Plank",
  primaryMuscle: MuscleGroup.ABDOMINALS,
  secondaryMuscles: [MuscleGroup.LOWER_BACK],
  equipment: Equipment.BODY_ONLY,
  category: ExerciseCategory.STRENGTH,
  level: ExerciseLevel.BEGINNER,
  force: ExerciseForce.STATIC,
  mechanic: ExerciseMechanic.UNSPECIFIED,
  instructions: ["Hold a straight line."],
  images: [],
  videoUrl: "",
  defaultRestSeconds: 60,
  motionSlug: "plank",
  status: "created",
};

describe("admin exercise service (gRPC mocked)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    for (const mock of [
      mockSearchExercises,
      mockApproveExercise,
      mockUpdateExercise,
      mockCreateExercise,
      mockDeleteExercise,
      mockRestoreExercise,
    ]) {
      mock.mockReset();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends enum filters as any-of lists and skips UNSPECIFIED ones", async () => {
    mockSearchExercises.mockResolvedValue(
      create(SearchExercisesResponseSchema, {
        exercises: [
          {
            id: "ex-1",
            name: "Push up",
            status: ExerciseStatus.ACTIVE,
            primaryMuscle: MuscleGroup.CHEST,
          },
        ],
        totalCount: 1,
      }),
    );

    const { fetchAdminExercises } = await import("@/features/admin/api/admin-exercise-service");
    const res = await fetchAdminExercises({
      limit: 2,
      filters: {
        ...DEFAULT_EXERCISE_ADMIN_FILTERS,
        status: "approved",
        primaryMuscle: MuscleGroup.CHEST,
        level: ExerciseLevel.EXPERT,
      },
    });

    expect(mockSearchExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 0,
        status: ExerciseStatus.ACTIVE,
        includeAllStatuses: false,
        primaryMuscles: [MuscleGroup.CHEST],
        levels: [ExerciseLevel.EXPERT],
        equipment: [],
        categories: [],
      }),
    );
    expect(res.items[0]).toMatchObject({
      id: "ex-1",
      status: "approved",
      primaryMuscle: MuscleGroup.CHEST,
    });
    expect(res.totalCount).toBe(1);
  });

  it("propagates RPC errors instead of silently truncating infinite pagination", async () => {
    mockSearchExercises.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const { fetchAdminExercises } = await import("@/features/admin/api/admin-exercise-service");
    await expect(fetchAdminExercises({ cursor: "260", limit: 50 })).rejects.toThrow(
      "Rate limit exceeded",
    );
  });

  it("restores an exercise", async () => {
    mockRestoreExercise.mockResolvedValue(
      create(RestoreExerciseResponseSchema, {
        exercise: { id: "ex-1", name: "Push up", status: ExerciseStatus.ACTIVE },
      }),
    );
    const { restoreExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await restoreExercise("ex-1");
    expect(mockRestoreExercise).toHaveBeenCalledWith({ id: "ex-1" });
    expect(res.status).toBe("approved");
  });

  it("approves an exercise", async () => {
    mockApproveExercise.mockResolvedValue(
      create(ApproveExerciseResponseSchema, {
        exercise: { id: "ex-1", name: "Push up", status: ExerciseStatus.ACTIVE },
      }),
    );
    const { approveExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await approveExercise("ex-1");
    expect(mockApproveExercise).toHaveBeenCalledWith({ id: "ex-1" });
    expect(res.status).toBe("approved");
  });

  it("archives an exercise", async () => {
    mockDeleteExercise.mockResolvedValue(create(DeleteExerciseResponseSchema, { success: true }));
    const { archiveExercise } = await import("@/features/admin/api/admin-exercise-service");
    await expect(archiveExercise("ex-1")).resolves.toBeUndefined();
    expect(mockDeleteExercise).toHaveBeenCalledWith({ id: "ex-1" });
  });

  it("creates an exercise with taxonomy enums and motion slug", async () => {
    mockCreateExercise.mockResolvedValue(
      create(CreateExerciseResponseSchema, {
        exercise: { id: "ex-new", name: "Plank", status: ExerciseStatus.DRAFT },
      }),
    );
    const { createExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await createExercise(PLANK_INPUT);

    expect(mockCreateExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Plank",
        primaryMuscle: MuscleGroup.ABDOMINALS,
        secondaryMuscles: [MuscleGroup.LOWER_BACK],
        equipment: Equipment.BODY_ONLY,
        category: ExerciseCategory.STRENGTH,
        level: ExerciseLevel.BEGINNER,
        force: ExerciseForce.STATIC,
        instructions: ["Hold a straight line."],
        motionSlug: "plank",
        status: ExerciseStatus.DRAFT,
      }),
    );
    expect(res.ok && res.exercise.id).toBe("ex-new");
  });

  it("returns a clear message when the slug already exists", async () => {
    mockCreateExercise.mockRejectedValue(new ConnectError("dup", Code.AlreadyExists));
    const { createExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await createExercise(PLANK_INPUT);
    expect(res).toEqual({
      ok: false,
      message: "An exercise with this slug already exists. Use a different name.",
    });
  });

  it("updates an exercise", async () => {
    mockUpdateExercise.mockResolvedValue(
      create(UpdateExerciseResponseSchema, {
        exercise: { id: "ex-1", name: "Push up v2", status: ExerciseStatus.DRAFT },
      }),
    );
    const { updateExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await updateExercise("ex-1", { ...PLANK_INPUT, name: "Push up v2" });
    expect(mockUpdateExercise).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ex-1", name: "Push up v2" }),
    );
    expect(res.ok && res.exercise.name).toBe("Push up v2");
  });

  it("maps FailedPrecondition on update to the motion slug message", async () => {
    mockUpdateExercise.mockRejectedValue(new ConnectError("ai", Code.FailedPrecondition));
    const { updateExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await updateExercise("ex-1", { ...PLANK_INPUT, motionSlug: "" });
    expect(res).toEqual({ ok: false, message: "AI form tracking requires a motion slug." });
  });

  it("deletes an exercise", async () => {
    mockDeleteExercise.mockResolvedValue(create(DeleteExerciseResponseSchema, {}));
    const { deleteExercise } = await import("@/features/admin/api/admin-exercise-service");
    await expect(deleteExercise("ex-1")).resolves.toBe(true);
  });
});
