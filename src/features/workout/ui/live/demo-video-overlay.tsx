"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { parseVideoSource } from "@/features/workout/domain/video-source-parser";

/**
 * The exercise demo clip, played large over the live screen.
 * Supports both YouTube Embed and Direct MP4 files.
 */
export function DemoVideoOverlay({
  name,
  onClose,
  posterUrl,
  videoUrl,
}: {
  videoUrl: string;
  posterUrl?: string;
  name: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const parsed = parseVideoSource(videoUrl);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div aria-label={`${name} demo`} aria-modal="true" className="demo-video" role="dialog">
      <div className="demo-video__panel">
        {parsed.type === "youtube" ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="demo-video__player w-full h-full border-0 aspect-video"
            src={parsed.embedUrl}
            title={`${name} Demo Video`}
          />
        ) : (
          <video
            autoPlay
            className="demo-video__player"
            controls
            loop
            muted
            playsInline
            poster={posterUrl}
            src={parsed.directUrl || videoUrl}
          />
        )}

        <button
          aria-label="Close video"
          className="demo-video__close"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
}
