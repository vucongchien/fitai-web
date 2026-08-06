import type { DailyCalories } from "@/shared/api/bff/aggregate/nutrition-daily";

/** Icons available to the metric grid, mapped to lucide components in the UI. */
export type MetricIcon =
  | "dumbbell"
  | "flame"
  | "layers"
  | "salad"
  | "target"
  | "utensils"
  | "weight";

/**
 * One metric card. `goal` is the target line; when the wire carries no target it holds a
 * trailing comparison instead, and `goalIsTarget` says which it is.
 */
export type MetricCard = {
  goal: string;
  goalIsTarget: boolean;
  icon: MetricIcon;
  id: string;
  /** Percentage complete, present only when a real target exists. */
  percentage: number | null;
  title: string;
  value: string;
};

export type HomeOverview = {
  /** Trailing 7-day calorie trend for the overview chart. */
  calorieTrend: DailyCalories[];
  metrics: MetricCard[];
  nutritionGoalPercentage: number;
  nutritionSummary: string;
  workoutCompletionPercentage: number;
  workoutSummary: string;
};
