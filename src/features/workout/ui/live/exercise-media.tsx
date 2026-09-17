"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useSyncExternalStore } from "react";

import { parseVideoSource } from "@/features/workout/domain/video-source-parser";
import type { LiveExercise } from "@/features/workout/model/live-session.types";

function subscribeReducedMotion(listener: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

export function ExerciseMedia({
  cameraActive = false,
  children,
  exercise,
  onOpenCamera,
}: {
  exercise: LiveExercise;
  children?: ReactNode;
  onOpenCamera?: () => void;
  cameraActive?: boolean;
  onWatchVideo?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const showCameraButton = Boolean(onOpenCamera) && exercise.hasAiSupported;
  const parsedVideo = parseVideoSource(exercise.videoUrl);

  // React 19 Ref Callback Cleanup: Handles video playback and auto-pauses on unmount
  const videoCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return;
      if (reducedMotion) {
        el.pause();
        el.currentTime = 0;
        return;
      }
      const playResult = el.play();
      if (playResult && typeof playResult.catch === "function") {
        void playResult.catch(() => {});
      }
      return () => {
        el.pause();
      };
    },
    [reducedMotion],
  );

  return (
    <div className="live-screen__media">
      {cameraActive && children ? (
        children
      ) : parsedVideo.type === "direct" && parsedVideo.directUrl ? (
        <video
          ref={videoCallback}
          className="live-media__poster"
          loop
          muted
          playsInline
          src={parsedVideo.directUrl}
        />
      ) : exercise.thumbnailUrl ? (
        <Image
          alt={exercise.name}
          className="live-media__poster"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 400px"
          src={exercise.thumbnailUrl}
        />
      ) : (
        <div aria-hidden="true" className="live-media__fallback">
          <span>{exercise.name.charAt(0)}</span>
        </div>
      )}

      {showCameraButton ? (
        <div className="live-media__controls">
          <button
            aria-label="Open AI camera"
            aria-pressed={cameraActive}
            className="live-media__control live-media__camera"
            onClick={onOpenCamera}
            type="button"
          >
            <Camera aria-hidden="true" size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
