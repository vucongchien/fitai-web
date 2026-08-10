"use server";

import { createClient } from "@connectrpc/connect";

import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

export interface CatalogEquipmentItem {
  id: string;
  name: string;
}

export interface CatalogMuscleItem {
  id: string;
  name: string;
  bodyPartId?: string;
}

export interface CatalogBodyPartItem {
  id: string;
  name: string;
}

export interface CatalogMetadataResult {
  success: boolean;
  equipments: CatalogEquipmentItem[];
  muscles: CatalogMuscleItem[];
  bodyParts: CatalogBodyPartItem[];
  message?: string;
}

// Fallback tiêu chuẩn nếu backend gRPC chưa khởi tạo catalog DB hoặc offline
const FALLBACK_EQUIPMENTS: CatalogEquipmentItem[] = [
  { id: "FULL_GYM", name: "Full Gym" },
  { id: "DUMBBELL_ONLY", name: "Dumbbells" },
  { id: "BARBELL", name: "Barbell" },
  { id: "BODYWEIGHT", name: "Bodyweight" },
  { id: "RESISTANCE_BAND", name: "Resistance Band" },
  { id: "KETTLEBELL", name: "Kettlebell" },
  { id: "MACHINE", name: "Machine" },
];

const FALLBACK_MUSCLES: CatalogMuscleItem[] = [
  { id: "CHEST", name: "Chest", bodyPartId: "UPPER_BODY" },
  { id: "BACK", name: "Back", bodyPartId: "UPPER_BODY" },
  { id: "LEGS", name: "Legs", bodyPartId: "LOWER_BODY" },
  { id: "SHOULDERS", name: "Shoulders", bodyPartId: "UPPER_BODY" },
  { id: "ARMS", name: "Arms", bodyPartId: "UPPER_BODY" },
  { id: "CORE", name: "Core", bodyPartId: "CORE" },
  { id: "GLUTES", name: "Glutes", bodyPartId: "LOWER_BODY" },
  { id: "FULL_BODY", name: "Full Body", bodyPartId: "FULL_BODY" },
];

const FALLBACK_BODY_PARTS: CatalogBodyPartItem[] = [
  { id: "UPPER_BODY", name: "Upper Body" },
  { id: "LOWER_BODY", name: "Lower Body" },
  { id: "CORE", name: "Core" },
  { id: "FULL_BODY", name: "Full Body" },
];

/**
 * Server Action gọi gRPC ExerciseService.GetCatalogMetadata
 * Lấy toàn bộ danh mục metadata thật (BodyParts, Equipments, Muscles) từ DB Backend
 */
export async function getCatalogMetadataServerAction(): Promise<CatalogMetadataResult> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ExerciseService, transport);

    const res = await client.getCatalogMetadata({});

    const equipments: CatalogEquipmentItem[] =
      res.equipments && res.equipments.length > 0
        ? res.equipments.map((e) => ({ id: e.id || e.name, name: e.name || e.id }))
        : FALLBACK_EQUIPMENTS;

    const muscles: CatalogMuscleItem[] =
      res.muscles && res.muscles.length > 0
        ? res.muscles.map((m) => ({
            id: m.id || m.name,
            name: m.name || m.id,
            bodyPartId: m.bodyPartId,
          }))
        : FALLBACK_MUSCLES;

    const bodyParts: CatalogBodyPartItem[] =
      res.bodyParts && res.bodyParts.length > 0
        ? res.bodyParts.map((b) => ({ id: b.id || b.name, name: b.name || b.id }))
        : FALLBACK_BODY_PARTS;

    return {
      success: true,
      equipments,
      muscles,
      bodyParts,
    };
  } catch (error: any) {
    console.warn(
      "[getCatalogMetadataServerAction] gRPC call failed, using catalog fallback:",
      error?.message || error,
    );
    return {
      success: true,
      equipments: FALLBACK_EQUIPMENTS,
      muscles: FALLBACK_MUSCLES,
      bodyParts: FALLBACK_BODY_PARTS,
      message: error?.message || "Using catalog fallback",
    };
  }
}

/**
 * Server Action gọi gRPC ExerciseService.SearchExercises thông qua searchRepository
 */
export async function searchExercisesServerAction(
  filters: import("@/features/exercise/domain/exercise").ExerciseFilters,
): Promise<import("@/features/exercise/domain/exercise").ExerciseSummary[]> {
  const { exerciseSearchRepository } = await import("@/features/exercise/api/search-repository");
  return exerciseSearchRepository.search(filters);
}

