"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * The exercise demo clip, played large over the live screen.
 *
 * The inline media on the live screen is a small looping preview; this is for
 * "wait, how does that actually go?" mid-set. It pauses nothing and logs
 * nothing — closing it returns to a set that never stopped running.
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
        <video
          // Controls on: this one is for studying the movement, so scrubbing back
          // over the hard part is the whole point.
          autoPlay
          className="demo-video__player"
          controls
          loop
          muted
          playsInline
          poster={posterUrl}
          src={videoUrl}
        />

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
