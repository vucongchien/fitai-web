"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// Camera stream management for AI branch with fallback handling
export type CameraState = "idle" | "requesting" | "ready" | "denied" | "unavailable";

export type FacingMode = "user" | "environment";

export function useCameraStream() {
  const [state, setState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [isCustomVideo, setIsCustomVideo] = useState(false);
  const [customVideoSrc, setCustomVideoSrc] = useState<string | null>(null);
  const isCustomVideoRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Current facing mode readable without callback dependency
  const facingModeRef = useRef<FacingMode>(facingMode);

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCustomVideoSrc(null);
  }, []);

  const stop = useCallback(() => {
    if (isCustomVideoRef.current) {
      return;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    cleanupObjectUrl();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
    }
    isCustomVideoRef.current = false;
    setIsCustomVideo(false);
    setState("idle");
  }, [cleanupObjectUrl]);

  const loadVideoFile = useCallback(
    (file: File) => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      cleanupObjectUrl();

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;

      isCustomVideoRef.current = true;
      setIsCustomVideo(true);
      setCustomVideoSrc(objectUrl);
      setState("ready");

      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
      }
    },
    [cleanupObjectUrl],
  );

  const start = useCallback(
    async (mode: FacingMode = facingModeRef.current): Promise<boolean> => {
      if (isCustomVideoRef.current) {
        return true;
      }
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return false;
      }

      cleanupObjectUrl();
      isCustomVideoRef.current = false;
      setIsCustomVideo(false);
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
          video.removeAttribute("src");
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
    },
    [cleanupObjectUrl],
  );

  const clearCustomVideo = useCallback(async () => {
    isCustomVideoRef.current = false;
    setIsCustomVideo(false);
    cleanupObjectUrl();
    if (videoRef.current) {
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    await start(facingModeRef.current);
  }, [cleanupObjectUrl, start]);

  const flip = useCallback(async () => {
    const nextMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    await start(nextMode);
  }, [start]);

  // Memoised so callers can safely put the controller in an effect's dependency
  // Array. A fresh object literal here re-ran those effects on every render.
  return useMemo(
    () => ({
      clearCustomVideo,
      customVideoSrc,
      facingMode,
      flip,
      isCustomVideo,
      loadVideoFile,
      start,
      state,
      stop,
      videoRef,
    }),
    [
      clearCustomVideo,
      customVideoSrc,
      facingMode,
      flip,
      isCustomVideo,
      loadVideoFile,
      start,
      state,
      stop,
    ],
  );
}

export type CameraController = ReturnType<typeof useCameraStream>;
