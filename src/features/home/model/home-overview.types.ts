import type { FlowPoint } from "@/shared/ui/charts/dual-flow-chart";

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
 * One metric card: a reading and the period it covers.
 *
 * No target or progress bar. Targets belong to the overview card above, which shows them
 * once with their own bars; repeating them per card duplicated the same fact.
 */
export type MetricCard = {
  /** The period the reading covers, e.g. "Today" or "Last 7 days". */
  caption: string;
  icon: MetricIcon;
  id: string;
  title: string;
  unit?: string;
  value: string;
};

export type HomeOverview = {
  /** Nutrition and workout as percentages of each day's target, across the week. */
  weeklyFlow: FlowPoint[];
  metrics: MetricCard[];
  nutritionGoalPercentage: number;
  nutritionSummary: string;
  workoutCompletionPercentage: number;
  workoutSummary: string;
};
