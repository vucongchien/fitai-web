import "server-only";
import type { SchedulePageData, SessionSummary } from "@/features/roadmap/model/roadmap-page.types";

import { getMockRoadmapPageData } from "./get-mock-roadmap-data";

const WEEK_1: SessionSummary[] = [
  {
    date: "Jul 27",
    day: "Mon",
    duration: 35,
    id: "w1-lower",
    muscles: ["Quads"],
    status: "complete",
    targetRpe: 5,
    time: "18:30",
    title: "Lower-body foundation",
  },
  {
    date: "Jul 28",
    day: "Tue",
    duration: 20,
    id: "w1-recovery",
    muscles: ["Mobility"],
    status: "rest",
    targetRpe: 3,
    time: "Flexible",
    title: "Recovery day",
  },
  {
    date: "Jul 29",
    day: "Wed",
    duration: 38,
    id: "w1-upper",
    muscles: ["Chest", "Back"],
    status: "complete",
    targetRpe: 6,
    time: "18:30",
    title: "Upper-body intro",
  },
  {
    date: "Jul 31",
    day: "Fri",
    duration: 40,
    id: "w1-posterior",
    muscles: ["Hamstrings"],
    status: "skipped",
    targetRpe: 6,
    time: "18:00",
    title: "Posterior chain",
  },
];

const WEEK_3: SessionSummary[] = [
  {
    date: "Aug 10",
    day: "Mon",
    duration: 45,
    id: "w3-lower",
    muscles: ["Quads", "Glutes"],
    status: "planned",
    targetRpe: 7,
    time: "18:30",
    title: "Lower-body strength",
  },
  {
    date: "Aug 11",
    day: "Tue",
    duration: 20,
    id: "w3-recovery",
    muscles: ["Mobility"],
    status: "rest",
    targetRpe: 3,
    time: "Flexible",
    title: "Recovery day",
  },
  {
    date: "Aug 12",
    day: "Wed",
    duration: 45,
    id: "w3-upper",
    muscles: ["Chest", "Shoulders"],
    status: "planned",
    targetRpe: 7,
    time: "18:30",
    title: "Upper-body control",
  },
  {
    date: "Aug 15",
    day: "Sat",
    duration: 42,
    id: "w3-full",
    muscles: ["Full body"],
    status: "planned",
    targetRpe: 7,
    time: "09:00",
    title: "Full-body power",
  },
];

const WEEK_4: SessionSummary[] = [
  {
    date: "Aug 17",
    day: "Mon",
    duration: 40,
    id: "w4-lower",
    muscles: ["Quads"],
    status: "planned",
    targetRpe: 6,
    time: "18:30",
    title: "Lower-body consolidate",
  },
  {
    date: "Aug 19",
    day: "Wed",
    duration: 40,
    id: "w4-upper",
    muscles: ["Back", "Arms"],
    status: "planned",
    targetRpe: 6,
    time: "18:30",
    title: "Upper-body consolidate",
  },
  {
    date: "Aug 20",
    day: "Thu",
    duration: 20,
    id: "w4-recovery",
    muscles: ["Mobility"],
    status: "rest",
    targetRpe: 3,
    time: "Flexible",
    title: "Recovery day",
  },
  {
    date: "Aug 22",
    day: "Sat",
    duration: 35,
    id: "w4-review",
    muscles: ["Full body"],
    status: "planned",
    targetRpe: 5,
    time: "09:00",
    title: "Progress review session",
  },
];

const DATE_RANGES: Record<number, string> = {
  1: "Jul 27 – Aug 2",
  3: "Aug 10–16",
  4: "Aug 17–23",
};

/**
 * The four-week schedule.
 *
 * Week 2 reuses the roadmap page's own session list so both screens agree.
 */
function getMockSchedulePageData(): SchedulePageData {
  const roadmap = getMockRoadmapPageData();

  const sessionsByWeek: Record<number, SessionSummary[]> = {
    1: WEEK_1,
    2: roadmap.currentWeekSessions,
    3: WEEK_3,
    4: WEEK_4,
  };

  const dateRanges: Record<number, string> = {
    ...DATE_RANGES,
    [roadmap.activeWeek]: roadmap.currentWeekDateRange,
  };

  return {
    activeWeek: roadmap.activeWeek,
    weeks: roadmap.weeks.map((week) => ({
      dateRange: dateRanges[week.number] ?? "",
      label: week.label,
      number: week.number,
      sessions: sessionsByWeek[week.number] ?? [],
      state: week.state,
    })),
  };
}

/**
 * Fetches the full four-week schedule.
 *
 * Calls: CoachingService.getActiveRoadmap({ userId }) → every week, day and session plan.
 * `GetActiveRoadmapResponse.roadmap` already carries all four weeks, so the real adapter
 * walks `week_plans → day_plans → session_plans` rather than fetching per week.
 */
export async function getSchedulePageData(): Promise<SchedulePageData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockSchedulePageData();
  // TODO: return adaptSchedulePageData(await client.getActiveRoadmap({ userId }));
  return getMockSchedulePageData();
}
