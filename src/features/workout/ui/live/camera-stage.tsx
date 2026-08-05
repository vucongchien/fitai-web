"use client";

import { CameraOff, RefreshCw } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import type { Pose } from "@/features/workout/domain/pose-metrics";
import type { CameraState } from "@/features/workout/model/use-camera-stream";
import { PoseOverlay } from "@/features/workout/ui/live/pose-overlay";

/**
 * The camera surface for the AI branch: the live feed, the skeleton overlay, and
 * whatever panel the current step needs (calibration or the tracking HUD).
 *
 * The <video> element stays mounted across calibration and set tracking because
 * the motion engine holds a reference to it.
 */
export function CameraStage({
  alert,
  children,
  onFlip,
  pose,
  state,
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraState;
  pose: Pose | null;
  alert?: boolean;
  onFlip?: () => void;
  children?: ReactNode;
}) {
  const video = videoRef.current;
  const mirrored = true;

  return (
    <div className="camera-stage" data-state={state}>
      <video
        className="camera-stage__video"
        data-mirrored={mirrored || undefined}
        muted
        playsInline
        ref={videoRef}
      />

      <PoseOverlay
        alert={alert}
        mirrored={mirrored}
        pose={pose}
        sourceHeight={video?.videoHeight ?? 0}
        sourceWidth={video?.videoWidth ?? 0}
      />

      {state !== "ready" ? (
        <div className="camera-stage__placeholder">
          <CameraOff aria-hidden="true" size={26} />
          <p>
            {state === "requesting"
              ? "Waiting for the camera…"
              : state === "denied"
                ? "Camera access is off for this site."
                : "No camera available on this device."}
          </p>
        </div>
      ) : null}

      {onFlip && state === "ready" ? (
        <button aria-label="Switch camera" className="camera-stage__flip" onClick={onFlip} type="button">
          <RefreshCw aria-hidden="true" size={17} />
        </button>
      ) : null}

      {children}
    </div>
  );
}
