"use server";

import { createClient } from "@connectrpc/connect";

import type {
  AdminExercise,
  AdminExerciseStatus,
  ExerciseAdminFilters,
  MetadataItem,
  PaginatedResponse,
} from "@/features/admin/domain/admin-types";
import { ExerciseStatus } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

function mapDifficulty(diff?: string): "beginner" | "intermediate" | "advanced" {
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

function mapStatusToProto(status?: AdminExerciseStatus): ExerciseStatus {
  switch (status) {
    case "created": {
      return ExerciseStatus.DRAFT;
    }
    case "submittedForApproval": {
      return ExerciseStatus.PENDING_APPROVAL;
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
    case ExerciseStatus.PENDING_APPROVAL: {
      return "submittedForApproval";
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

export interface FetchExercisesParams {
  cursor?: string | null;
  limit?: number;
  filters?: Partial<ExerciseAdminFilters>;
}

export async function fetchAdminExercises({
  cursor = null,
  limit = 10,
  filters,
}: FetchExercisesParams): Promise<PaginatedResponse<AdminExercise>> {
  if (!process.env.FITAI_RPC_URL) {
    return { items: [], nextCursor: null, totalCount: 0 };
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));

    const keyword = filters?.q || "";
    const bodyPartId = filters?.bodyPartId || "";
    const equipmentId = filters?.equipmentId || "";
    const difficulty = filters?.difficulty && filters.difficulty !== "all" ? filters.difficulty : "";

    const res = await client.searchExercises({
      keyword,
      bodyPartId,
      equipmentId,
      difficulty,
      limit: 100, // Lấy tập kết quả lớn để thực hiện filter status
    });

    let exercises = (res.exercises || []).map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPartId: ex.bodyPartId,
      equipmentId: ex.equipmentId,
      targetMuscleId: ex.targetMuscleId,
      secondaryMuscleIds: ex.secondaryMuscleIds || [],
      tagIds: ex.tagIds || [],
      instructions: ex.instructions || "",
      videoUrl: ex.videoUrl || "",
      thumbnailUrl: ex.thumbnailUrl || "",
      difficulty: mapDifficulty(ex.difficulty),
      defaultRestSeconds: ex.defaultRestSeconds || 90,
      hasAiSupported: Boolean(ex.hasAiSupported),
      status: mapStatusToUI(ex.status),
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (filters?.status && filters.status !== "all") {
      exercises = exercises.filter((ex) => ex.status === filters.status);
    }

    const totalCount = exercises.length;
    let startIndex = 0;
    if (cursor) {
      const foundIndex = exercises.findIndex((item) => item.id === cursor);
      if (foundIndex !== -1) {
        startIndex = foundIndex + 1;
      }
    }

    const paginatedItems = exercises.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < exercises.length;
    const nextCursor = hasMore && paginatedItems.length > 0 ? (paginatedItems.at(-1)?.id ?? null) : null;

    return {
      items: paginatedItems,
      nextCursor,
      totalCount,
    };
  } catch (error) {
    console.warn("[fetchAdminExercises] failed:", error);
    return { items: [], nextCursor: null, totalCount: 0 };
  }
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

    return {
      id: ex.id,
      name: ex.name,
      bodyPartId: ex.bodyPartId,
      equipmentId: ex.equipmentId,
      targetMuscleId: ex.targetMuscleId,
      secondaryMuscleIds: ex.secondaryMuscleIds || [],
      tagIds: ex.tagIds || [],
      instructions: ex.instructions || "",
      videoUrl: ex.videoUrl || "",
      thumbnailUrl: ex.thumbnailUrl || "",
      difficulty: mapDifficulty(ex.difficulty),
      defaultRestSeconds: ex.defaultRestSeconds || 90,
      hasAiSupported: Boolean(ex.hasAiSupported),
      status: mapStatusToUI(ex.status),
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[fetchAdminExerciseById] failed:", error);
    return null;
  }
}

export async function approveExercise(id: string): Promise<AdminExercise> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.approveExercise({ id });
  const ex = res.exercise;
  if (!ex) {
    throw new Error(`Failed to approve exercise: ${id}`);
  }

  return {
    id: ex.id,
    name: ex.name,
    bodyPartId: ex.bodyPartId,
    equipmentId: ex.equipmentId,
    targetMuscleId: ex.targetMuscleId,
    secondaryMuscleIds: ex.secondaryMuscleIds || [],
    tagIds: ex.tagIds || [],
    instructions: ex.instructions || "",
    videoUrl: ex.videoUrl || "",
    thumbnailUrl: ex.thumbnailUrl || "",
    difficulty: mapDifficulty(ex.difficulty),
    defaultRestSeconds: ex.defaultRestSeconds || 90,
    hasAiSupported: Boolean(ex.hasAiSupported),
    status: mapStatusToUI(ex.status),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function archiveExercise(id: string): Promise<AdminExercise> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.updateExercise({
    id,
    status: mapStatusToProto("archived"),
  });
  const ex = res.exercise;
  if (!ex) {
    throw new Error(`Failed to archive exercise: ${id}`);
  }

  return {
    id: ex.id,
    name: ex.name,
    bodyPartId: ex.bodyPartId,
    equipmentId: ex.equipmentId,
    targetMuscleId: ex.targetMuscleId,
    secondaryMuscleIds: ex.secondaryMuscleIds || [],
    tagIds: ex.tagIds || [],
    instructions: ex.instructions || "",
    videoUrl: ex.videoUrl || "",
    thumbnailUrl: ex.thumbnailUrl || "",
    difficulty: mapDifficulty(ex.difficulty),
    defaultRestSeconds: ex.defaultRestSeconds || 90,
    hasAiSupported: Boolean(ex.hasAiSupported),
    status: mapStatusToUI(ex.status),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function createExercise(
  data: Omit<AdminExercise, "id" | "createdAt" | "updatedAt">,
): Promise<AdminExercise> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.createExercise({
    name: data.name,
    bodyPartId: data.bodyPartId,
    equipmentId: data.equipmentId,
    targetMuscleId: data.targetMuscleId,
    secondaryMuscleIds: data.secondaryMuscleIds,
    tagIds: data.tagIds,
    instructions: data.instructions,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    difficulty: data.difficulty,
    defaultRestSeconds: data.defaultRestSeconds,
  });

  const ex = res.exercise;
  if (!ex) {
    throw new Error("Failed to create exercise.");
  }

  return {
    id: ex.id,
    name: ex.name,
    bodyPartId: ex.bodyPartId,
    equipmentId: ex.equipmentId,
    targetMuscleId: ex.targetMuscleId,
    secondaryMuscleIds: ex.secondaryMuscleIds || [],
    tagIds: ex.tagIds || [],
    instructions: ex.instructions || "",
    videoUrl: ex.videoUrl || "",
    thumbnailUrl: ex.thumbnailUrl || "",
    difficulty: mapDifficulty(ex.difficulty),
    defaultRestSeconds: ex.defaultRestSeconds || 90,
    hasAiSupported: Boolean(ex.hasAiSupported),
    status: mapStatusToUI(ex.status),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateExercise(
  id: string,
  data: Partial<AdminExercise>,
): Promise<AdminExercise> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));
  const res = await client.updateExercise({
    id,
    name: data.name,
    bodyPartId: data.bodyPartId,
    equipmentId: data.equipmentId,
    targetMuscleId: data.targetMuscleId,
    secondaryMuscleIds: data.secondaryMuscleIds,
    tagIds: data.tagIds,
    instructions: data.instructions,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    difficulty: data.difficulty,
    defaultRestSeconds: data.defaultRestSeconds,
    status: data.status ? mapStatusToProto(data.status) : undefined,
  });

  const ex = res.exercise;
  if (!ex) {
    throw new Error(`Failed to update exercise: ${id}`);
  }

  return {
    id: ex.id,
    name: ex.name,
    bodyPartId: ex.bodyPartId,
    equipmentId: ex.equipmentId,
    targetMuscleId: ex.targetMuscleId,
    secondaryMuscleIds: ex.secondaryMuscleIds || [],
    tagIds: ex.tagIds || [],
    instructions: ex.instructions || "",
    videoUrl: ex.videoUrl || "",
    thumbnailUrl: ex.thumbnailUrl || "",
    difficulty: mapDifficulty(ex.difficulty),
    defaultRestSeconds: ex.defaultRestSeconds || 90,
    hasAiSupported: Boolean(ex.hasAiSupported),
    status: mapStatusToUI(ex.status),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteExercise(id: string): Promise<boolean> {
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

// METADATA APIS (BodyParts, Equipments, Muscles, Tags)
export async function fetchMetadataList(
  category?: MetadataItem["category"],
): Promise<MetadataItem[]> {
  if (!process.env.FITAI_RPC_URL) {
    return [];
  }

  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    const res = await client.getCatalogMetadata({});

    const bodyParts = res.bodyParts.map((bp) => ({
      id: bp.id,
      name: bp.name,
      category: "bodyPart" as const,
    }));
    const equipments = res.equipments.map((eq) => ({
      id: eq.id,
      name: eq.name,
      category: "equipment" as const,
    }));
    const muscles = res.muscles.map((ms) => ({
      id: ms.id,
      name: ms.name,
      category: "muscle" as const,
    }));
    const tags = res.tags.map((tg) => ({
      id: tg.id,
      name: tg.name,
      category: "tag" as const,
    }));

    const allItems = [...bodyParts, ...equipments, ...muscles, ...tags];

    if (!category) {
      return allItems;
    }
    return allItems.filter((item) => item.category === category);
  } catch (error) {
    console.warn("[fetchMetadataList] failed:", error);
    return [];
  }
}

export async function createMetadataItem(item: Omit<MetadataItem, "id">): Promise<MetadataItem> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));

  if (item.category === "bodyPart") {
    const res = await client.createBodyPart({ name: item.name });
    return { id: res.bodyPart?.id || "", name: res.bodyPart?.name || "", category: "bodyPart" };
  } else if (item.category === "equipment") {
    const res = await client.createEquipment({ name: item.name });
    return { id: res.equipment?.id || "", name: res.equipment?.name || "", category: "equipment" };
  } else if (item.category === "muscle") {
    const res = await client.createMuscle({ name: item.name, bodyPartId: "" });
    return { id: res.muscle?.id || "", name: res.muscle?.name || "", category: "muscle" };
  }
    const res = await client.createTag({ name: item.name });
    return { id: res.tag?.id || "", name: res.tag?.name || "", category: "tag" };
  
}

export async function updateMetadataItem(
  id: string,
  data: Partial<MetadataItem>,
): Promise<MetadataItem> {
  const { accessToken } = await getAuthenticatedSession();
  const client = createClient(ExerciseService, createServerTransport(accessToken));

  if (data.category === "bodyPart") {
    const res = await client.updateBodyPart({ id, name: data.name });
    return { id: res.bodyPart?.id || "", name: res.bodyPart?.name || "", category: "bodyPart" };
  } else if (data.category === "equipment") {
    const res = await client.updateEquipment({ id, name: data.name });
    return { id: res.equipment?.id || "", name: res.equipment?.name || "", category: "equipment" };
  } else if (data.category === "muscle") {
    const res = await client.updateMuscle({ id, name: data.name, bodyPartId: "" });
    return { id: res.muscle?.id || "", name: res.muscle?.name || "", category: "muscle" };
  }
    const res = await client.updateTag({ id, name: data.name });
    return { id: res.tag?.id || "", name: res.tag?.name || "", category: "tag" };
  
}

export async function deleteMetadataItem(id: string): Promise<boolean> {
  try {
    const { accessToken } = await getAuthenticatedSession();
    const client = createClient(ExerciseService, createServerTransport(accessToken));
    // Tạm thời coi ID quyết định category hoặc gọi tuần tự do không có category trong params
    // Thường ID có tiền tố bp-, eq-, ms-, tg-
    if (id.startsWith("bp")) {
      await client.deleteBodyPart({ id });
    } else if (id.startsWith("eq")) {
      await client.deleteEquipment({ id });
    } else if (id.startsWith("ms")) {
      await client.deleteMuscle({ id });
    } else {
      await client.deleteTag({ id });
    }
    return true;
  } catch (error) {
    console.warn(`[deleteMetadataItem] failed for id ${id}:`, error);
    return false;
  }
}

export async function resetExerciseStore(): Promise<void> {
  // Bỏ logic mock reset vì đã gọi gRPC
}
