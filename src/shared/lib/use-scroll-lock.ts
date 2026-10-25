"use client";

import { useCallback, useSyncExternalStore } from "react";

class ScrollLockStore {
  private lockCount = 0;
  private originalOverflow: string | null = null;
  private listeners = new Set<() => void>();

  acquire(): void {
    if (typeof document === "undefined") {
      return;
    }

    if (this.lockCount === 0) {
      this.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    this.lockCount += 1;
    this.notify();
  }

  release(): void {
    if (typeof document === "undefined") {
      return;
    }

    if (this.lockCount <= 0) {
      this.lockCount = 0;
      return;
    }

    this.lockCount -= 1;
    if (this.lockCount === 0) {
      document.body.style.overflow = this.originalOverflow ?? "";
      this.originalOverflow = null;
    }
    this.notify();
  }

  getLockCount(): number {
    return this.lockCount;
  }

  isLocked(): boolean {
    return this.lockCount > 0;
  }

  resetForTest(): void {
    this.lockCount = 0;
    this.originalOverflow = null;
    this.listeners.clear();
  }

  subscribe(listener: () => void, enabled: boolean): () => void {
    this.listeners.add(listener);

    if (enabled) {
      this.acquire();
    }

    return () => {
      this.listeners.delete(listener);
      if (enabled) {
        this.release();
      }
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

export const scrollLockStore = new ScrollLockStore();

export function acquireScrollLock(): void {
  scrollLockStore.acquire();
}

export function releaseScrollLock(): void {
  scrollLockStore.release();
}

export function getScrollLockCount(): number {
  return scrollLockStore.getLockCount();
}

export function resetScrollLockForTest(): void {
  scrollLockStore.resetForTest();
}

// Scroll lock hook using useSyncExternalStore
export function useScrollLock(enabled: boolean): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return scrollLockStore.subscribe(onStoreChange, enabled);
    },
    [enabled],
  );

  return useSyncExternalStore(
    subscribe,
    () => scrollLockStore.isLocked(),
    () => false,
  );
}
