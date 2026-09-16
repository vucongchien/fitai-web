"use client";

import { useMemo, useSyncExternalStore } from "react";


class TickerStore {
  private listeners = new Set<() => void>();
  private worker: Worker | null = null;
  private intervalId: number | null = null;
  private currentNow = typeof Date !== "undefined" ? Date.now() : 0;
  private intervalMs: number;

  constructor(intervalMs = 500) {
    this.intervalMs = intervalMs;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  };

  getSnapshot = () => {
    return this.currentNow;
  };

  private tick = () => {
    this.currentNow = Date.now();
    for (const listener of this.listeners) {
      listener();
    }
  };

  private start() {
    this.currentNow = Date.now();
    if (typeof Worker === "undefined") {
      this.intervalId = window.setInterval(this.tick, this.intervalMs);
      return;
    }

    try {
      this.worker = new Worker(new URL("timer.worker.ts", import.meta.url), {
        name: "fitai-session-timer",
        type: "module",
      });
      this.worker.addEventListener("message", this.tick);
      this.worker.postMessage({ intervalMs: this.intervalMs, type: "start" });
    } catch {
      this.intervalId = window.setInterval(this.tick, this.intervalMs);
    }
  }

  private stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.worker) {
      try {
        this.worker.postMessage({ type: "stop" });
        this.worker.terminate();
      } catch {
        // Ignore worker terminate error
      }
      this.worker = null;
    }
  }
}

const defaultTickerStore = new TickerStore(500);

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
  const store = useMemo(
    () => (intervalMs === 500 ? defaultTickerStore : new TickerStore(intervalMs)),
    [intervalMs],
  );

  return useSyncExternalStore(
    (callback) => {
      if (!active) {
        return () => {};
      }
      return store.subscribe(callback);
    },
    store.getSnapshot,
    () => 0,
  );
}

/** Whole seconds left until `endsAt`, never negative. */
export function secondsLeft(endsAt: number | null, now: number): number {
  if (endsAt === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** M:ss for countdowns and session time. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Mm:ss for the live-workout countdown instruments, which sit in a fixed-width
 * ring and must not reflow when the minute digit drops from 10 to 9.
 * `formatClock` stays m:ss for session totals, where padding reads as clutter.
 */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
