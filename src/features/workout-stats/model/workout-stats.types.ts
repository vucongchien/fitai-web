import type { Adherence, WeekdayCount } from "@/shared/api/bff/aggregate/workout-adherence";

export type WorkoutStatsData = {
  /** Days with at least one completed session. */
  activeDays: number;
  adherence: Adherence;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  totalSets: number;
  volumeKg: number;
  /** Completed sessions per weekday across the week. */
  weekdaySeries: WeekdayCount[];
  weeklyAverageProtein: number | null;
  weeklyMealsLogged: number;
  /** Days logged out of seven — a plain count, never a weighted score. */
  weeklyNutritionAdherence: Adherence;
};
