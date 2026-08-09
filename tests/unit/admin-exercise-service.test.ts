import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";

import {
  ApproveExerciseResponseSchema,
  CreateExerciseResponseSchema,
  GetCatalogMetadataResponseSchema,
  GetExerciseResponseSchema,
  SearchExercisesResponseSchema,
  UpdateExerciseResponseSchema,
  ExerciseStatus,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import type { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";

type ExerciseClient = Client<typeof ExerciseService>;

const mockSearchExercises = vi.fn<ExerciseClient["searchExercises"]>();
const mockGetExercise = vi.fn<ExerciseClient["getExercise"]>();
const mockApproveExercise = vi.fn<ExerciseClient["approveExercise"]>();
const mockUpdateExercise = vi.fn<ExerciseClient["updateExercise"]>();
const mockCreateExercise = vi.fn<ExerciseClient["createExercise"]>();
const mockDeleteExercise = vi.fn<ExerciseClient["deleteExercise"]>();
const mockGetCatalogMetadata = vi.fn<ExerciseClient["getCatalogMetadata"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    searchExercises: mockSearchExercises,
    getExercise: mockGetExercise,
    approveExercise: mockApproveExercise,
    updateExercise: mockUpdateExercise,
    createExercise: mockCreateExercise,
    deleteExercise: mockDeleteExercise,
    getCatalogMetadata: mockGetCatalogMetadata,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: vi.fn(async () => ({ accessToken: "test-token", userId: "test-user" })),
}));

describe("admin Exercise Service (gRPC Mocked)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSearchExercises.mockReset();
    mockGetExercise.mockReset();
    mockApproveExercise.mockReset();
    mockUpdateExercise.mockReset();
    mockCreateExercise.mockReset();
    mockDeleteExercise.mockReset();
    mockGetCatalogMetadata.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nên trả về danh sách bài tập đã được lọc và phân trang", async () => {
    mockSearchExercises.mockResolvedValue(
      create(SearchExercisesResponseSchema, {
        exercises: [
          { id: "ex-1", name: "Push up", status: ExerciseStatus.ACTIVE },
          { id: "ex-2", name: "Pull up", status: ExerciseStatus.PENDING_APPROVAL },
          { id: "ex-3", name: "Squat", status: ExerciseStatus.DRAFT },
        ],
      }),
    );

    const { fetchAdminExercises } = await import("@/features/admin/api/admin-exercise-service");
    const res = await fetchAdminExercises({ limit: 2, filters: { status: "approved" } });

    expect(mockSearchExercises).toHaveBeenCalled();
    expect(res.items).toHaveLength(1); // Chỉ ex-1 active (approved)
    expect(res.items[0].id).toBe("ex-1");
  });

  it("nên duyệt (approve) bài tập thành công", async () => {
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

  it("nên lưu trữ (archive) bài tập thành công", async () => {
    mockUpdateExercise.mockResolvedValue(
      create(UpdateExerciseResponseSchema, {
        exercise: { id: "ex-1", name: "Push up", status: ExerciseStatus.ARCHIVED },
      }),
    );

    const { archiveExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await archiveExercise("ex-1");

    expect(mockUpdateExercise).toHaveBeenCalledWith({ id: "ex-1", status: ExerciseStatus.ARCHIVED });
    expect(res.status).toBe("archived");
  });

  it("nên tạo mới bài tập", async () => {
    mockCreateExercise.mockResolvedValue(
      create(CreateExerciseResponseSchema, {
        exercise: { id: "ex-new", name: "Plank", status: ExerciseStatus.DRAFT },
      }),
    );

    const { createExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await createExercise({
      name: "Plank",
      bodyPartId: "bp-core",
      equipmentId: "eq-bodyweight",
      targetMuscleId: "ms-abs",
      secondaryMuscleIds: [],
      tagIds: [],
      instructions: "Hold posture",
      videoUrl: "",
      thumbnailUrl: "",
      difficulty: "beginner",
      defaultRestSeconds: 60,
      hasAiSupported: false,
      status: "created",
      createdBy: "admin",
    });

    expect(mockCreateExercise).toHaveBeenCalled();
    expect(res.id).toBe("ex-new");
    expect(res.status).toBe("created");
  });

  it("nên cập nhật bài tập", async () => {
    mockUpdateExercise.mockResolvedValue(
      create(UpdateExerciseResponseSchema, {
        exercise: { id: "ex-1", name: "Push up v2", status: ExerciseStatus.DRAFT },
      }),
    );

    const { updateExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await updateExercise("ex-1", { name: "Push up v2" });

    expect(mockUpdateExercise).toHaveBeenCalled();
    expect(res.name).toBe("Push up v2");
  });

  it("nên xóa bài tập", async () => {
    mockDeleteExercise.mockResolvedValue(create(UpdateExerciseResponseSchema, {}));

    const { deleteExercise } = await import("@/features/admin/api/admin-exercise-service");
    const res = await deleteExercise("ex-1");

    expect(mockDeleteExercise).toHaveBeenCalled();
    expect(res).toBe(true);
  });
});
