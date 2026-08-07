import {
  calculateAdherencePercentage,
  formatVolumeKg,
  getMockProgressStats,
  getTopPersonalRecords,
} from "@/features/progress/model/progress-aggregator";

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
    const stats = getMockProgressStats();
    const topPRs = getTopPersonalRecords(stats.personalRecords, 2);
    expect(topPRs).toHaveLength(2);
    expect(topPRs[0].exerciseName).toBe("Dumbbell Bench Press"); // Aug 5
    expect(topPRs[1].exerciseName).toBe("Goblet Squat"); // Aug 3
  });
});
