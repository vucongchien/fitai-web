"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof document === "undefined") {
    return () => {};
  }
  document.addEventListener("fullscreenchange", callback);
  return () => {
    document.removeEventListener("fullscreenchange", callback);
    // Clean up: automatically exit fullscreen when leaving/unmounting the screen
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  };
}

function getSnapshot(): boolean {
  return typeof document !== "undefined" && Boolean(document.fullscreenElement);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useFullscreenScope() {
  const isFullscreen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    void document.documentElement.requestFullscreen?.().catch(() => {
      // iOS Safari has no document fullscreen API, fail silently
    });
  }, []);

  const exitFullscreen = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  return { exitFullscreen, isFullscreen, toggleFullscreen };
}
