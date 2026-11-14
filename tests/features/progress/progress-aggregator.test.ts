import { describe, expect, it } from "vitest";

import {
  buildConsistencyHeatmap,
  calculateAdherencePercentage,
  classifyBmi,
  computeBmi,
  computeBodyComposition,
  formatVolumeKg,
  isSafePhotoUrl,
  mapPeriodicMetricsToEntries,
  summarizeMetricTrend,
} from "@/features/progress/model/progress-aggregator";

describe("progress-aggregator", () => {
  it("computes BMI and classifies ranges accurately", () => {
    expect(computeBmi(70, 175)).toBe(22.9);
    expect(computeBmi(0, 175)).toBe(0);
    expect(computeBmi(70, 0)).toBe(0);

    expect(classifyBmi(0).label).toBe("Not set");
    expect(classifyBmi(17.5).label).toBe("Underweight");
    expect(classifyBmi(22.9).label).toBe("Healthy");
    expect(classifyBmi(27.2).label).toBe("Overweight");
    expect(classifyBmi(32.0).label).toBe("High");
  });

  it("computes lean mass and fat mass from weight and body fat", () => {
    expect(computeBodyComposition(80, 20)).toEqual({
      leanMassKg: 64,
      fatMassKg: 16,
    });
    expect(computeBodyComposition(72, 0)).toEqual({
      leanMassKg: 72,
      fatMassKg: 0,
    });
  });

  it("validates safe photo URLs and rejects javascript/data schemes", () => {
    expect(isSafePhotoUrl("https://images.unsplash.com/photo-123")).toBe(true);
    expect(isSafePhotoUrl("http://localhost:3000/img.png")).toBe(true);
    expect(isSafePhotoUrl("/images/progress.jpg")).toBe(true);
    expect(isSafePhotoUrl("//evil.com/x.png")).toBe(false);
    expect(isSafePhotoUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePhotoUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafePhotoUrl("")).toBe(false);
  });

  it("maps periodic metrics chronologically and strips unsafe photo URLs", () => {
    const mapped = mapPeriodicMetricsToEntries(
      [
        {
          id: "m2",
          weightKg: 71.2,
          bodyFatPercent: 16.5,
          progressPhotoUrl: "https://images.unsplash.com/after",
          loggedAt: "2026-10-15T08:00:00Z",
          heightCm: 0,
        },
        {
          id: "m1",
          weightKg: 73.0,
          bodyFatPercent: 18.0,
          progressPhotoUrl: "javascript:alert(1)",
          loggedAt: "2026-10-01T08:00:00Z",
          heightCm: 175,
        },
      ],
      175,
    );

    expect(mapped.map((e) => e.id)).toEqual(["m1", "m2"]);
    expect(mapped[0].progressPhotoUrl).toBe("");
    expect(mapped[0].bmi).toBe(23.8);
    expect(mapped[1].heightCm).toBe(175);
    expect(mapped[1].progressPhotoUrl).toBe("https://images.unsplash.com/after");
  });

  it("generates plain-language trend summaries for empty, single, and multi check-ins", () => {
    expect(summarizeMetricTrend([], "weightKg", 70)).toContain("No weight check-ins yet");

    const single = mapPeriodicMetricsToEntries(
      [
        {
          id: "1",
          weightKg: 72,
          bodyFatPercent: 18,
          progressPhotoUrl: "",
          loggedAt: "2026-10-01T08:00:00Z",
          heightCm: 175,
        },
      ],
      175,
    );
    expect(summarizeMetricTrend(single, "weightKg", 70)).toContain("2 kg above your 70 kg goal");

    const multi = mapPeriodicMetricsToEntries(
      [
        {
          id: "1",
          weightKg: 74,
          bodyFatPercent: 19,
          progressPhotoUrl: "",
          loggedAt: "2026-10-01T08:00:00Z",
          heightCm: 175,
        },
        {
          id: "2",
          weightKg: 71.5,
          bodyFatPercent: 17.5,
          progressPhotoUrl: "",
          loggedAt: "2026-10-15T08:00:00Z",
          heightCm: 175,
        },
      ],
      175,
    );
    expect(summarizeMetricTrend(multi, "weightKg", 70)).toContain("Down 2.5 kg across 2 check-ins");
    expect(summarizeMetricTrend(multi, "weightKg", 70)).toContain("1.5 kg away");
  });

  it("builds a 12-week consistency heatmap from workout sessions", () => {
    const ref = new Date("2026-11-14T12:00:00Z");
    const weeks = buildConsistencyHeatmap(
      [
        {
          date: { seconds: Math.floor(new Date("2026-11-12T10:00:00Z").getTime() / 1000) },
          totalSets: 15,
          totalVolume: 3200,
        },
        {
          date: { seconds: Math.floor(new Date("2026-11-12T18:00:00Z").getTime() / 1000) },
          totalSets: 10,
          totalVolume: 1800,
        },
      ],
      ref,
      12,
    );

    expect(weeks).toHaveLength(12);
    expect(weeks.every((w) => w.days.length === 7)).toBe(true);

    const allDays = weeks.flatMap((w) => w.days);
    const nov12 = allDays.find((d) => d.date === "2026-11-12");
    expect(nov12?.count).toBe(2);
    expect(nov12?.intensity).toBe(3);
  });

  it("keeps existing adherence and volume formatters working", () => {
    expect(calculateAdherencePercentage(3, 4)).toBe(75);
    expect(calculateAdherencePercentage(0, 0)).toBe(0);
    expect(formatVolumeKg(2450)).toBe("2.5t");
    expect(formatVolumeKg(850)).toBe("850 kg");
  });
});
