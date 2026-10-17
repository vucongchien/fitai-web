"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

class CountdownStore {
  private listeners = new Set<() => void>();
  private intervalId: number | null = null;
  private endTime = 0;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  };

  getSnapshot = () => {
    if (this.endTime === 0) {
      return 0;
    }
    const remaining = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
    if (remaining === 0 && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return remaining;
  };

  start = (seconds: number) => {
    this.endTime = Date.now() + seconds * 1000;
    this.notify();
    if (this.intervalId === null && typeof window !== "undefined") {
      this.intervalId = window.setInterval(this.notify, 1000);
    }
  };

  private notify = () => {
    for (const listener of this.listeners) {
      listener();
    }
  };
}

export function useOtpCountdown(initialSeconds = 60) {
  const storeRef = useRef<CountdownStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new CountdownStore();
    if (initialSeconds > 0) {
      storeRef.current.start(initialSeconds);
    }
  }

  const remainingSeconds = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    () => initialSeconds,
  );

  const restart = useCallback((seconds: number) => {
    storeRef.current?.start(seconds);
  }, []);

  return {
    remainingSeconds,
    canResend: remainingSeconds === 0,
    restart,
  };
}
