import { describe, expect, it } from 'vitest';
import {
  adaptRoadmapPageData,
  formatDate,
  formatWeekDateRange,
} from "@/features/roadmap/model/roadmap-page.mapper";
import { adaptWorkoutStatsData } from "@/features/workout-stats/model/workout-stats.mapper";
import type { Roadmap } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";

describe("formatWeekDateRange", () => {
  it("calculates a standard 7-day range (Mon to Sun) from start date", () => {
    const startDate = { day: 10, month: 8, year: 2026 }; // Mon, Aug 10, 2026
    const range = formatWeekDateRange(startDate);
    expect(range).toBe("Aug 10–Aug 16");
  });

  it("returns empty string when start date is missing", () => {
    expect(formatWeekDateRange(undefined)).toBe("");
  });
});

describe("adaptRoadmapPageData", () => {
  it("formats currentWeekDateRange as 7 days from week start date", () => {
    const roadmapMock: Partial<Roadmap> = {
      weekPlans: [
        {
          weekNumber: 1,
          phase: 1,
          targetRpe: 7,
          startDate: { day: 10, month: 8, year: 2026 } as any,
          endDate: { day: 17, month: 8, year: 2026 } as any, // Raw backend end date (Aug 17)
          dayPlans: [
            {
              scheduledDate: { day: 10, month: 8, year: 2026 } as any,
              sessionPlans: [
                {
                  sessionPlanId: "sp-1",
                  status: 1, // PENDING
                  targetMuscleGroups: ["CHEST", "BACK"],
                  slotTime: "17:30-19:00",
                } as any,
              ],
            },
          ],
        } as any,
      ],
    };

    const data = adaptRoadmapPageData(roadmapMock as Roadmap);
    expect(data.currentWeekDateRange).toBe("Aug 10–Aug 16");
    expect(data.activeWeek).toBe(1);
    expect(data.currentWeekSessions).toHaveLength(1);
    expect(data.currentWeekSessions[0]?.title).toBe("CHEST, BACK");
  });

  it("sets future pending sessions to planned status (grey) and only sets today pending sessions to next (green)", () => {
    const today = new Date();
    const todayScheduledDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };

    const roadmapMock: Partial<Roadmap> = {
      weekPlans: [
        {
          weekNumber: 1,
          phase: 1,
          targetRpe: 7,
          dayPlans: [
            {
              scheduledDate: { day: 10, month: 8, year: 2050 } as any, // Future date (year 2050)
              sessionPlans: [
                {
                  sessionPlanId: "sp-future",
                  status: 1, // PENDING
                  targetMuscleGroups: ["CHEST", "BACK"],
                  slotTime: "17:30-19:00",
                } as any,
              ],
            },
            {
              scheduledDate: todayScheduledDate as any, // Today's date
              sessionPlans: [
                {
                  sessionPlanId: "sp-today",
                  status: 1, // PENDING
                  targetMuscleGroups: ["LEGS"],
                  slotTime: "18:00-19:30",
                } as any,
              ],
            },
          ],
        } as any,
      ],
    };

    const data = adaptRoadmapPageData(roadmapMock as Roadmap);
    const futureSession = data.currentWeekSessions.find((s) => s.id === "sp-future");
    const todaySession = data.currentWeekSessions.find((s) => s.id === "sp-today");

    expect(futureSession?.status).toBe("planned");
    expect(todaySession?.status).toBe("next");
  });
});

describe("adaptWorkoutStatsData window sync", () => {
  it("uses upcoming week plan dates when current week has no plans", () => {
    const plans = [
      {
        sessionPlanId: "sp-1",
        scheduledDate: { day: 10, month: 8, year: 2026 }, // Aug 10
        status: 1, // PENDING
      },
      {
        sessionPlanId: "sp-2",
        scheduledDate: { day: 11, month: 8, year: 2026 }, // Aug 11
        status: 1,
      },
    ];

    const stats = adaptWorkoutStatsData(plans as any, [], "2026-08-08"); // Today is Aug 8
    expect(stats.dateLabel).toBe("10 – 16 August");
    expect(stats.adherence.scheduled).toBe(2);
    expect(stats.adherence.completed).toBe(0);
  });
});
