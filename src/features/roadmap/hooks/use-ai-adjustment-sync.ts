"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AIAdjustmentContext,
  completeAIAdjustment,
  getAIAdjustmentContext,
  subscribeAIAdjustment,
} from "@/features/roadmap/model/ai-adjustment-store";

export function useAIAdjustmentSync() {
  const router = useRouter();
  const [context, setContext] = useState<AIAdjustmentContext | null>(null);
  const lastRefreshedStatusRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  // Sync initial state and subscribe to changes
  useEffect(() => {
    const initial = getAIAdjustmentContext();
    setContext(initial);
    if (initial?.status === "completed") {
      lastRefreshedStatusRef.current = "completed";
    }

    const unsubscribe = subscribeAIAdjustment((updated) => {
      setContext(updated);

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

    return () => unsubscribe();
  }, [router]);

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
