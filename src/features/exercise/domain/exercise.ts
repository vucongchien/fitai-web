export interface CatalogEntry {
  id: string;
  name: string;
}

export type MuscleEntry = CatalogEntry & {
  bodyPartId: string;
};

export interface CatalogMetadata {
  bodyParts: CatalogEntry[];
  equipments: CatalogEntry[];
  muscles: MuscleEntry[];
  tags: CatalogEntry[];
}

export const GROUP_SYNONYMS: Record<string, string[]> = {
  "arms-shoulders": ["arms", "shoulders", "upper arms", "lower arms", "biceps", "triceps", "deltoids", "forearms"],
  arms: ["arms", "upper arms", "lower arms", "biceps", "triceps", "forearms"],
  shoulders: ["shoulders", "deltoids"],

  "chest-back": ["chest", "back", "pectorals", "lats", "traps", "latissimus", "neck"],
  chest: ["chest", "pectorals"],
  back: ["back", "lats", "traps", "latissimus"],

  "legs-glutes": ["legs", "glutes", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves", "thighs"],
  legs: ["legs", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves"],

  "core-abs": ["core", "abs", "waist", "abdominals", "midsection"],
  core: ["core", "abs", "waist", "abdominals"],
  waist: ["waist", "core", "abs", "abdominals"],
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

export interface ExerciseSummary {
  id: string;
  name: string;
  bodyPartId: string;
  equipmentId: string;
  targetMuscleId: string;
  secondaryMuscleIds: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  mediaUrl?: string;
  difficulty: Difficulty;
  defaultRestSeconds: number;
  tagIds: string[];
  hasAiSupported: boolean;
  instructions?: string;
  formCues?: string[];
  commonMistakes?: string[];
  // NOT IN CONTRACT: supporting.exercise.v1.ExerciseInfo has no breathing field yet.
  // Mock-only, same status as formCues / commonMistakes. Add to the proto before wiring gRPC.
  breathingCue?: string;
}

export interface ExerciseFilters {
  q: string;
  bodyPartIds: string[];
  equipmentIds: string[];
  targetMuscleIds: string[];
  difficulty: Difficulty[];
  tagIds: string[];
  aiOnly: boolean;
}

export const EMPTY_FILTERS: ExerciseFilters = {
  q: "",
  bodyPartIds: [],
  equipmentIds: [],
  targetMuscleIds: [],
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

export function countActiveFilters(
  filters: ExerciseFilters,
  catalog?: CatalogMetadata,
): number {
  let bodyPartCount = filters.bodyPartIds.length;

  if (catalog && catalog.bodyParts && filters.bodyPartIds.length > 0) {
    const groupSynonyms: Record<string, string[]> = {
      "arms-shoulders": ["arms", "shoulders", "upper arms", "lower arms", "biceps", "triceps", "deltoids", "forearms"],
      arms: ["arms", "upper arms", "lower arms", "biceps", "triceps", "forearms"],
      shoulders: ["shoulders", "deltoids"],

      "chest-back": ["chest", "back", "pectorals", "lats", "traps", "latissimus", "neck"],
      chest: ["chest", "pectorals"],
      back: ["back", "lats", "traps", "latissimus"],

      "legs-glutes": ["legs", "glutes", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves", "thighs"],
      legs: ["legs", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves"],

      "core-abs": ["core", "abs", "waist", "abdominals", "midsection"],
      core: ["core", "abs", "waist", "abdominals"],
      waist: ["waist", "core", "abs", "abdominals"],
    };

    let matchedChips = 0;
    catalog.bodyParts.forEach((entry) => {
      const isMatched = filters.bodyPartIds.some((id) => {
        if (id === entry.id) return true;
        const idLower = id.toLowerCase();
        const eIdLower = entry.id.toLowerCase();
        const eNameLower = entry.name.toLowerCase();

        if (idLower === eIdLower || idLower === eNameLower) return true;

        const synonyms = groupSynonyms[idLower] || [idLower];
        return synonyms.some(
          (syn) =>
            eIdLower === syn ||
            eNameLower === syn ||
            eIdLower.includes(syn) ||
            syn.includes(eIdLower) ||
            eNameLower.includes(syn) ||
            syn.includes(eNameLower),
        );
      });

      if (isMatched) {
        matchedChips++;
      }
    });

    if (matchedChips > 0) {
      bodyPartCount = matchedChips;
    }
  }

  return (
    bodyPartCount +
    filters.equipmentIds.length +
    (filters.targetMuscleIds ? filters.targetMuscleIds.length : 0) +
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
      if (!haystack.includes(q)) {
        return false;
      }
    }
    if (filters.bodyPartIds.length > 0) {
      const exBp = exercise.bodyPartId.toLowerCase();
      const exBpName = (bodyPartNameById.get(exercise.bodyPartId) || "").toLowerCase();

      const matched = filters.bodyPartIds.some((id) => {
        if (exercise.bodyPartId === id) {
          return true;
        }
        const idLower = id.toLowerCase();
        if (exBp === idLower || exBpName === idLower || exBp.includes(idLower) || idLower.includes(exBp)) {
          return true;
        }

        const groupSynonyms: Record<string, string[]> = {
          "arms-shoulders": ["arms", "shoulders", "upper arms", "lower arms", "biceps", "triceps", "deltoids", "forearms"],
          arms: ["arms", "upper arms", "lower arms", "biceps", "triceps", "forearms"],
          shoulders: ["shoulders", "deltoids"],

          "chest-back": ["chest", "back", "pectorals", "lats", "traps", "latissimus", "neck"],
          chest: ["chest", "pectorals"],
          back: ["back", "lats", "traps", "latissimus"],

          "legs-glutes": ["legs", "glutes", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves", "thighs"],
          legs: ["legs", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves"],

          "core-abs": ["core", "abs", "waist", "abdominals", "midsection"],
          core: ["core", "abs", "waist", "abdominals"],
          waist: ["waist", "core", "abs", "abdominals"],
        };

        const synonyms = groupSynonyms[idLower] || [idLower];
        return synonyms.some(
          (syn) =>
            exBp === syn ||
            exBpName === syn ||
            exBp.includes(syn) ||
            syn.includes(exBp) ||
            exBpName.includes(syn) ||
            syn.includes(exBpName),
        );
      });
      if (!matched) {
        return false;
      }
    }
    if (filters.equipmentIds.length > 0 && !filters.equipmentIds.includes(exercise.equipmentId)) {
      return false;
    }
    if (filters.targetMuscleIds && filters.targetMuscleIds.length > 0) {
      const exTm = exercise.targetMuscleId.toLowerCase();
      const exTmName = (muscleNameById.get(exercise.targetMuscleId) || "").toLowerCase();

      const matchedTm = filters.targetMuscleIds.some((id) => {
        if (exercise.targetMuscleId === id) return true;
        const idLower = id.toLowerCase();
        return (
          exTm === idLower ||
          exTmName === idLower ||
          exTm.includes(idLower) ||
          idLower.includes(exTm) ||
          exTmName.includes(idLower) ||
          idLower.includes(exTmName)
        );
      });
      if (!matchedTm) {
        return false;
      }
    }
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(exercise.difficulty)) {
      return false;
    }
    if (filters.tagIds.length > 0) {
      const overlap = filters.tagIds.some((id) => exercise.tagIds.includes(id));
      if (!overlap) {
        return false;
      }
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
    sorted.sort(
      (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty),
    );
  }
  return sorted;
}
