import type { PersonalRecord } from "./types";

export function calculateAdherencePercentage(completed: number, scheduled: number): number {
  if (scheduled <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((completed / scheduled) * 100));
}

export function formatVolumeKg(volumeKg: number): string {
  if (volumeKg >= 1000) {
    return `${(volumeKg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  }
  return `${volumeKg.toLocaleString("en-US")} kg`;
}

export function getTopPersonalRecords(records: PersonalRecord[], limit = 3): PersonalRecord[] {
  return records
    .toSorted((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, limit);
}

// Replacing the mock function with empty space or comments
