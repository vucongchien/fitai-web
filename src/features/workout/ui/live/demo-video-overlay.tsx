"use client";

import { X } from "lucide-react";
import { useCallback } from "react";

import { parseVideoSource } from "@/features/workout/domain/video-source-parser";

// Exercise demo clip overlay supporting YouTube embed and MP4
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
  const parsed = parseVideoSource(videoUrl);

  const closeBtnRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) return;
      node.focus();
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    },
    [onClose],
  );

  return (
    <div
      aria-label={`${name} demo`}
      aria-modal="true"
      className="demo-video cursor-pointer"
      role="dialog"
      onClick={onClose}
    >
      <div className="demo-video__panel cursor-default" onClick={(e) => e.stopPropagation()}>
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
          ref={closeBtnRef}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
}
