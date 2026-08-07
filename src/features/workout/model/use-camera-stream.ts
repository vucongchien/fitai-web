"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Camera access for the AI branch.
 *
 * §6 Data requires a >= 720p / 30fps stream; Assumption-02 allows for devices
 * where the camera simply is not available. Every failure path is soft: the
 * caller falls back to the manual branch instead of showing an error wall
 * (ux-flow-spec §5.3).
 */
export type CameraState = "idle" | "requesting" | "ready" | "denied" | "unavailable";

export type FacingMode = "user" | "environment";

export function useCameraStream() {
  const [state, setState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * The current facing mode, readable without making it a callback dependency.
   *
   * `start` used to close over the `facingMode` *state*, so every successful
   * start produced a new `start` — and therefore a new controller object — which
   * re-triggered the caller's camera effect, which called `start` again. That
   * loop restarted the camera ~140 times a second and was visible as the screen
   * flickering. A ref keeps the callbacks referentially stable.
   */
  const facingModeRef = useRef<FacingMode>(facingMode);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }, []);

  const start = useCallback(async (mode: FacingMode = facingModeRef.current): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return false;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: mode,
          frameRate: { ideal: 30 },
          height: { ideal: 720 },
          width: { ideal: 1280 },
        },
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      facingModeRef.current = mode;
      setFacingMode(mode);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        await video.play().catch(() => {});
      }
      setState("ready");
      return true;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      return false;
    }
  }, []);

  const flip = useCallback(async () => {
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    await start(nextMode);
  }, [start]);

  // Free the camera when the screen goes away — the light should never stay on.
  useEffect(() => stop, [stop]);

  // Memoised so callers can safely put the controller in an effect's dependency
  // Array. A fresh object literal here re-ran those effects on every render.
  return useMemo(
    () => ({ state, facingMode, videoRef, start, stop, flip }),
    [facingMode, flip, start, state, stop],
  );
}

export type CameraController = ReturnType<typeof useCameraStream>;
