export interface WorkoutPreset {
  id: string;
  icon: "dumbbell" | "zap" | "flame" | "timer";
  title: string;
  subtitle: string;
  prompt: string;
  defaultDuration: number;
}

export interface ModifierChip {
  id: string;
  label: string;
  promptFragment: string;
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: "push",
    icon: "dumbbell",
    title: "Push Day",
    subtitle: "Chest, delts & triceps",
    prompt: "Chest, front delts, and triceps hypertrophy focus",
    defaultDuration: 45,
  },
  {
    id: "pull",
    icon: "zap",
    title: "Pull & Core",
    subtitle: "Back, biceps & abs",
    prompt: "Back, biceps, and core strength session",
    defaultDuration: 45,
  },
  {
    id: "legs",
    icon: "flame",
    title: "Leg Day",
    subtitle: "Quads, hamstrings & calves",
    prompt: "Lower body hypertrophy targeting quads, hamstrings, and calves",
    defaultDuration: 50,
  },
  {
    id: "express",
    icon: "timer",
    title: "Full Body",
    subtitle: "High-efficiency compounds",
    prompt: "Full body compound movements for maximum efficiency",
    defaultDuration: 30,
  },
];

export const MODIFIER_CHIPS: ModifierChip[] = [
  { id: "dumbbells", label: "Dumbbells only", promptFragment: "using dumbbells only" },
  { id: "bodyweight", label: "Bodyweight", promptFragment: "bodyweight only, no equipment" },
  {
    id: "joint-friendly",
    label: "Joint-friendly",
    promptFragment: "joint-friendly, avoid overhead strain",
  },
  { id: "low-impact", label: "No jumping", promptFragment: "low impact, no jumping" },
  {
    id: "core-finisher",
    label: "+ Core finisher",
    promptFragment: "include a short core finisher",
  },
];

export const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;

export function buildFinalPrompt(promptText: string, selectedModifierIds: string[]): string {
  const base = promptText.trim() || "Balanced full body workout";
  if (selectedModifierIds.length === 0) {
    return base;
  }
  const fragments = MODIFIER_CHIPS.filter((chip) => selectedModifierIds.includes(chip.id)).map(
    (chip) => chip.promptFragment,
  );
  return fragments.length > 0 ? `${base} (${fragments.join(", ")})` : base;
}
