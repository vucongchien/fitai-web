import { describe, expect, it } from 'vitest';
import {
  calculateAdherencePercentage,
  formatVolumeKg,
  getTopPersonalRecords,
} from "@/features/progress/model/progress-aggregator";
import type { PersonalRecord } from "@/features/progress/model/types";

describe("progress-aggregator", () => {
  it("calculates adherence percentage correctly", () => {
    expect(calculateAdherencePercentage(9, 12)).toBe(75);
    expect(calculateAdherencePercentage(0, 10)).toBe(0);
    expect(calculateAdherencePercentage(5, 0)).toBe(0);
    expect(calculateAdherencePercentage(12, 10)).toBe(100);
  });

  it("formats volume in kg and tonnes properly", () => {
    expect(formatVolumeKg(850)).toBe("850 kg");
    expect(formatVolumeKg(1000)).toBe("1t");
    expect(formatVolumeKg(3450)).toBe("3.5t");
  });

  it("returns top PRs sorted by date", () => {
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
    const topPRs = getTopPersonalRecords(personalRecords, 2);
    expect(topPRs).toHaveLength(2);
    expect(topPRs[0].exerciseName).toBe("Dumbbell Bench Press"); // Aug 5
    expect(topPRs[1].exerciseName).toBe("Goblet Squat"); // Aug 3
  });
});
