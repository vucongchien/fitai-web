/**
 * Headless Circular Progress Logic
 * Pure mathematical computation for circular progress rings and gauges.
 * Usable across Web (SVG) and React Native / Expo (react-native-svg or custom gauge).
 */

export const DEFAULT_RADIUS = 52;
export const DEFAULT_CIRCUMFERENCE = 2 * Math.PI * DEFAULT_RADIUS;

export function toPercentage(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export interface CircularProgressMetrics {
  circumference: number;
  hasTarget: boolean;
  percentage: number;
  radius: number;
  strokeDashoffset: number;
}

export function computeCircularProgress(
  value: number,
  max: number,
  radius: number = DEFAULT_RADIUS,
): CircularProgressMetrics {
  const circumference = 2 * Math.PI * radius;
  const percentage = toPercentage(value, max);
  const hasTarget = Number.isFinite(max) && max > 0;
  const strokeDashoffset =
    hasTarget && percentage > 0 ? circumference * (1 - percentage / 100) : circumference;

  return {
    circumference,
    hasTarget,
    percentage,
    radius,
    strokeDashoffset,
  };
}
