import { describe, expect, it } from "vitest";

import {
  elapsedSeconds,
  formatClock,
  formatCountdown,
  secondsLeft,
} from "@/features/workout/domain/session-timer-math";
import { tokens } from "@/shared/design-system/tokens";
import {
  computeCircularProgress,
  DEFAULT_CIRCUMFERENCE,
  DEFAULT_RADIUS,
  toPercentage,
} from "@/shared/ui/charts/use-circular-progress";

describe("Headless UI Logic & Design Tokens (Shared Core)", () => {
  describe("Design Tokens", () => {
    it("exports Triple Lane signature colors and dark theme palette", () => {
      expect(tokens.colors.relayBlue).toBe("#4b57f2");
      expect(tokens.colors.sprintCoral).toBe("#ff5a47");
      expect(tokens.colors.fieldGreen).toBe("#25c77a");

      expect(tokens.colors.dark.background).toBe("#09090b");
      expect(tokens.colors.dark.surface).toBe("#18181b");
      expect(tokens.colors.dark.border).toBe("#27272a");
    });

    it("exports standard spacing and border radiuses", () => {
      expect(tokens.spacing[4]).toBe(16);
      expect(tokens.spacing[6]).toBe(24);
      expect(tokens.radius.surface).toBe(14);
      expect(tokens.radius.round).toBe(9999);
    });
  });

  describe("Headless Circular Progress Logic", () => {
    it("handles invalid or zero max values safely in toPercentage", () => {
      expect(toPercentage(50, 0)).toBe(0);
      expect(toPercentage(50, -10)).toBe(0);
      expect(toPercentage(Number.NaN, 100)).toBe(0);
      expect(toPercentage(50, Number.POSITIVE_INFINITY)).toBe(0);
    });

    it("calculates percentage correctly with bounds [0, 100]", () => {
      expect(toPercentage(50, 100)).toBe(50);
      expect(toPercentage(150, 100)).toBe(100);
      expect(toPercentage(-10, 100)).toBe(0);
      expect(toPercentage(1, 3)).toBe(33);
    });

    it("computes circular progress strokeDashoffset accurately", () => {
      const metrics50 = computeCircularProgress(50, 100, DEFAULT_RADIUS);
      expect(metrics50.percentage).toBe(50);
      expect(metrics50.hasTarget).toBe(true);
      expect(metrics50.circumference).toBeCloseTo(DEFAULT_CIRCUMFERENCE);
      expect(metrics50.strokeDashoffset).toBeCloseTo(DEFAULT_CIRCUMFERENCE * 0.5);

      const metrics100 = computeCircularProgress(100, 100, DEFAULT_RADIUS);
      expect(metrics100.percentage).toBe(100);
      expect(metrics100.strokeDashoffset).toBeCloseTo(0);

      const metrics0 = computeCircularProgress(0, 100, DEFAULT_RADIUS);
      expect(metrics0.percentage).toBe(0);
      expect(metrics0.strokeDashoffset).toBeCloseTo(DEFAULT_CIRCUMFERENCE);
    });
  });

  describe("Headless Session Timer Mathematics", () => {
    it("calculates secondsLeft without negative values", () => {
      const now = 1000000;
      expect(secondsLeft(null, now)).toBe(0);
      expect(secondsLeft(now + 5000, now)).toBe(5);
      expect(secondsLeft(now - 1000, now)).toBe(0);
    });

    it("calculates elapsedSeconds correctly", () => {
      const startedAt = 1000000;
      expect(elapsedSeconds(startedAt, startedAt + 65000)).toBe(65);
      expect(elapsedSeconds(startedAt, startedAt - 5000)).toBe(0);
    });

    it("formats clock in m:ss format", () => {
      expect(formatClock(0)).toBe("0:00");
      expect(formatClock(9)).toBe("0:09");
      expect(formatClock(65)).toBe("1:05");
      expect(formatClock(754)).toBe("12:34");
    });

    it("formats countdown in mm:ss fixed-width format", () => {
      expect(formatCountdown(0)).toBe("00:00");
      expect(formatCountdown(9)).toBe("00:09");
      expect(formatCountdown(65)).toBe("01:05");
      expect(formatCountdown(754)).toBe("12:34");
    });
  });
});
