"use client";

import { useEffect, useState } from "react";

/**
 * One ticking clock for the whole session.
 *
 * Everything time-based (set countdown, rest countdown, elapsed session time,
 * the BR-WL-01 duration thresholds) is derived from timestamps and this tick, so
 * nothing drifts when the tab is throttled or the phone sleeps.
 *
 * The tick comes from a Dedicated Worker so it keeps firing while the tab is
 * backgrounded — a main-thread setInterval is throttled to ~1/minute there, which
 * makes a rest countdown finish late. Falls back to setInterval where Worker is
 * unavailable (jsdom under test, very old browsers).
 */
export function useTicker(active: boolean, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());

    if (typeof Worker === "undefined") {
      const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
      return () => window.clearInterval(timer);
    }

    const worker = new Worker(new URL("./timer.worker.ts", import.meta.url), {
      name: "fitai-session-timer",
      type: "module",
    });
    worker.addEventListener("message", () => setNow(Date.now()));
    worker.postMessage({ intervalMs, type: "start" });

    return () => {
      worker.postMessage({ type: "stop" });
      worker.terminate();
    };
  }, [active, intervalMs]);

  return now;
}

/** Whole seconds left until `endsAt`, never negative. */
export function secondsLeft(endsAt: number | null, now: number): number {
  if (endsAt === null) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** m:ss for countdowns and session time. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * mm:ss for the live-workout countdown instruments, which sit in a fixed-width
 * ring and must not reflow when the minute digit drops from 10 to 9.
 * `formatClock` stays m:ss for session totals, where padding reads as clutter.
 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
