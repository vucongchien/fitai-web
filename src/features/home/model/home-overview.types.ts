/**
 * The two headline readings on Home, each a percentage of a real wire target:
 * calories against `target_calories`, sessions against the week's scheduled count.
 */
export type HomeOverview = {
  nutritionGoalPercentage: number;
  nutritionSummary: string;
  workoutCompletionPercentage: number;
  workoutSummary: string;
};
