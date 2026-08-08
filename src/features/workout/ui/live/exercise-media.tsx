"use client";

import { Camera, Play } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { parseVideoSource } from "@/features/workout/domain/video-source-parser";
import type { LiveExercise } from "@/features/workout/model/live-session.types";

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

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
  onWatchVideo?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const showCameraButton = Boolean(onOpenCamera) && exercise.hasAiSupported;
  const parsedVideo = parseVideoSource(exercise.videoUrl);
  const hasValidVideo = parsedVideo.type !== "unknown";
  const showVideoButton = Boolean(onWatchVideo) && hasValidVideo && !cameraActive;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (parsedVideo.type !== "direct") {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (reducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      void playResult.catch(() => {});
    }
  }, [reducedMotion, parsedVideo.type, exercise.videoUrl]);

  return (
    <div className="live-screen__media">
      {cameraActive && children ? (
        children
      ) : parsedVideo.type === "youtube" && !reducedMotion ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="live-media__video w-full h-full border-0"
          src={parsedVideo.embedUrl}
          title={`${exercise.name} Demonstration`}
        />
      ) : parsedVideo.type === "direct" ? (
        <video
          ref={videoRef}
          className="live-media__video"
          loop
          muted
          playsInline
          poster={exercise.thumbnailUrl}
          src={parsedVideo.directUrl}
        />
      ) : exercise.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={exercise.name} className="live-media__poster" src={exercise.thumbnailUrl} />
      ) : (
        <div aria-hidden="true" className="live-media__fallback">
          <span>{exercise.name.charAt(0)}</span>
        </div>
      )}

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
