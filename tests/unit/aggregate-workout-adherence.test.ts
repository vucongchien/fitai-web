import { describe, expect, it } from "vitest";

import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import {
  countActiveDays,
  flattenSessionPlans,
  historyInWindow,
  planAdherence,
  plansOnDay,
  SESSION_PLAN_STATUS,
  sessionsPerWeekday,
  sumSets,
  sumVolume,
  toAdherence,
} from "@/shared/api/bff/aggregate/workout-adherence";

function plan(day: number, status: number, id = `s-${day}-${status}`): SessionPlanRow {
  return {
    scheduledDate: { day, month: 8, year: 2026 },
    sessionPlanId: id,
    status,
  };
}

describe("toAdherence", () => {
  it("computes an integer percentage", () => {
    expect(toAdherence(9, 12)).toEqual({ completed: 9, percentage: 75, scheduled: 12 });
  });

  it("returns zero rather than dividing by zero", () => {
    expect(toAdherence(0, 0).percentage).toBe(0);
    expect(toAdherence(5, 0).percentage).toBe(0);
  });

  it("clamps above one hundred", () => {
    expect(toAdherence(14, 10).percentage).toBe(100);
  });
});

describe("flattenSessionPlans", () => {
  it("walks weekPlans -> dayPlans -> sessionPlans", () => {
    const plans = flattenSessionPlans({
      weekPlans: [
        { dayPlans: [{ sessionPlans: [plan(3, SESSION_PLAN_STATUS.COMPLETED)] }] },
        {
          dayPlans: [
            { sessionPlans: [plan(5, SESSION_PLAN_STATUS.PENDING)] },
            { sessionPlans: [] },
          ],
        },
      ],
    });

    expect(plans).toHaveLength(2);
  });

  it("tolerates a roadmap with no weeks, days, or sessions", () => {
    expect(flattenSessionPlans({})).toEqual([]);
    expect(flattenSessionPlans({ weekPlans: [{}] })).toEqual([]);
    expect(flattenSessionPlans({ weekPlans: [{ dayPlans: [{}] }] })).toEqual([]);
  });
});

describe("planAdherence", () => {
  it("counts only COMPLETED toward the numerator", () => {
    const plans = [
      plan(3, SESSION_PLAN_STATUS.COMPLETED),
      plan(4, SESSION_PLAN_STATUS.SKIPPED),
      plan(5, SESSION_PLAN_STATUS.PENDING),
      plan(6, SESSION_PLAN_STATUS.ABORTED),
    ];

    // Skipped and aborted were still scheduled, so they stay in the denominator.
    expect(planAdherence(plans)).toEqual({ completed: 1, percentage: 25, scheduled: 4 });
  });

  it("returns zero percent for an empty plan set", () => {
    expect(planAdherence([])).toEqual({ completed: 0, percentage: 0, scheduled: 0 });
  });
});

describe("plansOnDay", () => {
  it("filters by the roadmap's google.type.Date", () => {
    const plans = [plan(6, SESSION_PLAN_STATUS.COMPLETED), plan(7, SESSION_PLAN_STATUS.PENDING)];
    expect(plansOnDay(plans, "2026-08-06")).toHaveLength(1);
  });

  it("drops plans whose scheduled date is the proto default", () => {
    expect(plansOnDay([{ sessionPlanId: "x", status: 2 }], "2026-08-06")).toEqual([]);
  });
});

describe("sessionsPerWeekday", () => {
  it("reports completed counts and marks unscheduled days as absent", () => {
    const plans = [plan(4, SESSION_PLAN_STATUS.COMPLETED), plan(6, SESSION_PLAN_STATUS.PENDING)];
    const series = sessionsPerWeekday(plans, "2026-08-06", 3);

    expect(series).toEqual([
      { label: "Tue", sessions: 1 },
      { label: "Wed", sessions: null },
      { label: "Thu", sessions: 0 },
    ]);
  });
});

describe("countActiveDays", () => {
  it("counts distinct days holding a completed session", () => {
    const plans = [
      plan(4, SESSION_PLAN_STATUS.COMPLETED, "a"),
      plan(4, SESSION_PLAN_STATUS.COMPLETED, "b"),
      plan(5, SESSION_PLAN_STATUS.SKIPPED, "c"),
    ];

    expect(countActiveDays(plans, "2026-08-06", 7)).toBe(1);
  });
});

describe("history rollups", () => {
  // 2026-08-06T00:00:00Z and 2026-08-01T00:00:00Z
  const rows: SessionHistoryRow[] = [
    { date: { seconds: 1785974400 }, sessionId: "h1", totalSets: 18, totalVolume: 2400.4 },
    { date: { seconds: 1785542400 }, sessionId: "h2", totalSets: 12, totalVolume: 1800.6 },
  ];

  it("filters history by the Timestamp day key", () => {
    expect(historyInWindow(rows, "2026-08-06", 2)).toHaveLength(1);
    expect(historyInWindow(rows, "2026-08-06", 7)).toHaveLength(2);
  });

  it("sums volume and sets", () => {
    expect(sumVolume(rows)).toBe(4201);
    expect(sumSets(rows)).toBe(30);
  });

  it("sums to zero for an empty history", () => {
    expect(sumVolume([])).toBe(0);
    expect(sumSets([])).toBe(0);
  });
});
