import { formatRangeLabel, WEEK_DAYS } from "@/features/nutrition/model/nutrition-page.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import type { DayKey } from "@/shared/api/bff/aggregate/day-key";
import { dayKeyFromCalendarDate, dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import {
  historyInWindow,
  minutesTrainedOnDay,
  planAdherence,
  plansInWindow,
  sumVolume,
  weeklyVolumeSeries,
} from "@/shared/api/bff/aggregate/workout-adherence";

/** Weeks of volume history shown on the trend chart. */
const VOLUME_WEEKS = 4;

export function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  }
  return `${kg.toLocaleString("en-US")} kg`;
}

/** Short axis label for a week, e.g. "Aug 3". */
function weekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return weekStart;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * Shapes the Workout screen from `GetActiveRoadmap` + `GetWorkoutHistory`,
 * over a trailing week.
 *
 * Roadmap plans and execution history stay independent sources: the wire offers no
 * `plan_id` on `WorkoutSessionSummary`, so no row-level join is implied.
 */
export function adaptWorkoutStatsData(
  plans: readonly SessionPlanRow[],
  history: readonly SessionHistoryRow[],
  today: DayKey,
): WorkoutStatsData {
  const currentWindow = dayKeyRange(today, WEEK_DAYS);
  let targetPlans = plansInWindow(plans, today, WEEK_DAYS);
  let startKey = currentWindow[0] ?? today;
  let endKey = today;

  if (targetPlans.length === 0 && plans.length > 0) {
    const futurePlanDates = plans
      .map((p) => dayKeyFromCalendarDate(p.scheduledDate))
      .filter((k): k is DayKey => k !== null && k >= today)
      .sort();

    if (futurePlanDates.length > 0) {
      startKey = futurePlanDates[0]!;
      const startDate = new Date(`${startKey}T00:00:00Z`);
      startDate.setUTCDate(startDate.getUTCDate() + 6);
      endKey = toDayKey(startDate) ?? startKey;

      targetPlans = plans.filter((p) => {
        const k = dayKeyFromCalendarDate(p.scheduledDate);
        return k !== null && k >= startKey && k <= endKey;
      });
    }
  }

  return {
    adherence: planAdherence(targetPlans),
    dateLabel: formatRangeLabel(startKey, endKey),
    minutesToday: minutesTrainedOnDay(plans, today),
    volumeKg: sumVolume(historyInWindow(history, today, WEEK_DAYS)),
    volumeTrend: weeklyVolumeSeries(history, today, VOLUME_WEEKS).map((week) => ({
      label: weekLabel(week.weekStart),
      volumeKg: week.volumeKg,
    })),
  };
}
