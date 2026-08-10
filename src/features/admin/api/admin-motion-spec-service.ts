"use server";

import { createClient } from "@connectrpc/connect";

import type {
  AdminMotionSpecification,
  PatchMotionAssetRequest,
  PoseRuleConfig,
  DialogueEngineConfig,
  PresignedUploadUrlResponse,
} from "@/features/admin/domain/admin-motion-spec-types";
import { MotionAssetType as MotionAssetTypeEnum } from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import {
  AdminWorkoutExecutionService,
  WorkoutExecutionService,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

export interface MotionSpecStats {
  totalExercises: number;
  activePoseRules: number;
  activeVoiceFiles: number;
  readyAiSpecs: number;
}

export interface FetchPaginatedMotionSpecsParams {
  page?: number;
  pageSize?: number;
}

export interface SearchMotionSpecsParams {
  keyword: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedMotionSpecsResponse {
  items: AdminMotionSpecification[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function fetchMotionSpecificationStats(): Promise<MotionSpecStats> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      if ("getMotionSpecificationStats" in client) {
        const res = await (client as any).getMotionSpecificationStats({});
        return {
          totalExercises: res.totalExercises || 0,
          activePoseRules: res.activePoseRules || 0,
          activeVoiceFiles: res.activeVoiceFiles || 0,
          readyAiSpecs: res.readyAiSpecs || 0,
        };
      }

      const res: any = await (client as any).listMotionSpecifications({ pageSize: 500, pageToken: "" });
      const items = res?.motionSpecifications || [];
      
      const activeRules = items.filter((s: any) => Boolean(s.localRulesUrl && s.localRulesUrl.trim().length > 0)).length;
      const activeVoice = items.filter((s: any) => Boolean(s.dialogueEngineUrl && s.dialogueEngineUrl.trim().length > 0)).length;
      const readySpecs = items.filter(
        (s: any) =>
          Boolean(s.localRulesUrl && s.localRulesUrl.trim().length > 0) &&
          Boolean(s.dialogueEngineUrl && s.dialogueEngineUrl.trim().length > 0),
      ).length;

      return {
        totalExercises: res?.totalCount || items.length,
        activePoseRules: activeRules,
        activeVoiceFiles: activeVoice,
        readyAiSpecs: readySpecs,
      };
    } catch (err) {
      console.warn("[fetchMotionSpecificationStats] RPC failed:", err);
    }
  }

  return {
    totalExercises: 0,
    activePoseRules: 0,
    activeVoiceFiles: 0,
    readyAiSpecs: 0,
  };
}

export async function fetchMotionSpecifications({
  page = 1,
  pageSize = 20,
}: FetchPaginatedMotionSpecsParams = {}): Promise<PaginatedMotionSpecsResponse> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      const res = await client.listMotionSpecifications({
        pageSize,
        pageToken: String(page),
      });

      if (res.motionSpecifications) {
        const items: AdminMotionSpecification[] = res.motionSpecifications.map((item: any) => {
          const hasRules = Boolean(item.localRulesUrl && item.localRulesUrl.trim().length > 0);
          const hasVoice = Boolean(item.dialogueEngineUrl && item.dialogueEngineUrl.trim().length > 0);
          const hasOnnx = Boolean(item.onnxDetectorUrl && item.onnxDetectorUrl.trim().length > 0);

          const rawName = item.exerciseName || item.exercise_name || item.name || "";
          const isUuid = (str?: string) => Boolean(str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str));
          const cleanName = rawName && !isUuid(rawName) ? rawName : rawName;

          return {
            exerciseId: item.exerciseId || item.exercise_id || "",
            exerciseName: cleanName,
            onnxDetectorUrl: item.onnxDetectorUrl || item.onnx_detector_url || "",
            onnxSkeletonUrl: item.onnxSkeletonUrl || item.onnx_skeleton_url || "",
            localRulesUrl: item.localRulesUrl || item.local_rules_url || "",
            dialogueEngineUrl: item.dialogueEngineUrl || item.dialogue_engine_url || "",
            recommendedCameraAngle: item.recommendedCameraAngle || item.recommended_camera_angle || "",
            isReady: hasRules && hasVoice && hasOnnx,
            updatedAt: new Date().toISOString(),
          };
        });

        return {
          items,
          totalCount: res.totalCount || items.length,
          page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn("[fetchMotionSpecifications] RPC failed:", err);
    }
  }

  return {
    items: [],
    totalCount: 0,
    page,
    pageSize,
  };
}

export async function searchMotionSpecifications({
  keyword,
  page = 1,
  pageSize = 20,
}: SearchMotionSpecsParams): Promise<PaginatedMotionSpecsResponse> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      let res: any;
      if ("searchMotionSpecifications" in client) {
        res = await (client as any).searchMotionSpecifications({
          keyword,
          pageSize,
          pageToken: String(page),
        });
      } else {
        res = await (client as any).listMotionSpecifications({
          pageSize: 500,
          pageToken: "1",
        });
      }

      if (res.motionSpecifications) {
        let items: AdminMotionSpecification[] = res.motionSpecifications.map((item: any) => {
          const hasRules = Boolean(item.localRulesUrl && item.localRulesUrl.trim().length > 0);
          const hasVoice = Boolean(item.dialogueEngineUrl && item.dialogueEngineUrl.trim().length > 0);
          const hasOnnx = Boolean(item.onnxDetectorUrl && item.onnxDetectorUrl.trim().length > 0);
          const rawName = item.exerciseName || item.exercise_name || item.name || "";
          const isUuid = (str?: string) => Boolean(str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str));
          const cleanName = rawName && !isUuid(rawName) ? rawName : rawName;

          return {
            exerciseId: item.exerciseId || item.exercise_id || "",
            exerciseName: cleanName,
            onnxDetectorUrl: item.onnxDetectorUrl || "",
            onnxSkeletonUrl: item.onnxSkeletonUrl || "",
            localRulesUrl: item.localRulesUrl || "",
            dialogueEngineUrl: item.dialogueEngineUrl || "",
            recommendedCameraAngle: item.recommendedCameraAngle || "",
            isReady: hasRules && hasVoice && hasOnnx,
            updatedAt: new Date().toISOString(),
          };
        });

        const q = keyword.trim().toLowerCase();
        if (q) {
          items = items.filter(
            (i) =>
              i.exerciseId.toLowerCase().includes(q) ||
              (i.exerciseName && i.exerciseName.toLowerCase().includes(q)) ||
              i.localRulesUrl.toLowerCase().includes(q) ||
              i.dialogueEngineUrl.toLowerCase().includes(q),
          );
        }

        const totalCount = res.totalCount || items.length;
        const startIndex = (page - 1) * pageSize;
        const pageItems = items.slice(startIndex, startIndex + pageSize);

        return {
          items: pageItems,
          totalCount,
          page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn("[searchMotionSpecifications] RPC failed:", err);
    }
  }

  return {
    items: [],
    totalCount: 0,
    page,
    pageSize,
  };
}

export async function fetchMotionSpecificationByExerciseId(
  exerciseId: string,
): Promise<AdminMotionSpecification | null> {
  let spec: AdminMotionSpecification = {
    exerciseId,
    onnxDetectorUrl: "",
    onnxSkeletonUrl: "",
    localRulesUrl: "",
    dialogueEngineUrl: "",
    recommendedCameraAngle: "",
    isReady: false,
    updatedAt: new Date().toISOString(),
  };

  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(WorkoutExecutionService, createServerTransport(accessToken));

      const res = await client.getMotionSpecification({ exerciseId, coachPersonality: "default" });
      if (res) {
        const hasRules = Boolean(res.localRulesUrl && res.localRulesUrl.trim().length > 0);
        const hasVoice = Boolean(res.dialogueEngineUrl && res.dialogueEngineUrl.trim().length > 0);
        const hasOnnx = Boolean(res.onnxDetectorUrl && res.onnxDetectorUrl.trim().length > 0);

        spec = {
          exerciseId: res.exerciseId,
          onnxDetectorUrl: res.onnxDetectorUrl || "",
          onnxSkeletonUrl: res.onnxSkeletonUrl || "",
          localRulesUrl: res.localRulesUrl || "",
          dialogueEngineUrl: res.dialogueEngineUrl || "",
          recommendedCameraAngle: res.recommendedCameraAngle || "",
          isReady: hasRules && hasVoice && hasOnnx,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(`[fetchMotionSpecificationByExerciseId] RPC failed for ${exerciseId}:`, err);
    }
  }

  if (spec.localRulesUrl) {
    try {
      const resp = await fetch(spec.localRulesUrl, { cache: "no-store" });
      if (resp.ok) {
        const json = await resp.json();
        spec.poseRules = json as PoseRuleConfig;
      }
    } catch (err) {
      console.warn(`[fetchMotionSpecificationByExerciseId] Failed fetching rules JSON from ${spec.localRulesUrl}:`, err);
    }
  }

  if (spec.dialogueEngineUrl) {
    try {
      const resp = await fetch(spec.dialogueEngineUrl, { cache: "no-store" });
      if (resp.ok) {
        const json = await resp.json();
        spec.dialogueEngine = json as DialogueEngineConfig;
      }
    } catch (err) {
      console.warn(`[fetchMotionSpecificationByExerciseId] Failed fetching dialogue JSON from ${spec.dialogueEngineUrl}:`, err);
    }
  }

  return spec;
}

export async function updateMotionSpecification(
  data: Partial<AdminMotionSpecification> & { exerciseId: string },
): Promise<AdminMotionSpecification> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      await client.updateMotionSpecification({
        exerciseId: data.exerciseId,
        onnxDetectorUrl: data.onnxDetectorUrl || "",
        onnxSkeletonUrl: data.onnxSkeletonUrl || "",
        localRulesUrl: data.localRulesUrl || "",
        dialogueEngineUrl: data.dialogueEngineUrl || "",
        recommendedCameraAngle: data.recommendedCameraAngle || "",
      });
    } catch (err) {
      console.warn("[updateMotionSpecification] RPC failed:", err);
    }
  }

  const hasRules = Boolean(data.localRulesUrl && data.localRulesUrl.trim().length > 0);
  const hasVoice = Boolean(data.dialogueEngineUrl && data.dialogueEngineUrl.trim().length > 0);
  const hasOnnx = Boolean(data.onnxDetectorUrl && data.onnxDetectorUrl.trim().length > 0);

  return {
    exerciseId: data.exerciseId,
    onnxDetectorUrl: data.onnxDetectorUrl || "",
    onnxSkeletonUrl: data.onnxSkeletonUrl || "",
    localRulesUrl: data.localRulesUrl || "",
    dialogueEngineUrl: data.dialogueEngineUrl || "",
    recommendedCameraAngle: data.recommendedCameraAngle || "",
    isReady: hasRules && hasVoice && hasOnnx,
    updatedAt: new Date().toISOString(),
    poseRules: data.poseRules,
    dialogueEngine: data.dialogueEngine,
  };
}

export async function patchMotionSpecificationAsset(
  req: PatchMotionAssetRequest,
): Promise<{ fileUrl: string; updatedAt: string }> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      const assetTypeEnum =
        req.assetType === "POSE_RULES"
          ? MotionAssetTypeEnum.POSE_RULES
          : MotionAssetTypeEnum.DIALOGUE_CONFIG;

      const res = await client.patchMotionSpecificationAsset({
        exerciseId: req.exerciseId,
        assetType: assetTypeEnum,
        patchJson: req.patchJson,
        deleteKeys: req.deleteKeys || [],
      });

      return {
        fileUrl: res.fileUrl,
        updatedAt: res.updatedAt ? new Date(Number(res.updatedAt.seconds) * 1000).toISOString() : new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[patchMotionSpecificationAsset] RPC failed:", err);
    }
  }

  return {
    fileUrl: "",
    updatedAt: new Date().toISOString(),
  };
}

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
): Promise<PresignedUploadUrlResponse> {
  if (process.env.FITAI_RPC_URL) {
    try {
      const { accessToken } = await getAuthenticatedSession();
      const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

      const res = await client.getPresignedUploadURL({ fileName, contentType });
      return {
        uploadUrl: res.uploadUrl,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
      };
    } catch (err) {
      console.warn("[getPresignedUploadUrl] RPC failed:", err);
    }
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const isAudio = contentType.startsWith("audio/");
  const folder = isAudio ? "audio" : "rules";

  return {
    uploadUrl: `https://storage.fitai.com/upload-mock/${folder}/${Date.now()}_${sanitized}`,
    fileUrl: `https://storage.fitai.com/${folder}/${Date.now()}_${sanitized}`,
    fileName: sanitized,
  };
}
