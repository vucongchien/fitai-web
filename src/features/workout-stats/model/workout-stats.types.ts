import type { Adherence } from "@/shared/api/bff/aggregate/workout-adherence";

export interface WorkoutStatsData {
  adherence: Adherence;
  /** Context line under the ring, e.g. "31 July – 6 August". */
  dateLabel: string;
  /**
   * Minutes trained today, summed from the prescription of each completed session.
   * The wire has no actual elapsed time on history rows, so this is the prescribed length.
   */
  minutesToday: number;
  volumeKg: number;
  /**
   * Training volume per week, oldest first — whether the load is going up.
   * `volumeKg` is null for a week with no logged session.
   */
  volumeTrend: { label: string; volumeKg: number | null }[];
  error?: {
    type: "CONNECTION_ERROR" | "NO_ROADMAP";
    message: string;
  };
}
