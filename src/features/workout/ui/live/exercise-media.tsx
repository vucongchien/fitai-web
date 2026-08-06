"use client";

import { Camera } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

function readReducedMotion(): boolean {
  // jsdom does not implement matchMedia, and neither do very old browsers.
  // Absent the query we assume motion is fine — the loop is the guidance.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
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
    if (typeof window.matchMedia !== "function") return;

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
}: {
  exercise: LiveExercise;
  children?: ReactNode;
  onOpenCamera?: () => void;
  cameraActive?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const showCameraButton = Boolean(onOpenCamera) && exercise.hasAiSupported;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      // Show the first frame rather than wherever it happened to stop.
      video.currentTime = 0;
      return;
    }
    // Muted playback is always permitted by autoplay policy; a rejection here
    // just means no clip, which the poster already covers. jsdom's play() is
    // unimplemented and returns undefined rather than a promise, so guard the
    // shape before chaining .catch.
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
          // user who asked the OS for less motion gets the poster frame instead.
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

      {showCameraButton ? (
        <button
          aria-label="Open AI camera"
          aria-pressed={cameraActive}
          className="live-media__camera"
          onClick={onOpenCamera}
          type="button"
        >
          <Camera aria-hidden="true" size={18} />
        </button>
      ) : null}
    </div>
  );
}
