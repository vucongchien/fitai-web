"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Interface cho WakeLockSentinel theo chuẩn W3C Screen Wake Lock API
 */
interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  type: "screen";
  release(): Promise<void>;
  onrelease?: ((this: WakeLockSentinelLike, ev: Event) => void) | null;
}

export interface UseWakeLockOptions {
  /**
   * Tự động yêu cầu giữ sáng màn hình khi hook được mount và enabled = true
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback khi trạng thái wake lock thay đổi
   */
  onChange?: (active: boolean) => void;
  /**
   * Callback khi có lỗi yêu cầu wake lock (ví dụ pin yếu hoặc người dùng từ chối)
   */
  onError?: (error: unknown) => void;
}

export interface UseWakeLockReturn {
  /** Thiết bị/trình duyệt có hỗ trợ Screen Wake Lock API hay không */
  isSupported: boolean;
  /** Trạng thái màn hình đang được giữ sáng */
  isActive: boolean;
  /** Yêu cầu giữ sáng màn hình thủ công */
  request: () => Promise<boolean>;
  /** Giải phóng giữ sáng màn hình thủ công */
  release: () => Promise<void>;
}

class WakeLockStore {
  private active = false;
  private sentinel: WakeLockSentinelLike | null = null;
  private subscribers = new Set<() => void>();
  private activeSubscriptions = 0;
  private visibilityAttached = false;

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      Boolean((navigator as any).wakeLock?.request)
    );
  }

  getActive(): boolean {
    return this.active;
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  private handleVisibilityChange = () => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible" && this.activeSubscriptions > 0) {
      void this.request();
    } else if (document.visibilityState === "hidden") {
      void this.release();
    }
  };

  async request(onError?: (err: unknown) => void): Promise<boolean> {
    if (!this.isSupported() || typeof document === "undefined") {
      return false;
    }
    if (document.visibilityState !== "visible") {
      return false;
    }

    if (this.sentinel && !this.sentinel.released) {
      return true;
    }

    try {
      const sentinel: WakeLockSentinelLike = await (navigator as any).wakeLock.request("screen");
      this.sentinel = sentinel;

      sentinel.onrelease = () => {
        this.sentinel = null;
        this.active = false;
        this.notify();
      };

      this.active = true;
      this.notify();
      return true;
    } catch (err) {
      this.sentinel = null;
      this.active = false;
      this.notify();
      onError?.(err);
      return false;
    }
  }

  async release(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // ignore
      }
      this.sentinel = null;
    }
    if (this.active) {
      this.active = false;
      this.notify();
    }
  }

  subscribe(
    onStoreChange: () => void,
    enabled: boolean,
    onChange?: (active: boolean) => void,
    onError?: (error: unknown) => void,
  ): () => void {
    this.subscribers.add(onStoreChange);

    if (typeof document !== "undefined" && !this.visibilityAttached) {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      this.visibilityAttached = true;
    }

    if (enabled) {
      this.activeSubscriptions++;
      void this.request(onError).then((success) => {
        if (success) {
          onChange?.(true);
        }
      });
    }

    return () => {
      this.subscribers.delete(onStoreChange);

      if (enabled) {
        this.activeSubscriptions = Math.max(0, this.activeSubscriptions - 1);
        if (this.activeSubscriptions === 0) {
          void this.release().then(() => {
            onChange?.(false);
          });
        }
      }

      if (this.subscribers.size === 0 && typeof document !== "undefined" && this.visibilityAttached) {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        this.visibilityAttached = false;
      }
    };
  }
}

const globalWakeLockStore = new WakeLockStore();

/**
 * Hook quản lý Screen Wake Lock API an toàn trên môi trường Web / Mobile.
 * Tuân thủ 100% Zero-useEffect thông qua useSyncExternalStore.
 */
export function useWakeLock({
  enabled = true,
  onChange,
  onError,
}: UseWakeLockOptions = {}): UseWakeLockReturn {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return globalWakeLockStore.subscribe(
        onStoreChange,
        enabled,
        (active) => onChangeRef.current?.(active),
        (err) => onErrorRef.current?.(err),
      );
    },
    [enabled],
  );

  const isActive = useSyncExternalStore(
    subscribe,
    () => globalWakeLockStore.getActive(),
    () => false,
  );

  const request = useCallback(async () => {
    return globalWakeLockStore.request(onErrorRef.current);
  }, []);

  const release = useCallback(async () => {
    return globalWakeLockStore.release();
  }, []);

  return {
    isActive,
    isSupported: globalWakeLockStore.isSupported(),
    release,
    request,
  };
}
