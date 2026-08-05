"use client";

import { Maximize2, Minimize2, VideoOff, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/**
 * The demo clip, as a corner overlay that starts collapsed — ux-flow-spec §5.3:
 * "overlay video demo góc màn hình, thu gọn mặc định". It never takes the screen
 * away from the set you are doing.
 *
 * Muted and looping on purpose: the audio channel belongs to the coach cues and
 * the music, not to the demo.
 */
export function VideoGuideOverlay({
  exercise,
  expanded,
  onClose,
  onToggleExpanded,
}: {
  exercise: LiveExercise;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => undefined);
  }, [exercise.videoUrl]);

  return (
    <aside className="video-guide" data-expanded={expanded || undefined}>
      <header className="video-guide__bar">
        <span>{exercise.name}</span>
        <div className="video-guide__controls">
          <button
            aria-label={expanded ? "Shrink demo" : "Expand demo"}
            onClick={onToggleExpanded}
            type="button"
          >
            {expanded ? (
              <Minimize2 aria-hidden="true" size={15} />
            ) : (
              <Maximize2 aria-hidden="true" size={15} />
            )}
          </button>
          <button aria-label="Hide demo" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>
      </header>

      {exercise.videoUrl ? (
        <video
          className="video-guide__video"
          loop
          muted
          playsInline
          poster={exercise.thumbnailUrl}
          preload="metadata"
          ref={videoRef}
          src={exercise.videoUrl}
        />
      ) : (
        // The library has no clip for this movement yet — show the cues rather
        // than an empty black box.
        <div className="video-guide__fallback">
          <VideoOff aria-hidden="true" size={20} />
          <p>No demo clip yet.</p>
          {exercise.formCues.length > 0 ? <p>{exercise.formCues[0]}</p> : null}
        </div>
      )}
    </aside>
  );
}
