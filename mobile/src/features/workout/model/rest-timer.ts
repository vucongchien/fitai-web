/**
 * Rest Timer for In-Gym Workout Intervals
 * Based on absolute timestamps so countdown never drifts when phone sleeps.
 * Triggers hardware haptic vibration when timer hits 0.
 */

import { useSyncExternalStore } from "react";

import { formatClock, secondsLeft } from "@/features/workout/domain/session-timer-math";

import { nativeHaptics } from "../../../shared/lib/haptics";

export interface RestTimerState {
  formattedTime: string;
  isActive: boolean;
  secondsRemaining: number;
}

let endTimestamp: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function tick() {
  if (endTimestamp === null) {
    return;
  }

  const remaining = secondsLeft(endTimestamp, Date.now());
  if (remaining <= 0) {
    restTimer.stop();
    void nativeHaptics.setComplete();
  } else {
    notify();
  }
}

export const restTimer = {
  getSnapshot(): RestTimerState {
    const remaining = secondsLeft(endTimestamp, Date.now());
    return {
      formattedTime: formatClock(remaining),
      isActive: endTimestamp !== null && remaining > 0,
      secondsRemaining: remaining,
    };
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  start(durationSeconds: number): void {
    this.stop();
    endTimestamp = Date.now() + durationSeconds * 1000;
    intervalId = setInterval(tick, 500);
    notify();
  },

  addSeconds(additionalSeconds: number): void {
    if (endTimestamp !== null) {
      endTimestamp += additionalSeconds * 1000;
      notify();
    }
  },

  stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    endTimestamp = null;
    notify();
  },
};

export function useRestTimer(): RestTimerState {
  return useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot, restTimer.getSnapshot);
}
