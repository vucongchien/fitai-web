import type {
  AdminExercise,
  AdminExerciseStatus,
  ExerciseAdminFilters,
  MetadataItem,
  PaginatedResponse,
} from "@/features/admin/domain/admin-types";
import { MOCK_CATALOG } from "@/shared/mock/catalog";
import { MOCK_EXERCISES } from "@/shared/mock/exercises";

const INITIAL_ADMIN_EXERCISES: AdminExercise[] = MOCK_EXERCISES.map((ex, index) => {
  let status: AdminExerciseStatus = "approved";
  if (index % 4 === 0) {
    status = "submittedForApproval";
  } else if (index % 5 === 0) {
    status = "created";
  } else if (index % 9 === 0) {
    status = "archived";
  }

  return {
    ...ex,
    status,
    createdBy: index % 2 === 0 ? "admin@fitai.com" : "coach.alex@fitai.com",
    createdAt: new Date(Date.now() - index * 86_400_000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  };
});

let exerciseStore: AdminExercise[] = [...INITIAL_ADMIN_EXERCISES];

let metadataStore: MetadataItem[] = [
  ...MOCK_CATALOG.bodyParts.map((bp) => ({
    id: bp.id,
    name: bp.name,
    category: "bodyPart" as const,
  })),
  ...MOCK_CATALOG.equipments.map((eq) => ({
    id: eq.id,
    name: eq.name,
    category: "equipment" as const,
  })),
  ...MOCK_CATALOG.muscles.map((ms) => ({
    id: ms.id,
    name: ms.name,
    category: "muscle" as const,
  })),
  ...MOCK_CATALOG.tags.map((tg) => ({
    id: tg.id,
    name: tg.name,
    category: "tag" as const,
  })),
];

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
  await new Promise((resolve) => setTimeout(resolve, 30));

  let result = [...exerciseStore];

  if (filters) {
    if (filters.q && filters.q.trim() !== "") {
      const q = filters.q.trim().toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.instructions?.toLowerCase().includes(q) ||
          ex.id.toLowerCase().includes(q),
      );
    }

    if (filters.status && filters.status !== "all") {
      result = result.filter((ex) => ex.status === filters.status);
    }

    if (filters.bodyPartId && filters.bodyPartId !== "") {
      result = result.filter((ex) => ex.bodyPartId === filters.bodyPartId);
    }

    if (filters.equipmentId && filters.equipmentId !== "") {
      result = result.filter((ex) => ex.equipmentId === filters.equipmentId);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      result = result.filter((ex) => ex.difficulty === filters.difficulty);
    }
  }

  const totalCount = result.length;

  let startIndex = 0;
  if (cursor) {
    const foundIndex = result.findIndex((item) => item.id === cursor);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const paginatedItems = result.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < result.length;
  const nextCursor =
    hasMore && paginatedItems.length > 0 ? (paginatedItems.at(-1)?.id ?? null) : null;

  return {
    items: paginatedItems,
    nextCursor,
    totalCount,
  };
}

export async function fetchAdminExerciseById(id: string): Promise<AdminExercise | null> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  const found = exerciseStore.find((ex) => ex.id === id);
  return found ? { ...found } : null;
}

export async function approveExercise(id: string): Promise<AdminExercise> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const index = exerciseStore.findIndex((ex) => ex.id === id);
  if (index === -1) {
    throw new Error(`Exercise with id ${id} not found`);
  }
  const updated: AdminExercise = {
    ...exerciseStore[index],
    status: "approved",
    updatedAt: new Date().toISOString(),
  };
  exerciseStore[index] = updated;
  return updated;
}

export async function archiveExercise(id: string): Promise<AdminExercise> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const index = exerciseStore.findIndex((ex) => ex.id === id);
  if (index === -1) {
    throw new Error(`Exercise with id ${id} not found`);
  }
  const updated: AdminExercise = {
    ...exerciseStore[index],
    status: "archived",
    updatedAt: new Date().toISOString(),
  };
  exerciseStore[index] = updated;
  return updated;
}

export async function createExercise(
  data: Omit<AdminExercise, "id" | "createdAt" | "updatedAt">,
): Promise<AdminExercise> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const newId = `ex-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const created: AdminExercise = {
    ...data,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  exerciseStore.unshift(created);
  return created;
}

export async function updateExercise(
  id: string,
  data: Partial<AdminExercise>,
): Promise<AdminExercise> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const index = exerciseStore.findIndex((ex) => ex.id === id);
  if (index === -1) {
    throw new Error(`Exercise with id ${id} not found`);
  }
  const updated: AdminExercise = {
    ...exerciseStore[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  exerciseStore[index] = updated;
  return updated;
}

export async function deleteExercise(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const initialLen = exerciseStore.length;
  exerciseStore = exerciseStore.filter((ex) => ex.id !== id);
  return exerciseStore.length < initialLen;
}

// METADATA APIS (BodyParts, Equipments, Muscles, Tags)
export async function fetchMetadataList(
  category?: MetadataItem["category"],
): Promise<MetadataItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (!category) {
    return [...metadataStore];
  }
  return metadataStore.filter((item) => item.category === category);
}

export async function createMetadataItem(item: Omit<MetadataItem, "id">): Promise<MetadataItem> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const prefix = item.category.slice(0, 2);
  const newId = `${prefix}-${Date.now().toString(36)}`;
  const created: MetadataItem = {
    ...item,
    id: newId,
  };
  metadataStore.push(created);
  return created;
}

export async function updateMetadataItem(
  id: string,
  data: Partial<MetadataItem>,
): Promise<MetadataItem> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const index = metadataStore.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Metadata item ${id} not found`);
  }
  const updated = { ...metadataStore[index], ...data };
  metadataStore[index] = updated;
  return updated;
}

export async function deleteMetadataItem(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const initialLen = metadataStore.length;
  metadataStore = metadataStore.filter((m) => m.id !== id);
  return metadataStore.length < initialLen;
}

export function resetExerciseStore(): void {
  exerciseStore = [...INITIAL_ADMIN_EXERCISES];
}
