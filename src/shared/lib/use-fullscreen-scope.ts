"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreenScope() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      // Clean up: automatically exit fullscreen when leaving/unmounting the screen
      if (typeof document !== "undefined" && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

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
