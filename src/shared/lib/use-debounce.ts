"use client";

import { useRef, useSyncExternalStore } from "react";

class DebounceStore<T> {
  private current: T;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();

  constructor(initial: T, private delayMs: number) {
    this.current = initial;
  }

  setDelay(delayMs: number) {
    this.delayMs = delayMs;
  }

  update(next: T) {
    if (Object.is(this.current, next) && !this.timer) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.current = next;
      this.timer = null;
      this.listeners.forEach((l) => l());
    }, this.delayMs);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    };
  };

  getSnapshot = () => this.current;
}

/**
 * Custom hook debounce giá trị theo thời gian trễ (mặc định 250ms).
 * Sử dụng useSyncExternalStore thay vì useEffect: loại bỏ re-render cascade,
 * tự động cleanup timeout khi unmount, an toàn 100% với React 19.
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const storeRef = useRef<DebounceStore<T> | null>(null);
  if (!storeRef.current) {
    storeRef.current = new DebounceStore(value, delayMs);
  } else {
    storeRef.current.setDelay(delayMs);
    storeRef.current.update(value);
  }

  const store = storeRef.current;
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => value);
}
