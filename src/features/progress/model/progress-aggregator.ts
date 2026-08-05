import type { PersonalRecord, RoadmapAdherence, UserProgressStats, WeeklyActivityDay } from "./types";

export function calculateAdherencePercentage(completed: number, scheduled: number): number {
  if (scheduled <= 0) return 0;
  return Math.min(100, Math.round((completed / scheduled) * 100));
}

export function formatVolumeKg(volumeKg: number): string {
  if (volumeKg >= 1000) {
    return `${(volumeKg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  }
  return `${volumeKg.toLocaleString("en-US")} kg`;
}

export function getTopPersonalRecords(records: PersonalRecord[], limit = 3): PersonalRecord[] {
  return [...records]
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, limit);
}

export function getMockProgressStats(): UserProgressStats {
  const weeklyActivity: WeeklyActivityDay[] = [
    { dayLabel: "Mon", date: "2026-08-03", status: "completed", sessionTitle: "Lower-body foundation" },
    { dayLabel: "Tue", date: "2026-08-04", status: "recovery", sessionTitle: "Recovery day" },
    { dayLabel: "Wed", date: "2026-08-05", status: "completed", sessionTitle: "Upper-body control" },
    { dayLabel: "Thu", date: "2026-08-06", status: "rest" },
    { dayLabel: "Fri", date: "2026-08-07", status: "rest" },
    { dayLabel: "Sat", date: "2026-08-08", status: "rest" },
    { dayLabel: "Sun", date: "2026-08-09", status: "rest" },
  ];

  const personalRecords: PersonalRecord[] = [
    {
      id: "pr-1",
      exerciseName: "Goblet Squat",
      metric: "24 kg × 10",
      value: 24,
      unit: "kg",
      achievedAt: "2026-08-03T18:30:00Z",
    },
    {
      id: "pr-2",
      exerciseName: "Dumbbell Bench Press",
      metric: "20 kg × 8",
      value: 20,
      unit: "kg",
      achievedAt: "2026-08-05T18:30:00Z",
    },
    {
      id: "pr-3",
      exerciseName: "Plank Hold",
      metric: "75 sec",
      value: 75,
      unit: "sec",
      achievedAt: "2026-07-31T18:00:00Z",
    },
  ];

  const adherence: RoadmapAdherence = {
    totalSessionsScheduled: 12,
    sessionsCompleted: 9,
    currentWeek: 2,
    totalWeeks: 4,
    adherencePercentage: calculateAdherencePercentage(9, 12),
  };

  return {
    currentStreakDays: 5,
    bestStreakDays: 8,
    totalWorkoutsCompleted: 9,
    totalVolumeKg: 3450,
    adherence,
    weeklyActivity,
    personalRecords,
  };
}
