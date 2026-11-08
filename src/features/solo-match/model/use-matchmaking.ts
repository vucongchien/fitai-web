"use client";

import { useCallback, useReducer, useRef, useSyncExternalStore } from "react";

import {
  cancelMatchQueueClient,
  fetchActiveMatchClient,
  streamJoinQueue,
} from "@/features/solo-match/api/solo-match-client";
import {
  createInitialMatchmakingState,
  reduceMatchmakingState,
} from "@/features/solo-match/domain/match-state";
import { triggerSoloHaptic } from "@/features/solo-match/domain/solo-feedback";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";

export function useMatchmaking(initialActiveMatch: SoloMatchSummary | null) {
  const [state, dispatch] = useReducer(reduceMatchmakingState, initialActiveMatch, (match) =>
    createInitialMatchmakingState(match),
  );

  const abortRef = useRef<AbortController | null>(null);

  const refreshActiveMatch = useCallback(async () => {
    try {
      const active = await fetchActiveMatchClient();
      if (active) {
        dispatch({ activeMatch: active, type: "HYDRATE_ACTIVE_MATCH" });
      }
    } catch {
      // Ignore background revalidation errors when offline/preview
    }
  }, []);

  // Revalidate active match on mount if none was hydrated from SSR
  const hydratedRef = useRef(false);
  if (!hydratedRef.current && !initialActiveMatch && typeof window !== "undefined") {
    hydratedRef.current = true;
    void refreshActiveMatch();
  }

  // Tick the 60s check-in countdown when in "matched" phase
  const isTicking =
    state.phase === "matched" &&
    Boolean(state.activeMatch) &&
    state.activeMatch?.status !== "IN_PROGRESS";

  const subscribeCountdown = useCallback(
    (onStoreChange: () => void) => {
      if (!isTicking) {
        return () => {};
      }
      const timer = window.setInterval(() => {
        dispatch({ nowMs: Date.now(), type: "READY_TICK" });
        onStoreChange();
      }, 1000);

      return () => window.clearInterval(timer);
    },
    [isTicking],
  );

  useSyncExternalStore(
    subscribeCountdown,
    () => state.remainingReadySeconds,
    () => 60,
  );

  // Cleanup stream on unmount
  const subscribeUnmount = useCallback(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useSyncExternalStore(
    subscribeUnmount,
    () => true,
    () => true,
  );

  const startQueue = useCallback(async () => {
    if (state.phase === "queued") {
      return;
    }
    if (
      state.phase === "matched" &&
      state.activeMatch &&
      (state.activeMatch.status === "PENDING_READY" || state.activeMatch.status === "IN_PROGRESS")
    ) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "START_QUEUE" });

    try {
      await streamJoinQueue({
        onCancelled: (message) => {
          dispatch({ message, type: "STREAM_CANCELLED" });
        },
        onMatched: (match) => {
          triggerSoloHaptic([80, 40, 120]);
          dispatch({ match, nowMs: Date.now(), type: "STREAM_MATCHED" });
        },
        onQueued: (elapsedSeconds, message) => {
          dispatch({ elapsedSeconds, message, type: "STREAM_QUEUED" });
        },
        onTimeout: (message) => {
          dispatch({ message, type: "STREAM_TIMEOUT" });
        },
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const rawMessage = err instanceof Error ? err.message : String(err);

      // If server reports an active match already exists, immediately recover it
      if (rawMessage.toLowerCase().includes("active match")) {
        await refreshActiveMatch();
        return;
      }

      dispatch({
        errorMessage: "Unable to connect to matchmaking right now. Please try again.",
        type: "STREAM_ERROR",
      });
    }
  }, [state.phase, state.activeMatch, refreshActiveMatch]);

  const cancelQueue = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ message: "Search cancelled", type: "STREAM_CANCELLED" });
    try {
      await cancelMatchQueueClient("");
    } catch {
      // Stream abort already triggers server-side cancellation via ctx.Done()
    }
  }, []);

  const resetToIdle = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET_TO_IDLE" });
  }, []);

  return {
    cancelQueue,
    refreshActiveMatch,
    resetToIdle,
    startQueue,
    state,
  };
}
