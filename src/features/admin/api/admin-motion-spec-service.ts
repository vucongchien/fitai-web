"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@connectrpc/connect";

import type {
  AdminMotionSpecification,
  PatchMotionAssetRequest,
  PoseRuleConfig,
  DialogueEngineConfig,
  PresignedUploadUrlResponse,
} from "@/features/admin/domain/admin-motion-spec-types";
import {
  resolveDialogueAssetUrl,
  resolveRulesAssetUrl,
} from "@/features/workout/domain/motion-asset-url";
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
  configuredOnly?: boolean;
}

export interface SearchMotionSpecsParams {
  keyword: string;
  page?: number;
  pageSize?: number;
  configuredOnly?: boolean;
}

export interface PaginatedMotionSpecsResponse {
  items: AdminMotionSpecification[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function fetchMotionSpecificationStats(): Promise<MotionSpecStats> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      totalExercises: 0,
      activePoseRules: 0,
      activeVoiceFiles: 0,
      readyAiSpecs: 0,
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

    const res = await client.getMotionSpecificationStats({});
    return {
      totalExercises: res.totalExercises || 0,
      activePoseRules: res.activePoseRules || 0,
      activeVoiceFiles: res.activeVoiceFiles || 0,
      readyAiSpecs: res.readyAiSpecs || 0,
    };
  } catch (err) {
    console.warn("[fetchMotionSpecificationStats] RPC failed:", err);
    return {
      totalExercises: 0,
      activePoseRules: 0,
      activeVoiceFiles: 0,
      readyAiSpecs: 0,
    };
  }
}

function normalizePoseRules(raw: unknown): PoseRuleConfig {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const existingCalibration =
    obj.calibration && typeof obj.calibration === "object"
      ? (obj.calibration as Partial<PoseRuleConfig["calibration"]>)
      : {};
  const existingRepCounting =
    obj.repCounting && typeof obj.repCounting === "object"
      ? (obj.repCounting as Partial<PoseRuleConfig["repCounting"]>)
      : {};
  const existingFormScoring =
    obj.formScoring && typeof obj.formScoring === "object"
      ? (obj.formScoring as Partial<PoseRuleConfig["formScoring"]>)
      : {};

  let errorRules: PoseRuleConfig["errorRules"] =
    obj.errorRules && typeof obj.errorRules === "object"
      ? (obj.errorRules as PoseRuleConfig["errorRules"])
      : {};

  // Map snake_case biomechanics rule files (public/models/rules/*_rule.json) into editor errorRules
  if (Object.keys(errorRules).length === 0 && Array.isArray(obj.rules)) {
    const mapped: PoseRuleConfig["errorRules"] = {};
    for (const rule of obj.rules) {
      if (!rule || typeof rule !== "object") continue;
      const r = rule as Record<string, unknown>;
      const metric = typeof r.metric === "string" ? r.metric : "";
      if (!metric) continue;
      const ranges = Array.isArray(r.ranges) ? (r.ranges as Record<string, unknown>[]) : [];
      const warningRange = ranges.find((rg) => rg.severity === 1) ?? ranges[0];
      const threshold =
        typeof warningRange?.min === "number"
          ? warningRange.min
          : typeof warningRange?.max === "number"
            ? warningRange.max
            : 15;
      mapped[metric.toUpperCase()] = {
        description: typeof r.description === "string" ? r.description : metric,
        joint: metric,
        thresholdDegrees: threshold,
      };
    }
    errorRules = mapped;
  }

  return {
    ...(obj as Partial<PoseRuleConfig>),
    calibration: {
      minDistanceMeters: existingCalibration.minDistanceMeters ?? 1.5,
      maxDistanceMeters: existingCalibration.maxDistanceMeters ?? 3.0,
      targetAngle: existingCalibration.targetAngle ?? 90,
    },
    repCounting: {
      minRomPercentage: existingRepCounting.minRomPercentage ?? 75,
    },
    formScoring: {
      penaltyPerError: existingFormScoring.penaltyPerError ?? 10,
    },
    errorRules,
  };
}

function normalizeDialogueEngine(raw: unknown): DialogueEngineConfig {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (obj.dialogueMap && typeof obj.dialogueMap === "object") {
    return {
      personalityId: typeof obj.personalityId === "string" ? obj.personalityId : "default",
      cooldowns:
        obj.cooldowns && typeof obj.cooldowns === "object"
          ? (obj.cooldowns as Record<string, number>)
          : {},
      dialogueMap: obj.dialogueMap as DialogueEngineConfig["dialogueMap"],
    };
  }

  // Map snake_case dialogue files (public/models/dialogue/*_dialogue.json)
  const dialogueMap: DialogueEngineConfig["dialogueMap"] = {};
  if (obj.voice_feedbacks && typeof obj.voice_feedbacks === "object") {
    for (const [metricKey, value] of Object.entries(
      obj.voice_feedbacks as Record<string, Record<string, unknown>>,
    )) {
      const severities = (value?.severities ?? {}) as Record<string, Record<string, unknown>>;
      const mapStyles = (sevKey: string) => {
        const sev = severities[sevKey];
        const styles = (sev?.styles ?? {}) as Record<string, { text?: string; url?: string }>;
        return Object.values(styles).map((style) => ({
          text: style?.text || "",
          audioUrl: style?.url || "",
        }));
      };
      dialogueMap[metricKey.toUpperCase()] = {
        severity1: mapStyles("warning"),
        severity2: mapStyles("danger"),
      };
    }
  }

  return {
    personalityId:
      typeof obj.exercise === "string"
        ? obj.exercise
        : typeof obj.display_name === "string"
          ? obj.display_name
          : "default",
    cooldowns: {},
    dialogueMap,
  };
}

async function loadJsonAsset<T>(assetUrl: string): Promise<T | undefined> {
  if (!assetUrl) return undefined;
  if (assetUrl.startsWith("/")) {
    const publicDir = path.resolve(process.cwd(), "public");
    const cleanRelPath = assetUrl.split("?")[0].replace(/^\/+/, "");
    const resolved = path.resolve(publicDir, cleanRelPath);
    if (!resolved.startsWith(publicDir + path.sep)) {
      return undefined;
    }
    const raw = await readFile(resolved, "utf-8");
    return JSON.parse(raw) as T;
  }
  const resp = await fetch(assetUrl, { cache: "no-store" });
  if (!resp.ok) return undefined;
  return (await resp.json()) as T;
}

export async function fetchMotionSpecifications({
  page = 1,
  pageSize = 20,
  configuredOnly = false,
}: FetchPaginatedMotionSpecsParams = {}): Promise<PaginatedMotionSpecsResponse> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

    // Backend orders configured specs first (limit capped at 100), so fetching 100
    // captures all configured specs in one RPC while normal pagination uses pageToken.
    const requestSize = configuredOnly ? 100 : pageSize;
    const res = await client.listMotionSpecifications({
      pageSize: requestSize,
      pageToken: configuredOnly ? "1" : String(page),
    });

    const mapped: AdminMotionSpecification[] = (res.motionSpecifications || []).map((item) => {
      const hasRules = Boolean(item.localRulesUrl && item.localRulesUrl.trim().length > 0);
      const hasVoice = Boolean(item.dialogueEngineUrl && item.dialogueEngineUrl.trim().length > 0);
      const hasOnnx = Boolean(item.onnxDetectorUrl && item.onnxDetectorUrl.trim().length > 0);

      return {
        exerciseId: item.exerciseId || "",
        exerciseName: item.exerciseName || "",
        onnxDetectorUrl: item.onnxDetectorUrl || "",
        onnxSkeletonUrl: item.onnxSkeletonUrl || "",
        localRulesUrl: hasRules
          ? resolveRulesAssetUrl(item.localRulesUrl, item.exerciseId, item.exerciseName)
          : "",
        dialogueEngineUrl: hasVoice
          ? resolveDialogueAssetUrl(item.dialogueEngineUrl, item.exerciseId, item.exerciseName)
          : "",
        recommendedCameraAngle: item.recommendedCameraAngle || "",
        isReady: hasRules && hasVoice && hasOnnx,
        updatedAt: new Date().toISOString(),
      };
    });

    const filtered = configuredOnly
      ? mapped.filter((item) => Boolean(item.localRulesUrl || item.dialogueEngineUrl))
      : mapped;
    const start = Math.max(0, (page - 1) * pageSize);
    const items = configuredOnly ? filtered.slice(start, start + pageSize) : filtered;

    return {
      items,
      totalCount: configuredOnly ? filtered.length : res.totalCount || filtered.length,
      page,
      pageSize,
    };
  } catch (err) {
    console.warn("[fetchMotionSpecifications] RPC failed:", err);
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }
}

export async function searchMotionSpecifications({
  keyword,
  page = 1,
  pageSize = 20,
  configuredOnly = false,
}: SearchMotionSpecsParams): Promise<PaginatedMotionSpecsResponse> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));

    const requestSize = configuredOnly ? 100 : pageSize;
    const res = await client.searchMotionSpecifications({
      keyword,
      pageSize: requestSize,
      pageToken: configuredOnly ? "1" : String(page),
    });

    const mapped: AdminMotionSpecification[] = (res.motionSpecifications || []).map((item) => {
      const hasRules = Boolean(item.localRulesUrl && item.localRulesUrl.trim().length > 0);
      const hasVoice = Boolean(item.dialogueEngineUrl && item.dialogueEngineUrl.trim().length > 0);
      const hasOnnx = Boolean(item.onnxDetectorUrl && item.onnxDetectorUrl.trim().length > 0);

      return {
        exerciseId: item.exerciseId || "",
        exerciseName: item.exerciseName || "",
        onnxDetectorUrl: item.onnxDetectorUrl || "",
        onnxSkeletonUrl: item.onnxSkeletonUrl || "",
        localRulesUrl: hasRules
          ? resolveRulesAssetUrl(item.localRulesUrl, item.exerciseId, item.exerciseName)
          : "",
        dialogueEngineUrl: hasVoice
          ? resolveDialogueAssetUrl(item.dialogueEngineUrl, item.exerciseId, item.exerciseName)
          : "",
        recommendedCameraAngle: item.recommendedCameraAngle || "",
        isReady: hasRules && hasVoice && hasOnnx,
        updatedAt: new Date().toISOString(),
      };
    });

    const filtered = configuredOnly
      ? mapped.filter((item) => Boolean(item.localRulesUrl || item.dialogueEngineUrl))
      : mapped;
    const start = Math.max(0, (page - 1) * pageSize);
    const items = configuredOnly ? filtered.slice(start, start + pageSize) : filtered;

    return {
      items,
      totalCount: configuredOnly ? filtered.length : res.totalCount || filtered.length,
      page,
      pageSize,
    };
  } catch (err) {
    console.warn("[searchMotionSpecifications] RPC failed:", err);
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }
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
          localRulesUrl: hasRules ? resolveRulesAssetUrl(res.localRulesUrl, res.exerciseId) : "",
          dialogueEngineUrl: hasVoice
            ? resolveDialogueAssetUrl(res.dialogueEngineUrl, res.exerciseId)
            : "",
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
      const json = await loadJsonAsset<unknown>(spec.localRulesUrl);
      if (json) {
        spec.poseRules = normalizePoseRules(json);
      }
    } catch (err) {
      console.warn(
        `[fetchMotionSpecificationByExerciseId] Failed fetching rules JSON from ${spec.localRulesUrl}:`,
        err,
      );
    }
  }

  if (spec.dialogueEngineUrl) {
    try {
      const json = await loadJsonAsset<unknown>(spec.dialogueEngineUrl);
      if (json) {
        spec.dialogueEngine = normalizeDialogueEngine(json);
      }
    } catch (err) {
      console.warn(
        `[fetchMotionSpecificationByExerciseId] Failed fetching dialogue JSON from ${spec.dialogueEngineUrl}:`,
        err,
      );
    }
  }

  return spec;
}

export async function updateMotionSpecification(
  data: Partial<AdminMotionSpecification> & { exerciseId: string },
): Promise<AdminMotionSpecification> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[updateMotionSpecification] FITAI_RPC_URL not configured or RPC failed.");
  }

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
    console.error("[updateMotionSpecification] RPC failed:", err);
    throw new Error(
      `Cập nhật trên gRPC Server thất bại: ${err instanceof Error ? err.message : String(err)}`,
    );
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
        updatedAt: res.updatedAt
          ? new Date(Number(res.updatedAt.seconds) * 1000).toISOString()
          : new Date().toISOString(),
      };
    } catch (err) {
      console.error("[patchMotionSpecificationAsset] RPC failed:", err);
      throw new Error(
        `Patch asset lên gRPC Server thất bại: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  throw new Error("[patchMotionSpecificationAsset] FITAI_RPC_URL not configured or RPC failed.");
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

  throw new Error("[getPresignedUploadUrl] FITAI_RPC_URL not configured or RPC failed.");
}

export async function deleteMotionSpecification(exerciseId: string): Promise<boolean> {
  if (!process.env.FITAI_RPC_URL) {
    return false;
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(AdminWorkoutExecutionService, createServerTransport(accessToken));
    await client.deleteMotionSpecification({ exerciseId });
    return true;
  } catch (err) {
    console.warn(`[deleteMotionSpecification] RPC failed for ${exerciseId}:`, err);
    return false;
  }
}
