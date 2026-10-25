import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApproveExerciseResponseSchema,
  CreateBodyPartResponseSchema,
  CreateExerciseResponseSchema,
  DeleteBodyPartResponseSchema,
  GetCatalogMetadataResponseSchema,
  GetExerciseResponseSchema,
  RestoreExerciseResponseSchema,
  SearchExercisesResponseSchema,
  UpdateBodyPartResponseSchema,
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
const mockRestoreExercise = vi.fn<ExerciseClient["restoreExercise"]>();
const mockGetCatalogMetadata = vi.fn<ExerciseClient["getCatalogMetadata"]>();
const mockCreateBodyPart = vi.fn<ExerciseClient["createBodyPart"]>();
const mockCreateEquipment = vi.fn<ExerciseClient["createEquipment"]>();
const mockCreateMuscle = vi.fn<ExerciseClient["createMuscle"]>();
const mockCreateTag = vi.fn<ExerciseClient["createTag"]>();
const mockUpdateBodyPart = vi.fn<ExerciseClient["updateBodyPart"]>();
const mockUpdateEquipment = vi.fn<ExerciseClient["updateEquipment"]>();
const mockUpdateMuscle = vi.fn<ExerciseClient["updateMuscle"]>();
const mockUpdateTag = vi.fn<ExerciseClient["updateTag"]>();
const mockDeleteBodyPart = vi.fn<ExerciseClient["deleteBodyPart"]>();
const mockDeleteEquipment = vi.fn<ExerciseClient["deleteEquipment"]>();
const mockDeleteMuscle = vi.fn<ExerciseClient["deleteMuscle"]>();
const mockDeleteTag = vi.fn<ExerciseClient["deleteTag"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    searchExercises: mockSearchExercises,
    getExercise: mockGetExercise,
    approveExercise: mockApproveExercise,
    updateExercise: mockUpdateExercise,
    createExercise: mockCreateExercise,
    deleteExercise: mockDeleteExercise,
    restoreExercise: mockRestoreExercise,
    getCatalogMetadata: mockGetCatalogMetadata,
    createBodyPart: mockCreateBodyPart,
    createEquipment: mockCreateEquipment,
    createMuscle: mockCreateMuscle,
    createTag: mockCreateTag,
    updateBodyPart: mockUpdateBodyPart,
    updateEquipment: mockUpdateEquipment,
    updateMuscle: mockUpdateMuscle,
    updateTag: mockUpdateTag,
    deleteBodyPart: mockDeleteBodyPart,
    deleteEquipment: mockDeleteEquipment,
    deleteMuscle: mockDeleteMuscle,
    deleteTag: mockDeleteTag,
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
    mockRestoreExercise.mockReset();
    mockGetCatalogMetadata.mockReset();
    mockCreateBodyPart.mockReset();
    mockCreateEquipment.mockReset();
    mockCreateMuscle.mockReset();
    mockCreateTag.mockReset();
    mockUpdateBodyPart.mockReset();
    mockUpdateEquipment.mockReset();
    mockUpdateMuscle.mockReset();
    mockUpdateTag.mockReset();
    mockDeleteBodyPart.mockReset();
    mockDeleteEquipment.mockReset();
    mockDeleteMuscle.mockReset();
    mockDeleteTag.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nên trả về danh sách bài tập đã được lọc và phân trang", async () => {
    mockSearchExercises.mockResolvedValue(
      create(SearchExercisesResponseSchema, {
        exercises: [
          { id: "ex-1", name: "Push up", status: ExerciseStatus.ACTIVE },
        ],
        totalCount: 1,
      }),
    );

    const { fetchAdminExercises } = await import("@/features/admin/api/admin-exercise-service");
    const res = await fetchAdminExercises({ limit: 2, filters: { status: "approved" } });

    expect(mockSearchExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 0,
        status: ExerciseStatus.ACTIVE,
        includeAllStatuses: false,
      }),
    );
    expect(res.items).toHaveLength(1);
    expect(res.items[0].id).toBe("ex-1");
    expect(res.totalCount).toBe(1);
  });

  it("nên khôi phục (restore) bài tập thành công", async () => {
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

    expect(mockUpdateExercise).toHaveBeenCalledWith({
      id: "ex-1",
      status: ExerciseStatus.ARCHIVED,
    });
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

  it("nên lấy danh sách metadata và phân loại theo category", async () => {
    mockGetCatalogMetadata.mockResolvedValue(
      create(GetCatalogMetadataResponseSchema, {
        bodyParts: [{ id: "bp-chest", name: "Chest" }],
        equipments: [{ id: "eq-barbell", name: "Barbell" }],
        muscles: [{ id: "ms-pectoralis", name: "Pectoralis Major" }],
        tags: [{ id: "tg-strength", name: "Strength" }],
      }),
    );

    const { fetchMetadataList } = await import("@/features/admin/api/admin-exercise-service");
    const all = await fetchMetadataList();
    expect(all).toHaveLength(4);

    const onlyBodyParts = await fetchMetadataList("bodyPart");
    expect(onlyBodyParts).toHaveLength(1);
    expect(onlyBodyParts[0].name).toBe("Chest");
  });

  it("nên tạo mới metadata item cho bodyPart", async () => {
    mockCreateBodyPart.mockResolvedValue(
      create(CreateBodyPartResponseSchema, {
        bodyPart: { id: "bp-back", name: "Back" },
      }),
    );

    const { createMetadataItem } = await import("@/features/admin/api/admin-exercise-service");
    const res = await createMetadataItem({ name: "Back", category: "bodyPart" });

    expect(mockCreateBodyPart).toHaveBeenCalledWith({ name: "Back" });
    expect(res.id).toBe("bp-back");
    expect(res.category).toBe("bodyPart");
  });

  it("nên cập nhật metadata item cho bodyPart", async () => {
    mockUpdateBodyPart.mockResolvedValue(
      create(UpdateBodyPartResponseSchema, {
        bodyPart: { id: "bp-back", name: "Upper Back" },
      }),
    );

    const { updateMetadataItem } = await import("@/features/admin/api/admin-exercise-service");
    const res = await updateMetadataItem("bp-back", { name: "Upper Back", category: "bodyPart" });

    expect(mockUpdateBodyPart).toHaveBeenCalledWith({ id: "bp-back", name: "Upper Back" });
    expect(res.name).toBe("Upper Back");
  });

  it("nên xóa metadata item với category được chỉ định", async () => {
    mockDeleteBodyPart.mockResolvedValue(create(DeleteBodyPartResponseSchema, {}));

    const { deleteMetadataItem } = await import("@/features/admin/api/admin-exercise-service");
    const res = await deleteMetadataItem("bp-back", "bodyPart");

    expect(mockDeleteBodyPart).toHaveBeenCalledWith({ id: "bp-back" });
    expect(res).toBe(true);
  });
});
