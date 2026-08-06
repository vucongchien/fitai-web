import type { Adherence, WeekdayCount } from "@/shared/api/bff/aggregate/workout-adherence";

export type WorkoutStatsData = {
  adherence: Adherence;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  volumeKg: number;
  /** Completed sessions per weekday across the week. */
  weekdaySeries: WeekdayCount[];
};
