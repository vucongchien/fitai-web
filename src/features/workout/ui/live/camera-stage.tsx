"use client";

import { ArrowLeftRight, CameraOff, RefreshCw, Upload, Video, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

import type { Pose } from "@/features/workout/domain/pose-metrics";
import type { CameraState } from "@/features/workout/model/use-camera-stream";
import { PoseOverlay } from "@/features/workout/ui/live/pose-overlay";

export function CameraStage({
  alert,
  children,
  customVideoSrc,
  isCustomVideo,
  mirrored = false,
  onClearCustomVideo,
  onFlip,
  onUploadVideo,
  pose,
  state,
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraState;
  pose: Pose | null;
  alert?: boolean;
  mirrored?: boolean;
  isCustomVideo?: boolean;
  customVideoSrc?: string | null;
  onFlip?: () => void;
  onUploadVideo?: (file: File) => void;
  onClearCustomVideo?: () => void;
  onOpenRuleModal?: () => void;
  children?: ReactNode;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    height: 0,
    width: 0,
  });
  const [isMirrored, setIsMirrored] = useState(mirrored);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal mirrored state if prop changes
  useEffect(() => {
    setIsMirrored(mirrored);
  }, [mirrored]);

  const activeMirrored = isCustomVideo ? false : isMirrored;

  const safePlay = useCallback((video: HTMLVideoElement) => {
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        void playPromise.catch(() => {});
      }
    } catch {
      // Ignore synchronous play errors
    }
  }, []);

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setDimensions({ height: video.videoHeight, width: video.videoWidth });
      }
      safePlay(video);
    },
    [safePlay],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUploadVideo) {
        onUploadVideo(file);
      }
    },
    [onUploadVideo],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (video && customVideoSrc) {
      safePlay(video);
    }
  }, [customVideoSrc, safePlay, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const syncDimensions = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setDimensions({ height: video.videoHeight, width: video.videoWidth });
      }
      if (video.paused && customVideoSrc) {
        safePlay(video);
      }
    };
    syncDimensions();
    video.addEventListener("loadedmetadata", syncDimensions);
    video.addEventListener("canplay", syncDimensions);
    video.addEventListener("resize", syncDimensions);
    video.addEventListener("playing", syncDimensions);
    return () => {
      video.removeEventListener("loadedmetadata", syncDimensions);
      video.removeEventListener("canplay", syncDimensions);
      video.removeEventListener("resize", syncDimensions);
      video.removeEventListener("playing", syncDimensions);
    };
  }, [customVideoSrc, videoRef]);

  return (
    <div
      className="camera-stage relative flex flex-col items-center justify-center w-full h-full min-h-[360px] md:min-h-[480px] rounded-2xl bg-black shadow-xl overflow-hidden"
      data-state={state}
    >
      <video
        autoPlay
        className="camera-stage__video absolute inset-0 w-full h-full object-contain rounded-2xl"
        data-mirrored={activeMirrored ? "true" : undefined}
        loop
        muted
        onCanPlay={handleLoadedMetadata}
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
        ref={videoRef}
        src={customVideoSrc || undefined}
        style={{ transform: activeMirrored ? "scaleX(-1)" : "none" }}
      />

      <PoseOverlay
        alert={alert}
        mirrored={activeMirrored}
        pose={pose}
        sourceHeight={dimensions.height}
        sourceWidth={dimensions.width}
      />

      {/* Top Controls: Custom Video Badge OR Upload Video Button */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {onUploadVideo && !isCustomVideo ? (
          <>
            <input
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <button
              aria-label="Upload video for tracking"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg text-xs font-semibold backdrop-blur-md active:scale-95 transition-all border border-slate-200"
              onClick={() => fileInputRef.current?.click()}
              title="Upload video file from your device for AI tracking & rep counting"
              type="button"
            >
              <Upload aria-hidden="true" className="text-emerald-600" size={15} />
              <span>Upload Video</span>
            </button>
          </>
        ) : null}

        {isCustomVideo ? (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/20">
            <Video className="text-emerald-400" size={14} />
            <span>Tracking from Video</span>
            {onClearCustomVideo ? (
              <button
                aria-label="Remove custom video"
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                onClick={onClearCustomVideo}
                title="Cancel video and return to webcam"
                type="button"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {state === "ready" || isCustomVideo ? null : (
        <div className="camera-stage__placeholder relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <CameraOff
            aria-hidden="true"
            className="text-[var(--color-text-muted,#50565c)] mb-2"
            size={26}
          />
          <p className="text-xs font-medium text-[var(--color-text-muted,#50565c)]">
            {state === "requesting"
              ? "Waiting for camera…"
              : state === "denied"
                ? "Camera access denied."
                : "No camera detected."}
          </p>
        </div>
      )}

      {/* Bottom Right Controls (Mirror Toggle & Flip Camera) */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        {!isCustomVideo && state === "ready" ? (
          <button
            aria-label={activeMirrored ? "Tắt lật gương camera" : "Bật lật gương camera"}
            aria-pressed={activeMirrored}
            className={`camera-stage__mirror p-2.5 rounded-full shadow-md backdrop-blur-md active:scale-95 transition-all ${
              activeMirrored
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-[var(--color-surface,#ffffff)] text-[var(--color-text,#101214)] hover:bg-[var(--color-surface-subtle,#eceef0)]"
            }`}
            onClick={() => setIsMirrored((prev) => !prev)}
            title={activeMirrored ? "Đang bật lật gương (Bấm để tắt)" : "Đang tắt lật gương (Bấm để bật)"}
            type="button"
          >
            <ArrowLeftRight aria-hidden="true" size={16} />
          </button>
        ) : null}

        {onFlip && !isCustomVideo && state === "ready" ? (
          <button
            aria-label="Switch camera"
            className="camera-stage__flip p-2.5 rounded-full bg-[var(--color-surface,#ffffff)] text-[var(--color-text,#101214)] shadow-md hover:bg-[var(--color-surface-subtle,#eceef0)] active:scale-95 transition-all"
            onClick={onFlip}
            title="Đổi camera trước / sau"
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} />
          </button>
        ) : null}
      </div>

      {children}
    </div>
  );
}
