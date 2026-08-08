import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import type {
  SessionHistoryRow,
  SessionPlanRow,
} from "@/shared/api/bff/aggregate/workout-adherence";
import {
  countActiveDays,
  flattenSessionPlans,
  historyInWindow,
  minutesTrainedOnDay,
  planAdherence,
  prescribedMinutes,
  plansOnDay,
  SESSION_PLAN_STATUS,
  sumSets,
  sumVolume,
  weeklyVolumeSeries,
  toAdherence,
} from "@/shared/api/bff/aggregate/workout-adherence";

function plan(day: number, status: number, id = `s-${day}-${status}`): SessionPlanRow {
  return {
    scheduledDate: { day, month: 8, year: 2026 },
    sessionPlanId: id,
    status,
  };
}

function at(iso: string, totalVolume: number): SessionHistoryRow {
  return {
    date: { seconds: Math.floor(Date.parse(iso) / 1000) },
    sessionId: iso,
    totalSets: 10,
    totalVolume,
  };
}

describe(toAdherence, () => {
  it("computes an integer percentage", () => {
    expect(toAdherence(9, 12)).toStrictEqual({ completed: 9, percentage: 75, scheduled: 12 });
  });

  it("returns zero rather than dividing by zero", () => {
    expect(toAdherence(0, 0).percentage).toBe(0);
    expect(toAdherence(5, 0).percentage).toBe(0);
  });

  it("clamps above one hundred", () => {
    expect(toAdherence(14, 10).percentage).toBe(100);
  });
});

describe(flattenSessionPlans, () => {
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
    expect(flattenSessionPlans({})).toStrictEqual([]);
    expect(flattenSessionPlans({ weekPlans: [{}] })).toStrictEqual([]);
    expect(flattenSessionPlans({ weekPlans: [{ dayPlans: [{}] }] })).toStrictEqual([]);
  });
});

describe(planAdherence, () => {
  it("counts only COMPLETED toward the numerator", () => {
    const plans = [
      plan(3, SESSION_PLAN_STATUS.COMPLETED),
      plan(4, SESSION_PLAN_STATUS.SKIPPED),
      plan(5, SESSION_PLAN_STATUS.PENDING),
      plan(6, SESSION_PLAN_STATUS.ABORTED),
    ];

    // Skipped and aborted were still scheduled, so they stay in the denominator.
    expect(planAdherence(plans)).toStrictEqual({ completed: 1, percentage: 25, scheduled: 4 });
  });

  it("returns zero percent for an empty plan set", () => {
    expect(planAdherence([])).toStrictEqual({ completed: 0, percentage: 0, scheduled: 0 });
  });
});

describe(plansOnDay, () => {
  it("filters by the roadmap's google.type.Date", () => {
    const plans = [plan(6, SESSION_PLAN_STATUS.COMPLETED), plan(7, SESSION_PLAN_STATUS.PENDING)];
    expect(plansOnDay(plans, "2026-08-06")).toHaveLength(1);
  });

  it("drops plans whose scheduled date is the proto default", () => {
    expect(plansOnDay([{ sessionPlanId: "x", status: 2 }], "2026-08-06")).toStrictEqual([]);
  });
});

describe(countActiveDays, () => {
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
    { date: { seconds: 1_785_974_400 }, sessionId: "h1", totalSets: 18, totalVolume: 2400.4 },
    { date: { seconds: 1_785_542_400 }, sessionId: "h2", totalSets: 12, totalVolume: 1800.6 },
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

describe("prescribed minutes", () => {
  const withPrescription: SessionPlanRow = {
    prescription: {
      mainExercises: [
        // 3 sets x (60s work + 45s rest) = 315s, plus 60s before the next exercise.
        { durationSeconds: 60, restExerciseSec: 60, restSetSec: 45, targetSets: 3 },
        { durationSeconds: 60, restExerciseSec: 0, restSetSec: 45, targetSets: 3 },
      ],
      warmUps: [{ durationSeconds: 120, restExerciseSec: 0, restSetSec: 0, targetSets: 1 }],
    },
    scheduledDate: { day: 6, month: 8, year: 2026 },
    sessionPlanId: "with-plan",
    status: SESSION_PLAN_STATUS.COMPLETED,
  };

  it("sums work and rest across warm-ups, main work and cool-downs", () => {
    // 120 warm-up + 375 + 315 = 810s -> 14 minutes (rounded).
    expect(prescribedMinutes(withPrescription)).toBe(14);
  });

  it("treats a zero target-set count as one set rather than dropping the exercise", () => {
    const zeroSets: SessionPlanRow = {
      prescription: {
        mainExercises: [{ durationSeconds: 600, restExerciseSec: 0, restSetSec: 0, targetSets: 0 }],
      },
      sessionPlanId: "zero-sets",
      status: SESSION_PLAN_STATUS.COMPLETED,
    };

    expect(prescribedMinutes(zeroSets)).toBe(10);
  });

  it("returns zero when the plan carries no prescription", () => {
    expect(prescribedMinutes({ sessionPlanId: "bare", status: 2 })).toBe(0);
  });

  it("counts only completed sessions on the given day", () => {
    const pending: SessionPlanRow = {
      ...withPrescription,
      sessionPlanId: "pending",
      status: SESSION_PLAN_STATUS.PENDING,
    };

    expect(minutesTrainedOnDay([withPrescription, pending], "2026-08-06")).toBe(14);
  });

  it("returns zero for a day with nothing completed", () => {
    expect(minutesTrainedOnDay([withPrescription], "2026-08-07")).toBe(0);
  });
});

describe(weeklyVolumeSeries, () => {
  it("buckets sessions into ISO weeks starting Monday, oldest first", () => {
    // Mon 3 Aug 2026 and Wed 5 Aug are the same week; Mon 27 Jul is the week before.
    const rows = [
      at("2026-07-27T12:00:00Z", 2000),
      at("2026-08-03T12:00:00Z", 2400),
      at("2026-08-05T12:00:00Z", 2600),
    ];

    expect(weeklyVolumeSeries(rows, "2026-08-06", 2)).toStrictEqual([
      { volumeKg: 2000, weekStart: "2026-07-27" },
      { volumeKg: 5000, weekStart: "2026-08-03" },
    ]);
  });

  it("groups a Sunday with the Monday that opened its week", () => {
    // Sun 9 Aug belongs to the week starting Mon 3 Aug, not the next one.
    const series = weeklyVolumeSeries([at("2026-08-09T12:00:00Z", 1500)], "2026-08-09", 1);
    expect(series).toStrictEqual([{ volumeKg: 1500, weekStart: "2026-08-03" }]);
  });

  it("marks a week with no logged session as null, not zero", () => {
    const series = weeklyVolumeSeries([at("2026-08-03T12:00:00Z", 2400)], "2026-08-06", 3);

    expect(series.map((week) => week.volumeKg)).toStrictEqual([null, null, 2400]);
  });

  it("returns an empty series for a non-positive week count", () => {
    expect(weeklyVolumeSeries([], "2026-08-06", 0)).toStrictEqual([]);
  });

  it("ignores rows carrying no date", () => {
    expect(
      weeklyVolumeSeries([{ sessionId: "x", totalSets: 4, totalVolume: 900 }], "2026-08-06", 1),
    ).toStrictEqual([{ volumeKg: null, weekStart: "2026-08-03" }]);
  });
});
