"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

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

// Single ticking clock for whole session via Dedicated Worker
export function useTicker(active: boolean, intervalMs = 500): number {
  const store = useMemo(
    () => (intervalMs === 500 ? defaultTickerStore : new TickerStore(intervalMs)),
    [intervalMs],
  );

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!active) {
        return () => {};
      }
      return store.subscribe(callback);
    },
    [active, store],
  );

  return useSyncExternalStore(subscribe, store.getSnapshot, () => 0);
}

export {
  elapsedSeconds,
  formatClock,
  formatCountdown,
  secondsLeft,
} from "@/features/workout/domain/session-timer-math";
