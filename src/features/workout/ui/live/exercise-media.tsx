"use client";

import { Camera } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** True when the OS asks for reduced motion. Read after mount so SSR stays stable. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // jsdom does not implement matchMedia, and neither do very old browsers.
    // Absent the query we assume motion is fine — the loop is the guidance.
    if (typeof window.matchMedia !== "function") return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
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

  return (
    <div className="live-screen__media">
      {cameraActive && children ? (
        children
      ) : exercise.videoUrl ? (
        <video
          // The demo loop is the guidance itself, so it plays on sight — but a
          // user who asked the OS for less motion gets the poster frame instead.
          autoPlay={!reducedMotion}
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
