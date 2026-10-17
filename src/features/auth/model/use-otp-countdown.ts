"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

function createTimerStore(initialSeconds: number) {
  let endTime = Date.now() + initialSeconds * 1000;
  let remaining = initialSeconds;
  let timerId: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const tick = () => {
    const next = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (next !== remaining) {
      remaining = next;
      for (const listener of listeners) {
        listener();
      }
    }
    if (next === 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = () => {
    if (timerId === null && remaining > 0 && typeof window !== "undefined") {
      timerId = setInterval(tick, 1000);
    }
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      startTimer();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
      };
    },
    getSnapshot() {
      return remaining;
    },
    restart(seconds: number) {
      endTime = Date.now() + seconds * 1000;
      remaining = seconds;
      for (const listener of listeners) {
        listener();
      }
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      startTimer();
    },
  };
}

export function useOtpCountdown(initialSeconds = 60) {
  const storeRef = useRef<ReturnType<typeof createTimerStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTimerStore(initialSeconds);
  }

  const remainingSeconds = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    () => initialSeconds,
  );

  const restart = useCallback(
    (seconds: number = initialSeconds) => {
      storeRef.current?.restart(seconds);
    },
    [initialSeconds],
  );

  return {
    remainingSeconds,
    canResend: remainingSeconds === 0,
    restart,
  };
}
