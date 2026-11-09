// Normalizes motion specification asset URLs and canonical exercise slugs

export const CANONICAL_EXERCISE_SLUGS = [
  "push_up",
  "squat",
  "plank",
  "lunge",
  "bicep_curl",
  "shoulder_press",
  "bench_press",
  "deadlift",
  "pull_up",
  "sit_up",
  "triceps_dip",
  "lateral_raise",
] as const;

export type CanonicalExerciseSlug = (typeof CANONICAL_EXERCISE_SLUGS)[number];

const CANONICAL_SLUG_SET = new Set<string>(CANONICAL_EXERCISE_SLUGS);

const EXERCISE_NAME_TO_SLUG: Record<string, CanonicalExerciseSlug> = {
  "3/4 sit-up": "sit_up",
  "barbell / bodyweight squat": "squat",
  "barbell bench press": "bench_press",
  "barbell deadlift": "deadlift",
  "barbell full squat": "squat",
  "barbell lunge": "lunge",
  "bench press": "bench_press",
  "bicep curl": "bicep_curl",
  "biceps curl": "bicep_curl",
  "cable shoulder press": "shoulder_press",
  deadlift: "deadlift",
  "dumbbell bicep curl": "bicep_curl",
  "dumbbell biceps curl": "bicep_curl",
  "dumbbell lateral raise": "lateral_raise",
  "dumbbell lunge": "lunge",
  "dumbbell seated shoulder press": "shoulder_press",
  "forearm plank": "plank",
  "forward lunge": "lunge",
  "front plank": "plank",
  "front plank with twist": "plank",
  "lateral raise": "lateral_raise",
  lunge: "lunge",
  "overhead shoulder press": "shoulder_press",
  plank: "plank",
  "pull up": "pull_up",
  "pull-up": "pull_up",
  pullup: "pull_up",
  "push up": "push_up",
  "push-up": "push_up",
  pushup: "push_up",
  "romanian deadlift": "deadlift",
  "shoulder press": "shoulder_press",
  "sit up": "sit_up",
  "sit-up": "sit_up",
  situp: "sit_up",
  squat: "squat",
  "tricep dip": "triceps_dip",
  "tricep dips": "triceps_dip",
  "triceps dip": "triceps_dip",
  "triceps dips": "triceps_dip",
  "weighted front plank": "plank",
  "weighted squat": "squat",
};

function extractSlugFromAssetPath(rawUrl?: string | null): string | null {
  if (!rawUrl) {
    return null;
  }
  const clean = rawUrl.trim().split("?")[0] ?? "";
  const match = clean.match(/\/?([^/]+?)(?:_rule|_dialogue)?\.json$/i);
  if (!match?.[1]) {
    return null;
  }
  const candidate = match[1].toLowerCase().replace(/-/g, "_");
  if (CANONICAL_SLUG_SET.has(candidate)) {
    return candidate;
  }
  return null;
}

export function resolveCanonicalExerciseSlug(
  exerciseId?: string | null,
  exerciseName?: string | null,
  assetUrl?: string | null,
): string {
  const fromUrl = extractSlugFromAssetPath(assetUrl);
  if (fromUrl) {
    return fromUrl;
  }

  for (const raw of [exerciseName, exerciseId]) {
    if (!raw) {
      continue;
    }
    const lower = raw.trim().toLowerCase();
    const withoutPrefix = lower.replace(/^ex[-_]/, "");
    const underscored = withoutPrefix.replace(/[\s-]+/g, "_");
    if (CANONICAL_SLUG_SET.has(underscored)) {
      return underscored;
    }
    const spaced = withoutPrefix.replace(/_/g, " ");
    const mapped = EXERCISE_NAME_TO_SLUG[lower] ?? EXERCISE_NAME_TO_SLUG[spaced];
    if (mapped) {
      return mapped;
    }
    for (const [alias, slug] of Object.entries(EXERCISE_NAME_TO_SLUG)) {
      if (spaced.includes(alias)) {
        return slug;
      }
    }
  }

  const fallback = (exerciseId || exerciseName || "unknown").trim();
  return fallback;
}

export function resolveRulesAssetUrl(
  rawUrl?: string | null,
  exerciseId?: string | null,
  exerciseName?: string | null,
): string {
  const trimmed = (rawUrl ?? "").trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const slug = resolveCanonicalExerciseSlug(exerciseId, exerciseName, trimmed);
  if (CANONICAL_SLUG_SET.has(slug)) {
    return `/models/rules/${slug}_rule.json`;
  }
  if (trimmed.startsWith("/models/rules/") && trimmed.endsWith("_rule.json")) {
    return trimmed;
  }
  const baseName = slug.replace(/_rule$/i, "");
  return `/models/rules/${baseName}_rule.json`;
}

export function resolveDialogueAssetUrl(
  rawUrl?: string | null,
  exerciseId?: string | null,
  exerciseName?: string | null,
): string {
  const trimmed = (rawUrl ?? "").trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const slug = resolveCanonicalExerciseSlug(exerciseId, exerciseName, trimmed);
  if (CANONICAL_SLUG_SET.has(slug)) {
    return `/models/dialogue/${slug}_dialogue.json`;
  }
  if (trimmed.startsWith("/models/dialogue/") && trimmed.endsWith("_dialogue.json")) {
    return trimmed;
  }
  const baseName = slug.replace(/_dialogue$/i, "");
  return `/models/dialogue/${baseName}_dialogue.json`;
}

export function isTimedExerciseSlug(
  exerciseId?: string | null,
  exerciseName?: string | null,
  rulesUrl?: string | null,
): boolean {
  const slug = resolveCanonicalExerciseSlug(exerciseId, exerciseName, rulesUrl).toLowerCase();
  return (
    slug === "plank" || slug.includes("plank") || slug.includes("hold") || slug.includes("wall_sit")
  );
}
