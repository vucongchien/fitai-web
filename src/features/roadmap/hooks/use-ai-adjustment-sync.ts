"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useSyncExternalStore } from "react";

import {
  completeAIAdjustment,
  getAIAdjustmentContext,
  subscribeAIAdjustment,
} from "@/features/roadmap/model/ai-adjustment-store";

export function useAIAdjustmentSync() {
  const router = useRouter();
  const lastRefreshedStatusRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  const subscribe = useCallback(
    (notify: () => void) => {
      return subscribeAIAdjustment((updated) => {
        notify();

        // Trigger router.refresh() exactly ONCE when transitioned to completed
        if (
          updated?.status === "completed" &&
          lastRefreshedStatusRef.current !== "completed" &&
          !isRefreshingRef.current
        ) {
          lastRefreshedStatusRef.current = "completed";
          isRefreshingRef.current = true;
          router.refresh();
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 3000);
        } else if (updated?.status === "in_progress") {
          lastRefreshedStatusRef.current = "in_progress";
        }
      });
    },
    [router],
  );

  const context = useSyncExternalStore(subscribe, getAIAdjustmentContext, () => null);

  // Debounced manual check/refresh
  const refreshNow = useCallback(() => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    router.refresh();
    completeAIAdjustment();
    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 3000);
  }, [router]);

  return {
    context,
    refreshNow,
  };
}
