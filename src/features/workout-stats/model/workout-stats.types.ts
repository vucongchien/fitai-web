import type { Adherence } from "@/shared/api/bff/aggregate/workout-adherence";

export type WorkoutStatsData = {
  adherence: Adherence;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  volumeKg: number;
  /**
   * Training volume per week, oldest first — whether the load is going up.
   * `volumeKg` is null for a week with no logged session.
   */
  volumeTrend: { label: string; volumeKg: number | null }[];
};
