export type CatalogEntry = {
  id: string;
  name: string;
};

export type MuscleEntry = CatalogEntry & {
  bodyPartId: string;
};

export type CatalogMetadata = {
  bodyParts: CatalogEntry[];
  equipments: CatalogEntry[];
  muscles: MuscleEntry[];
  tags: CatalogEntry[];
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

export type ExerciseSummary = {
  id: string;
  name: string;
  bodyPartId: string;
  equipmentId: string;
  targetMuscleId: string;
  secondaryMuscleIds: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  difficulty: Difficulty;
  defaultRestSeconds: number;
  tagIds: string[];
  hasAiSupported: boolean;
  instructions?: string;
  formCues?: string[];
  commonMistakes?: string[];
};

export type ExerciseFilters = {
  q: string;
  bodyPartIds: string[];
  equipmentIds: string[];
  difficulty: Difficulty[];
  tagIds: string[];
  aiOnly: boolean;
};

export const EMPTY_FILTERS: ExerciseFilters = {
  q: "",
  bodyPartIds: [],
  equipmentIds: [],
  difficulty: [],
  tagIds: [],
  aiOnly: false,
};

export type SortMode = "relevance" | "name" | "difficulty";

export const SORT_LABEL: Record<SortMode, string> = {
  relevance: "Most relevant",
  name: "A → Z",
  difficulty: "Easier first",
};

export function countActiveFilters(filters: ExerciseFilters): number {
  return (
    filters.bodyPartIds.length +
    filters.equipmentIds.length +
    filters.difficulty.length +
    filters.tagIds.length +
    (filters.aiOnly ? 1 : 0)
  );
}

export function filterExercises(
  pool: ExerciseSummary[],
  filters: ExerciseFilters,
  catalog: CatalogMetadata,
): ExerciseSummary[] {
  const q = filters.q.trim().toLowerCase();
  const tagNameById = new Map(catalog.tags.map((tag) => [tag.id, tag.name.toLowerCase()]));
  const muscleNameById = new Map(
    catalog.muscles.map((muscle) => [muscle.id, muscle.name.toLowerCase()]),
  );
  const bodyPartNameById = new Map(
    catalog.bodyParts.map((entry) => [entry.id, entry.name.toLowerCase()]),
  );

  return pool.filter((exercise) => {
    if (q) {
      const haystack = [
        exercise.name.toLowerCase(),
        bodyPartNameById.get(exercise.bodyPartId) ?? "",
        muscleNameById.get(exercise.targetMuscleId) ?? "",
        ...exercise.secondaryMuscleIds.map((id) => muscleNameById.get(id) ?? ""),
        ...exercise.tagIds.map((id) => tagNameById.get(id) ?? ""),
      ].join(" ");
      if (!haystack.includes(q)) return false;
    }
    if (filters.bodyPartIds.length > 0 && !filters.bodyPartIds.includes(exercise.bodyPartId)) {
      return false;
    }
    if (filters.equipmentIds.length > 0 && !filters.equipmentIds.includes(exercise.equipmentId)) {
      return false;
    }
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(exercise.difficulty)) {
      return false;
    }
    if (filters.tagIds.length > 0) {
      const overlap = filters.tagIds.some((id) => exercise.tagIds.includes(id));
      if (!overlap) return false;
    }
    if (filters.aiOnly && !exercise.hasAiSupported) return false;
    return true;
  });
}

export function sortExercises(pool: ExerciseSummary[], mode: SortMode): ExerciseSummary[] {
  const sorted = [...pool];
  if (mode === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === "difficulty") {
    sorted.sort(
      (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty),
    );
  }
  return sorted;
}
