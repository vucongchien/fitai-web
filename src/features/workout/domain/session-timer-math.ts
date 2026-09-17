/**
 * Headless Workout Session Timer Mathematics & Formatting
 * Pure functions with zero DOM or React dependencies.
 * Shared across Next.js (Web) and React Native / Expo (Mobile).
 */

/** Whole seconds left until `endsAt`, never negative. */
export function secondsLeft(endsAt: number | null, now: number): number {
  if (endsAt === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** Whole elapsed seconds from `startedAt` to `now`, never negative. */
export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** M:ss format for countdowns and session time. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Mm:ss format for live-workout countdown instruments.
 * Fixed-width formatting that does not reflow when minutes drop below 10.
 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
