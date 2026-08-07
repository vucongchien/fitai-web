"use client";

import { CameraOff, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import type { ReactNode, RefObject } from "react";

import type { Pose } from "@/features/workout/domain/pose-metrics";
import type { CameraState } from "@/features/workout/model/use-camera-stream";
import { PoseOverlay } from "@/features/workout/ui/live/pose-overlay";

export function CameraStage({
  alert,
  children,
  mirrored = true,
  onFlip,
  pose,
  state,
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraState;
  pose: Pose | null;
  alert?: boolean;
  mirrored?: boolean;
  onFlip?: () => void;
  children?: ReactNode;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    height: 0,
    width: 0,
  });

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setDimensions({ height: video.videoHeight, width: video.videoWidth });
  }, []);

  return (
    <div
      className="camera-stage relative flex flex-col items-center justify-center w-64 h-64 md:w-72 md:h-72 mx-auto rounded-full bg-[var(--color-surface-subtle,#eceef0)] border-4 border-[var(--color-surface,#ffffff)] shadow-xl overflow-hidden"
      data-state={state}
    >
      <video
        className="camera-stage__video absolute inset-0 w-full h-full object-cover rounded-full"
        data-mirrored={mirrored || undefined}
        muted
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
        ref={videoRef}
      />

      <PoseOverlay
        alert={alert}
        mirrored={mirrored}
        pose={pose}
        sourceHeight={dimensions.height}
        sourceWidth={dimensions.width}
      />

      {state === "ready" ? null : (
        <div className="camera-stage__placeholder relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <CameraOff
            aria-hidden="true"
            size={26}
            className="text-[var(--color-text-muted,#50565c)] mb-2"
          />
          <p className="text-xs font-medium text-[var(--color-text-muted,#50565c)]">
            {state === "requesting"
              ? "Waiting for camera…"
              : (state === "denied"
                ? "Camera access denied."
                : "No camera detected.")}
          </p>
        </div>
      )}

      {onFlip && state === "ready" ? (
        <button
          aria-label="Switch camera"
          className="camera-stage__flip absolute bottom-3 right-3 z-20 p-2 rounded-full bg-[var(--color-surface,#ffffff)] text-[var(--color-text,#101214)] shadow-md hover:bg-[var(--color-surface-subtle,#eceef0)] transition-colors"
          onClick={onFlip}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
        </button>
      ) : null}

      {children}
    </div>
  );
}
