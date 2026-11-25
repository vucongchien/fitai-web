import type { ExerciseInfo } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import { Equipment } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import type {
  ExerciseCategory,
  ExerciseLevel,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import {
  CATEGORY_OPTIONS,
  categoryCode,
  categoryLabel,
  EQUIPMENT_OPTIONS,
  equipmentCode,
  equipmentLabel,
  LEVEL_OPTIONS,
  levelCode,
  levelLabel,
  MUSCLE_GROUP_OPTIONS,
  muscleGroupCode,
  muscleGroupLabel,
  parseCategoryCode,
  parseEquipmentCode,
  parseLevelCode,
  parseMuscleGroupCode,
} from "@/shared/lib/taxonomy";

/** Plain view of `ExerciseInfo` that crosses the RSC boundary. */
export type ExerciseSummary = Pick<
  ExerciseInfo,
  | "id"
  | "name"
  | "slug"
  | "primaryMuscle"
  | "secondaryMuscles"
  | "equipment"
  | "category"
  | "level"
  | "force"
  | "mechanic"
  | "instructions"
  | "images"
  | "videoUrl"
  | "defaultRestSeconds"
  | "hasAiSupported"
  | "motionSlug"
>;

export function toExerciseSummary(ex: ExerciseInfo): ExerciseSummary {
  return {
    id: ex.id,
    name: ex.name,
    slug: ex.slug,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: [...ex.secondaryMuscles],
    equipment: ex.equipment,
    category: ex.category,
    level: ex.level,
    force: ex.force,
    mechanic: ex.mechanic,
    instructions: [...ex.instructions],
    images: [...ex.images],
    videoUrl: ex.videoUrl,
    defaultRestSeconds: ex.defaultRestSeconds || 90,
    hasAiSupported: ex.hasAiSupported,
    motionSlug: ex.motionSlug,
  };
}

/** Spec §8.3: only BODY_ONLY is bodyweight; UNSPECIFIED means the exercise is unknown. */
export function isWeightedEquipment(equipment: Equipment): boolean {
  return equipment !== Equipment.UNSPECIFIED && equipment !== Equipment.BODY_ONLY;
}

/** "Quadriceps · Barbell · Beginner" style meta line. */
export function exerciseMetaLine(exercise: ExerciseSummary): string {
  return [
    muscleGroupLabel(exercise.primaryMuscle),
    equipmentLabel(exercise.equipment),
    levelLabel(exercise.level),
  ]
    .filter(Boolean)
    .join(" · ");
}

export interface ExerciseFilters {
  q: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  categories: ExerciseCategory[];
  levels: ExerciseLevel[];
  aiOnly: boolean;
}

export const EMPTY_FILTERS: ExerciseFilters = {
  q: "",
  muscles: [],
  equipment: [],
  categories: [],
  levels: [],
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
    filters.muscles.length +
    filters.equipment.length +
    filters.categories.length +
    filters.levels.length +
    (filters.aiOnly ? 1 : 0)
  );
}

export function filterExercises(
  pool: ExerciseSummary[],
  filters: ExerciseFilters,
): ExerciseSummary[] {
  const q = filters.q.trim().toLowerCase();

  return pool.filter((exercise) => {
    if (q) {
      const haystack = [
        exercise.name,
        muscleGroupLabel(exercise.primaryMuscle),
        ...exercise.secondaryMuscles.map((muscle) => muscleGroupLabel(muscle)),
        equipmentLabel(exercise.equipment),
        categoryLabel(exercise.category),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    if (filters.muscles.length > 0 && !filters.muscles.includes(exercise.primaryMuscle)) {
      return false;
    }
    if (filters.equipment.length > 0 && !filters.equipment.includes(exercise.equipment)) {
      return false;
    }
    if (filters.categories.length > 0 && !filters.categories.includes(exercise.category)) {
      return false;
    }
    if (filters.levels.length > 0 && !filters.levels.includes(exercise.level)) {
      return false;
    }
    if (filters.aiOnly && !exercise.hasAiSupported) {
      return false;
    }
    return true;
  });
}

export function sortExercises(pool: ExerciseSummary[], mode: SortMode): ExerciseSummary[] {
  const sorted = [...pool];
  if (mode === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === "difficulty") {
    sorted.sort((a, b) => a.level - b.level);
  }
  return sorted;
}

function parseList<T>(raw: string[], parse: (code: string) => T | null): T[] {
  return [...new Set(raw.map(parse).filter((value): value is T => value !== null))];
}

type ParamReader = Pick<URLSearchParams, "get" | "getAll">;

/** URL params use short codes, e.g. `muscle=CHEST&equipment=BARBELL&ai=1`. */
export function parseFilterParams(params: ParamReader): ExerciseFilters {
  return {
    q: params.get("q") || params.get("query") || "",
    muscles: parseList(params.getAll("muscle"), parseMuscleGroupCode),
    equipment: parseList(params.getAll("equipment"), parseEquipmentCode),
    categories: parseList(params.getAll("category"), parseCategoryCode),
    levels: parseList(params.getAll("level"), parseLevelCode),
    aiOnly: params.get("ai") === "1",
  };
}

export function toFilterSearchString(filters: ExerciseFilters): string {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  for (const muscle of filters.muscles) {
    params.append("muscle", muscleGroupCode(muscle));
  }
  for (const equipment of filters.equipment) {
    params.append("equipment", equipmentCode(equipment));
  }
  for (const category of filters.categories) {
    params.append("category", categoryCode(category));
  }
  for (const level of filters.levels) {
    params.append("level", levelCode(level));
  }
  if (filters.aiOnly) {
    params.set("ai", "1");
  }
  return params.toString();
}

export const FILTER_FACETS = {
  muscles: { label: "Target muscle", options: MUSCLE_GROUP_OPTIONS },
  equipment: { label: "Equipment", options: EQUIPMENT_OPTIONS },
  categories: { label: "Category", options: CATEGORY_OPTIONS },
  levels: { label: "Level", options: LEVEL_OPTIONS },
} as const;

export type FilterFacet = keyof typeof FILTER_FACETS;
