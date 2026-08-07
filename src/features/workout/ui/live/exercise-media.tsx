"use client";

import { Camera, Play } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

function readReducedMotion(): boolean {
  // Jsdom does not implement matchMedia, and neither do very old browsers.
  // Absent the query we assume motion is fine — the loop is the guidance.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {return false;}
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True when the OS asks for reduced motion. Computed synchronously on mount
 * (not "discovered" a tick later via an effect) so the very first pass of the
 * video-playback effect below already sees the real value — otherwise a
 * reduced-motion user's clip would still start playing for one effect cycle
 * before being paused.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {return;}

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function ExerciseMedia({
  cameraActive = false,
  children,
  exercise,
  onOpenCamera,
  onWatchVideo,
}: {
  exercise: LiveExercise;
  children?: ReactNode;
  onOpenCamera?: () => void;
  cameraActive?: boolean;
  /** Open the full demo clip. Only offered when there is a clip to open. */
  onWatchVideo?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const showCameraButton = Boolean(onOpenCamera) && exercise.hasAiSupported;
  // No clip means no button: an affordance that opens nothing is worse than
  // Its absence. The demo assets are not seeded in the mock data yet, so this
  // Is the honest branch rather than a dead control on every exercise.
  const showVideoButton = Boolean(onWatchVideo) && Boolean(exercise.videoUrl) && !cameraActive;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {return;}
    if (reducedMotion) {
      video.pause();
      // Show the first frame rather than wherever it happened to stop.
      video.currentTime = 0;
      return;
    }
    // Muted playback is always permitted by autoplay policy; a rejection here
    // Just means no clip, which the poster already covers. jsdom's play() is
    // Unimplemented and returns undefined rather than a promise, so guard the
    // Shape before chaining .catch.
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      void playResult.catch(() => {});
    }
  }, [reducedMotion, exercise.videoUrl]);

  return (
    <div className="live-screen__media">
      {cameraActive && children ? (
        children
      ) : exercise.videoUrl ? (
        <video
          // The demo loop is the guidance itself, so it plays on sight — but a
          // User who asked the OS for less motion gets the poster frame instead.
          // Playback is driven imperatively in the effect above, not via autoPlay.
          ref={videoRef}
          className="live-media__video"
          loop
          muted
          playsInline
          poster={exercise.thumbnailUrl}
          src={exercise.videoUrl}
        />
      ) : exercise.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- demo assets are remote/unsized
        <img alt={exercise.name} className="live-media__poster" src={exercise.thumbnailUrl} />
      ) : (
        <div className="live-media__fallback" aria-hidden="true">
          <span>{exercise.name.charAt(0)}</span>
        </div>
      )}

      {/* Overlay controls, top-right of the media. Solid surfaces, never a
          translucent scrim — DESIGN.md rules out glassmorphism. */}
      {showCameraButton || showVideoButton ? (
        <div className="live-media__controls">
          {showVideoButton ? (
            <button
              aria-label="Watch demo video"
              className="live-media__control"
              onClick={onWatchVideo}
              type="button"
            >
              <Play aria-hidden="true" size={18} />
            </button>
          ) : null}

          {showCameraButton ? (
            <button
              aria-label="Open AI camera"
              aria-pressed={cameraActive}
              className="live-media__control live-media__camera"
              onClick={onOpenCamera}
              type="button"
            >
              <Camera aria-hidden="true" size={18} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
