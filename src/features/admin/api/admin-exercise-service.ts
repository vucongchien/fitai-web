"use server";

import { createClient } from "@connectrpc/connect";

import type {
  AdminExercise,
  AdminExerciseInput,
  AdminExerciseResult,
  AdminExerciseStatus,
  ExerciseAdminFilters,
  PaginatedResponse,
} from "@/features/admin/domain/admin-types";
import { describeExerciseError } from "@/features/admin/domain/exercise-ai-support";
import { toExerciseSummary } from "@/features/exercise/domain/exercise";
import type { ExerciseInfo } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import { ExerciseStatus } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

function mapStatusToProto(status?: AdminExerciseStatus): ExerciseStatus {
  switch (status) {
    case "created": {
      return ExerciseStatus.DRAFT;
    }
    case "approved": {
      return ExerciseStatus.ACTIVE;
    }
    case "archived": {
      return ExerciseStatus.ARCHIVED;
    }
    default: {
      return ExerciseStatus.UNSPECIFIED;
    }
  }
}

function mapStatusToUI(status: ExerciseStatus): AdminExerciseStatus {
  switch (status) {
    case ExerciseStatus.DRAFT: {
      return "created";
    }
    case ExerciseStatus.ACTIVE: {
      return "approved";
    }
    case ExerciseStatus.ARCHIVED: {
      return "archived";
    }
    default: {
      return "created";
    }
  }
}

function toAdminExercise(ex: ExerciseInfo): AdminExercise {
  return { ...toExerciseSummary(ex), status: mapStatusToUI(ex.status) };
}

function anyOf<T extends number>(value: T): T[] {
  return value === 0 ? [] : [value];
}

function toWriteFields(data: AdminExerciseInput) {
  return {
    name: data.name,
    primaryMuscle: data.primaryMuscle,
    secondaryMuscles: data.secondaryMuscles,
    equipment: data.equipment,
    category: data.category,
    level: data.level,
    force: data.force,
    mechanic: data.mechanic,
    instructions: data.instructions,
    images: data.images,
    videoUrl: data.videoUrl,
    defaultRestSeconds: data.defaultRestSeconds,
    motionSlug: data.motionSlug,
    status: mapStatusToProto(data.status),
  };
}

export interface FetchExercisesParams {
  cursor?: string | null;
  limit?: number;
  filters?: Partial<ExerciseAdminFilters>;
}

export async function fetchAdminExercises({
  cursor = null,
  limit = 50,
  filters,
}: FetchExercisesParams): Promise<PaginatedResponse<AdminExercise>> {
  if (!process.env.FITAI_RPC_URL) {
    return {
      items: [],
      nextCursor: null,
      totalCount: 0,
    };
  }

  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));

  const protoStatus =
    filters?.status && filters.status !== "all"
      ? mapStatusToProto(filters.status)
      : ExerciseStatus.UNSPECIFIED;
  const includeAllStatuses = !filters?.status || filters.status === "all";

  const offset = cursor ? Math.max(0, parseInt(cursor, 10) || 0) : 0;

  const res = await client.searchExercises({
    keyword: filters?.q || "",
    primaryMuscles: anyOf(filters?.primaryMuscle ?? 0),
    equipment: anyOf(filters?.equipment ?? 0),
    categories: anyOf(filters?.category ?? 0),
    levels: anyOf(filters?.level ?? 0),
    limit,
    offset,
    status: protoStatus,
    includeAllStatuses,
  });

  const exercisesList = res.exercises.map(toAdminExercise);

  const totalCount = res.totalCount;
  const nextOffset = offset + exercisesList.length;
  const hasMore = nextOffset < totalCount && exercisesList.length > 0;
  const nextCursor = hasMore ? String(nextOffset) : null;

  return {
    items: exercisesList,
    nextCursor,
    totalCount,
  };
}

export async function fetchAdminExerciseById(id: string): Promise<AdminExercise | null> {
  if (!process.env.FITAI_RPC_URL) {
    return null;
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    const res = await client.getExercise({ id });
    const ex = res.exercise;
    if (!ex) {
      return null;
    }

    return toAdminExercise(ex);
  } catch (error) {
    console.warn("[fetchAdminExerciseById] failed:", error);
    return null;
  }
}

export async function approveExercise(id: string): Promise<AdminExercise> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[approveExercise] FITAI_RPC_URL not configured or RPC failed.");
  }
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.approveExercise({ id });
  const ex = res.exercise;
  if (!ex) {
    throw new Error(`Failed to approve exercise: ${id}`);
  }

  return toAdminExercise(ex);
}

export async function restoreExercise(id: string): Promise<AdminExercise> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[restoreExercise] FITAI_RPC_URL not configured or RPC failed.");
  }
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.restoreExercise({ id });
  const ex = res.exercise;
  if (!ex) {
    throw new Error(`Failed to restore exercise: ${id}`);
  }

  return toAdminExercise(ex);
}

export async function archiveExercise(id: string): Promise<void> {
  if (!process.env.FITAI_RPC_URL) {
    throw new Error("[archiveExercise] FITAI_RPC_URL not configured or RPC failed.");
  }
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.deleteExercise({ id });
  if (!res.success) {
    throw new Error(`Failed to archive exercise: ${id}`);
  }
}

export async function createExercise(data: AdminExerciseInput): Promise<AdminExerciseResult> {
  if (!process.env.FITAI_RPC_URL) {
    return { ok: false, message: "Exercise service is not configured." };
  }
  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    const res = await client.createExercise(toWriteFields(data));
    if (!res.exercise) {
      return { ok: false, message: "Failed to create exercise." };
    }
    return { ok: true, exercise: toAdminExercise(res.exercise) };
  } catch (error) {
    console.warn("[createExercise] failed:", error);
    return { ok: false, message: describeExerciseError(error) };
  }
}

export async function updateExercise(
  id: string,
  data: AdminExerciseInput,
): Promise<AdminExerciseResult> {
  if (!process.env.FITAI_RPC_URL) {
    return { ok: false, message: "Exercise service is not configured." };
  }
  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    const res = await client.updateExercise({ id, ...toWriteFields(data) });
    if (!res.exercise) {
      return { ok: false, message: `Failed to update exercise: ${id}` };
    }
    return { ok: true, exercise: toAdminExercise(res.exercise) };
  } catch (error) {
    console.warn(`[updateExercise] failed for id ${id}:`, error);
    return { ok: false, message: describeExerciseError(error) };
  }
}

export async function deleteExercise(id: string): Promise<boolean> {
  if (!process.env.FITAI_RPC_URL) {
    return false;
  }
  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    await client.deleteExercise({ id });
    return true;
  } catch (error) {
    console.warn(`[deleteExercise] failed for id ${id}:`, error);
    return false;
  }
}
