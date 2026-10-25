import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeleteMotionSpecificationResponseSchema,
  GetMotionSpecificationResponseSchema,
  GetMotionSpecificationStatsResponseSchema,
  GetPresignedUploadURLResponseSchema,
  ListMotionSpecificationsResponseSchema,
  PatchMotionSpecificationAssetResponseSchema,
  SearchMotionSpecificationsResponseSchema,
  UpdateMotionSpecificationResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type {
  AdminWorkoutExecutionService,
  WorkoutExecutionService,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";

type AdminWorkoutExecutionClient = Client<typeof AdminWorkoutExecutionService>;
type WorkoutExecutionClient = Client<typeof WorkoutExecutionService>;

const mockGetMotionSpecificationStats =
  vi.fn<AdminWorkoutExecutionClient["getMotionSpecificationStats"]>();
const mockListMotionSpecifications =
  vi.fn<AdminWorkoutExecutionClient["listMotionSpecifications"]>();
const mockSearchMotionSpecifications =
  vi.fn<AdminWorkoutExecutionClient["searchMotionSpecifications"]>();
const mockUpdateMotionSpecification =
  vi.fn<AdminWorkoutExecutionClient["updateMotionSpecification"]>();
const mockPatchMotionSpecificationAsset =
  vi.fn<AdminWorkoutExecutionClient["patchMotionSpecificationAsset"]>();
const mockGetPresignedUploadURL = vi.fn<AdminWorkoutExecutionClient["getPresignedUploadURL"]>();
const mockDeleteMotionSpecification =
  vi.fn<AdminWorkoutExecutionClient["deleteMotionSpecification"]>();
const mockGetMotionSpecification = vi.fn<WorkoutExecutionClient["getMotionSpecification"]>();

vi.mock("@connectrpc/connect", () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    getMotionSpecificationStats: mockGetMotionSpecificationStats,
    listMotionSpecifications: mockListMotionSpecifications,
    searchMotionSpecifications: mockSearchMotionSpecifications,
    updateMotionSpecification: mockUpdateMotionSpecification,
    patchMotionSpecificationAsset: mockPatchMotionSpecificationAsset,
    getPresignedUploadURL: mockGetPresignedUploadURL,
    deleteMotionSpecification: mockDeleteMotionSpecification,
    getMotionSpecification: mockGetMotionSpecification,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: vi.fn(async () => ({
    accessToken: "test-admin-token",
    userId: "usr-admin",
  })),
}));

describe("admin Motion Specification Service (ConnectRPC Aligned)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetMotionSpecificationStats.mockReset();
    mockListMotionSpecifications.mockReset();
    mockSearchMotionSpecifications.mockReset();
    mockUpdateMotionSpecification.mockReset();
    mockPatchMotionSpecificationAsset.mockReset();
    mockGetPresignedUploadURL.mockReset();
    mockDeleteMotionSpecification.mockReset();
    mockGetMotionSpecification.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return statistics from ConnectRPC GetMotionSpecificationStats", async () => {
    mockGetMotionSpecificationStats.mockResolvedValue(
      create(GetMotionSpecificationStatsResponseSchema, {
        totalExercises: 42,
        activePoseRules: 30,
        activeVoiceFiles: 25,
        readyAiSpecs: 20,
      }),
    );

    const { fetchMotionSpecificationStats } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const stats = await fetchMotionSpecificationStats();

    expect(mockGetMotionSpecificationStats).toHaveBeenCalledWith({});
    expect(stats.totalExercises).toBe(42);
    expect(stats.activePoseRules).toBe(30);
    expect(stats.activeVoiceFiles).toBe(25);
    expect(stats.readyAiSpecs).toBe(20);
  });

  it("should return paginated motion specifications from ListMotionSpecifications", async () => {
    mockListMotionSpecifications.mockResolvedValue(
      create(ListMotionSpecificationsResponseSchema, {
        motionSpecifications: [
          {
            exerciseId: "ex-squat",
            exerciseName: "Barbell Squat",
            onnxDetectorUrl: "https://storage/detector.onnx",
            onnxSkeletonUrl: "https://storage/skeleton.onnx",
            localRulesUrl: "https://storage/rules.json",
            dialogueEngineUrl: "https://storage/dialogue.json",
            recommendedCameraAngle: "FRONT_45",
          },
          {
            exerciseId: "ex-plank",
            exerciseName: "Plank",
            onnxDetectorUrl: "",
            localRulesUrl: "",
            dialogueEngineUrl: "",
          },
        ],
        totalCount: 2,
        nextPageToken: "",
      }),
    );

    const { fetchMotionSpecifications } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await fetchMotionSpecifications({ page: 1, pageSize: 20 });

    expect(mockListMotionSpecifications).toHaveBeenCalledWith({
      pageSize: 20,
      pageToken: "1",
    });
    expect(res.items).toHaveLength(2);
    expect(res.items[0].exerciseName).toBe("Barbell Squat");
    expect(res.items[0].isReady).toBe(true);
    expect(res.items[1].isReady).toBe(false);
  });

  it("should search motion specifications using SearchMotionSpecifications", async () => {
    mockSearchMotionSpecifications.mockResolvedValue(
      create(SearchMotionSpecificationsResponseSchema, {
        motionSpecifications: [
          {
            exerciseId: "ex-bench",
            exerciseName: "Bench Press",
            onnxDetectorUrl: "https://storage/detector.onnx",
            localRulesUrl: "https://storage/rules.json",
            dialogueEngineUrl: "https://storage/voice.json",
          },
        ],
        totalCount: 1,
        nextPageToken: "",
      }),
    );

    const { searchMotionSpecifications } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await searchMotionSpecifications({ keyword: "bench", page: 1, pageSize: 10 });

    expect(mockSearchMotionSpecifications).toHaveBeenCalledWith({
      keyword: "bench",
      pageSize: 10,
      pageToken: "1",
    });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].exerciseName).toBe("Bench Press");
    expect(res.items[0].isReady).toBe(true);
  });

  it("should fetch single motion specification by exerciseId", async () => {
    mockGetMotionSpecification.mockResolvedValue(
      create(GetMotionSpecificationResponseSchema, {
        exerciseId: "ex-squat",
        onnxDetectorUrl: "https://storage/detector.onnx",
        onnxSkeletonUrl: "https://storage/skeleton.onnx",
        localRulesUrl: "",
        dialogueEngineUrl: "",
        recommendedCameraAngle: "SIDE",
      }),
    );

    const { fetchMotionSpecificationByExerciseId } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await fetchMotionSpecificationByExerciseId("ex-squat");

    expect(mockGetMotionSpecification).toHaveBeenCalledWith({
      exerciseId: "ex-squat",
      coachPersonality: "default",
    });
    expect(res).not.toBeNull();
    expect(res?.exerciseId).toBe("ex-squat");
    expect(res?.recommendedCameraAngle).toBe("SIDE");
  });

  it("should update motion specification via UpdateMotionSpecification", async () => {
    mockUpdateMotionSpecification.mockResolvedValue(
      create(UpdateMotionSpecificationResponseSchema, {}),
    );

    const { updateMotionSpecification } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await updateMotionSpecification({
      exerciseId: "ex-squat",
      onnxDetectorUrl: "https://storage/detector-v2.onnx",
      localRulesUrl: "https://storage/rules-v2.json",
      dialogueEngineUrl: "https://storage/dialogue-v2.json",
    });

    expect(mockUpdateMotionSpecification).toHaveBeenCalledWith({
      exerciseId: "ex-squat",
      onnxDetectorUrl: "https://storage/detector-v2.onnx",
      onnxSkeletonUrl: "",
      localRulesUrl: "https://storage/rules-v2.json",
      dialogueEngineUrl: "https://storage/dialogue-v2.json",
      recommendedCameraAngle: "",
    });
    expect(res.isReady).toBe(true);
  });

  it("should patch motion specification asset via PatchMotionSpecificationAsset", async () => {
    mockPatchMotionSpecificationAsset.mockResolvedValue(
      create(PatchMotionSpecificationAssetResponseSchema, {
        fileUrl: "https://storage/patched-rules.json",
      }),
    );

    const { patchMotionSpecificationAsset } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await patchMotionSpecificationAsset({
      exerciseId: "ex-squat",
      assetType: "POSE_RULES",
      patchJson: '{"key":"val"}',
    });

    expect(mockPatchMotionSpecificationAsset).toHaveBeenCalled();
    expect(res.fileUrl).toBe("https://storage/patched-rules.json");
  });

  it("should delete motion specification via DeleteMotionSpecification", async () => {
    mockDeleteMotionSpecification.mockResolvedValue(
      create(DeleteMotionSpecificationResponseSchema, {}),
    );

    const { deleteMotionSpecification } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await deleteMotionSpecification("ex-squat");

    expect(mockDeleteMotionSpecification).toHaveBeenCalledWith({ exerciseId: "ex-squat" });
    expect(res).toBe(true);
  });

  it("should get presigned upload URL via GetPresignedUploadURL", async () => {
    mockGetPresignedUploadURL.mockResolvedValue(
      create(GetPresignedUploadURLResponseSchema, {
        uploadUrl: "https://s3.amazonaws.com/bucket/upload?signature=xyz",
        fileUrl: "https://storage.fitai.com/models/model.onnx",
        fileName: "model.onnx",
      }),
    );

    const { getPresignedUploadUrl } =
      await import("@/features/admin/api/admin-motion-spec-service");
    const res = await getPresignedUploadUrl("model.onnx", "application/octet-stream");

    expect(mockGetPresignedUploadURL).toHaveBeenCalledWith({
      fileName: "model.onnx",
      contentType: "application/octet-stream",
    });
    expect(res.uploadUrl).toContain("signature=xyz");
    expect(res.fileUrl).toBe("https://storage.fitai.com/models/model.onnx");
  });

  it("should throw error when FITAI_RPC_URL is missing for update and patch", async () => {
    vi.stubEnv("FITAI_RPC_URL", "");

    const { updateMotionSpecification, patchMotionSpecificationAsset } =
      await import("@/features/admin/api/admin-motion-spec-service");

    await expect(updateMotionSpecification({ exerciseId: "ex-1" })).rejects.toThrow(
      "FITAI_RPC_URL not configured",
    );

    await expect(
      patchMotionSpecificationAsset({
        exerciseId: "ex-1",
        assetType: "POSE_RULES",
        patchJson: "{}",
      }),
    ).rejects.toThrow("FITAI_RPC_URL not configured");
  });
});
