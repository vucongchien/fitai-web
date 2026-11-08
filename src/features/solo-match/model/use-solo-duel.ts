"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { speakSoloAudioCue, triggerSoloHaptic } from "@/features/solo-match/domain/solo-feedback";
import { SoloRefereeClient } from "@/features/solo-match/domain/solo-referee-client";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import type { Pose } from "@/features/workout/domain/pose-metrics";
import { supportsInferenceWorker } from "@/features/workout/domain/worker-motion-engine";
import { isInferenceResponse } from "@/features/workout/model/inference-protocol";
import type { MotionSpec } from "@/features/workout/model/live-session.types";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import {
  ParticipantStreamStatus,
  SoloChallengeType,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type { StreamSoloMatchTrackingResponse } from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

export type SoloStreamStatusLabel =
  | "WAITING"
  | "ACTIVE"
  | "SPECTATING"
  | "COMPLETED"
  | "DISCONNECTED";

export interface SoloDuelLiveState {
  connectionPhase: "connecting" | "connected" | "reconnecting" | "ended" | "error";
  currentAngle: number;
  detectedErrors: string[];
  isSettling: boolean;
  lastCoachCue: string;
  matchEnded: boolean;
  myFormScore: number;
  myStatus: SoloStreamStatusLabel;
  myValue: number;
  opponentFormScore: number;
  opponentStatus: SoloStreamStatusLabel;
  opponentValue: number;
  personDetected: boolean;
  reconnectAttempt: number;
  remainingCeilingSeconds: number;
  repPhase: string;
}

const FRAME_STREAM_INTERVAL_MS = 50;
const WASM_PATHS = "/ort/";

function mapStreamStatus(status: ParticipantStreamStatus): SoloStreamStatusLabel {
  switch (status) {
    case ParticipantStreamStatus.ACTIVE:
      return "ACTIVE";
    case ParticipantStreamStatus.SPECTATING:
      return "SPECTATING";
    case ParticipantStreamStatus.COMPLETED:
      return "COMPLETED";
    case ParticipantStreamStatus.DISCONNECTED:
      return "DISCONNECTED";
    case ParticipantStreamStatus.WAITING:
    case ParticipantStreamStatus.UNSPECIFIED:
    default:
      return "WAITING";
  }
}

export interface UseSoloDuelOptions {
  match: SoloMatchSummary | null;
  onMatchEnded?: (matchId: string) => void;
  onnxSkeletonUrl: string;
  planId?: string;
  recommendedCameraAngle: string;
}

export function useSoloDuel({
  match,
  onMatchEnded,
  onnxSkeletonUrl,
  planId,
  recommendedCameraAngle,
}: UseSoloDuelOptions) {
  const camera = useCameraStream();
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const onMatchEndedRef = useRef(onMatchEnded);
  onMatchEndedRef.current = onMatchEnded;

  const [pose, setPose] = useState<Pose | null>(null);
  const [liveState, setLiveState] = useState<SoloDuelLiveState>(() => ({
    connectionPhase: "connecting",
    currentAngle: 0,
    detectedErrors: [],
    isSettling: false,
    lastCoachCue: "",
    matchEnded: match?.status === "COMPLETED" || match?.status === "CANCELLED",
    myFormScore: 100,
    myStatus: "WAITING",
    myValue: 0,
    opponentFormScore: 100,
    opponentStatus: "WAITING",
    opponentValue: 0,
    personDetected: false,
    reconnectAttempt: 0,
    remainingCeilingSeconds: match?.ceilingSeconds ?? 300,
    repPhase: "idle",
  }));

  const refereeClientRef = useRef<SoloRefereeClient | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingFrameRef = useRef(false);
  const lastFrameSentMsRef = useRef(0);
  const prevMyValueRef = useRef(0);
  const prevAudioCueRef = useRef("");
  const matchEndedHandledRef = useRef(false);
  const isSpectatingOrDoneRef = useRef(false);
  const settlementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPoseWorkerLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingFrameRef.current = false;
    if (workerRef.current) {
      try {
        workerRef.current.postMessage({ mode: "idle", type: "mode" });
        workerRef.current.terminate();
      } catch {
        // ignore termination errors
      }
      workerRef.current = null;
    }
    setPose(null);
  }, []);

  // Connect Referee Stream & Camera + Pose Worker
  const subscribeSession = useCallback(() => {
    if (!match || match.status === "COMPLETED" || match.status === "CANCELLED") {
      return () => {};
    }

    let cancelled = false;
    matchEndedHandledRef.current = false;
    isSpectatingOrDoneRef.current = false;

    const client = new SoloRefereeClient();
    refereeClientRef.current = client;

    const handleRefereeResponse = (resp: StreamSoloMatchTrackingResponse) => {
      if (cancelled) {
        return;
      }

      if (resp.myConfirmedValue > prevMyValueRef.current) {
        prevMyValueRef.current = resp.myConfirmedValue;
        triggerSoloHaptic(35);
      }

      if (resp.audioCue && resp.audioCue !== prevAudioCueRef.current) {
        prevAudioCueRef.current = resp.audioCue;
        speakSoloAudioCue(resp.audioCue);
      }

      const mappedMyStatus = mapStreamStatus(resp.myStatus);
      const mappedOppStatus = mapStreamStatus(resp.opponentStatus);

      if (
        (mappedMyStatus === "SPECTATING" || mappedMyStatus === "COMPLETED" || resp.isCompleted) &&
        !isSpectatingOrDoneRef.current
      ) {
        isSpectatingOrDoneRef.current = true;
        stopPoseWorkerLoop();
        cameraRef.current.stop();
      }

      setLiveState((prev) => ({
        connectionPhase: resp.matchEnded ? "ended" : "connected",
        currentAngle: Math.round(resp.currentAngle || 0),
        detectedErrors: resp.detectedErrors ?? [],
        isSettling: prev.isSettling || resp.matchEnded,
        lastCoachCue: resp.audioCue || prev.lastCoachCue,
        matchEnded: resp.matchEnded,
        myFormScore: resp.myFormScore > 0 ? Math.round(resp.myFormScore) : prev.myFormScore,
        myStatus: resp.isCompleted && mappedMyStatus === "ACTIVE" ? "SPECTATING" : mappedMyStatus,
        myValue: resp.myConfirmedValue,
        opponentFormScore:
          resp.opponentFormScore > 0 ? Math.round(resp.opponentFormScore) : prev.opponentFormScore,
        opponentStatus: mappedOppStatus,
        opponentValue: resp.opponentValue,
        personDetected: resp.personDetected,
        reconnectAttempt: 0,
        remainingCeilingSeconds:
          resp.remainingCeilingSeconds > 0
            ? resp.remainingCeilingSeconds
            : prev.remainingCeilingSeconds,
        repPhase: resp.repPhase || prev.repPhase,
      }));

      if (resp.matchEnded && !matchEndedHandledRef.current) {
        matchEndedHandledRef.current = true;
        triggerSoloHaptic([60, 40, 100]);
        stopPoseWorkerLoop();
        cameraRef.current.stop();
        setLiveState((prev) => ({
          ...prev,
          connectionPhase: "ended",
          isSettling: true,
          matchEnded: true,
        }));
        if (settlementTimerRef.current) {
          clearTimeout(settlementTimerRef.current);
        }
        settlementTimerRef.current = setTimeout(() => {
          onMatchEndedRef.current?.(match.matchId);
        }, 1500);
      }
    };

    const challengeType =
      match.challengeType === "DURATION" ? SoloChallengeType.DURATION : SoloChallengeType.REPS;

    void client
      .connect({
        cameraAngle: recommendedCameraAngle || "side",
        challengeType,
        exerciseId: match.exerciseId || "push_up",
        matchId: match.matchId,
        planId: planId || `solo-${match.matchId}`,
        onClose: () => {
          if (!cancelled && !matchEndedHandledRef.current) {
            setLiveState((prev) => ({
              ...prev,
              connectionPhase: prev.matchEnded ? "ended" : "error",
            }));
          }
        },
        onError: () => {
          // Handled via reconnect callback or onClose
        },
        onReconnecting: (attempt) => {
          if (!cancelled) {
            setLiveState((prev) => ({
              ...prev,
              connectionPhase: "reconnecting",
              reconnectAttempt: attempt,
            }));
          }
        },
        onResponse: handleRefereeResponse,
        timeCeilingSeconds: match.ceilingSeconds || 300,
      })
      .then(() => {
        if (!cancelled) {
          setLiveState((prev) => ({
            ...prev,
            connectionPhase:
              prev.connectionPhase === "connecting" ? "connected" : prev.connectionPhase,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveState((prev) => ({
            ...prev,
            connectionPhase: "reconnecting",
          }));
        }
      });

    // Start camera and ONNX pose worker
    void (async () => {
      const started = await cameraRef.current.start("user");
      if (!started || cancelled || !supportsInferenceWorker()) {
        return;
      }

      try {
        const worker = new Worker(
          new URL("@/features/workout/model/inference.worker.ts", import.meta.url),
          { name: "fitai-solo-inference", type: "module" },
        );
        workerRef.current = worker;

        const spec: MotionSpec = {
          cueCooldownSec: {},
          cues: [],
          dialogueEngineUrl: "",
          exerciseId: match.exerciseId || "push_up",
          localRulesUrl: "",
          onnxDetectorUrl: "",
          onnxSkeletonUrl: onnxSkeletonUrl || "/models/yolo11n-pose.onnx",
          recommendedCameraAngle: recommendedCameraAngle || "side",
          rep_type: match.challengeType === "DURATION" ? "timed" : "rep",
          romRange: {
            endDeg: 90,
            joints: ["left_shoulder", "left_elbow", "left_wrist"],
            startDeg: 170,
          },
          rules: [],
        };

        worker.onmessage = (evt: MessageEvent) => {
          if (cancelled || !isInferenceResponse(evt.data)) {
            return;
          }
          const msg = evt.data;
          if (msg.type === "ready") {
            worker.postMessage({ mode: "set", type: "mode" });
            let lastVideoTime = -1;
            const loop = () => {
              if (cancelled || isSpectatingOrDoneRef.current) {
                return;
              }
              const video = cameraRef.current.videoRef.current;
              if (
                !pendingFrameRef.current &&
                video &&
                video.videoWidth > 0 &&
                video.videoHeight > 0
              ) {
                const currentTime = video.currentTime;
                const isVideoFile = Boolean(video.src);
                if (
                  !isVideoFile ||
                  (!video.paused && Math.abs(currentTime - lastVideoTime) > 0.001)
                ) {
                  lastVideoTime = currentTime;
                  pendingFrameRef.current = true;
                  createImageBitmap(video).then(
                    (bitmap) => {
                      if (!cancelled && workerRef.current) {
                        workerRef.current.postMessage({ bitmap, type: "frame" }, [bitmap]);
                      } else {
                        bitmap.close();
                      }
                    },
                    () => {
                      pendingFrameRef.current = false;
                    },
                  );
                }
              }
              rafIdRef.current = requestAnimationFrame(loop);
            };
            rafIdRef.current = requestAnimationFrame(loop);
          } else if (msg.type === "frame-done") {
            pendingFrameRef.current = false;
          } else if (msg.type === "event" && msg.event.type === "pose") {
            const detectedPose = msg.event.pose;
            setPose(detectedPose);
            if (detectedPose && !isSpectatingOrDoneRef.current) {
              const now = performance.now();
              if (now - lastFrameSentMsRef.current >= FRAME_STREAM_INTERVAL_MS) {
                lastFrameSentMsRef.current = now;
                const video = cameraRef.current.videoRef.current;
                const sw = Math.max(1, detectedPose.sourceWidth || video?.videoWidth || 1);
                const sh = Math.max(1, detectedPose.sourceHeight || video?.videoHeight || 1);
                const normKeypoints = detectedPose.keypoints.map((k) => ({
                  score: k.score > 0.4 ? 1.0 : k.score,
                  x: k.x / sw,
                  y: k.y / sh,
                }));
                void refereeClientRef.current?.sendFrame(
                  normKeypoints,
                  Date.now(),
                  recommendedCameraAngle || "side",
                );
              }
            }
          }
        };

        worker.postMessage({ spec, type: "init", wasmPaths: WASM_PATHS });
      } catch {
        // Worker unavailable in environment; camera and referee connection remain active
      }
    })();

    return () => {
      cancelled = true;
      if (settlementTimerRef.current) {
        clearTimeout(settlementTimerRef.current);
        settlementTimerRef.current = null;
      }
      stopPoseWorkerLoop();
      cameraRef.current.stop();
      client.close();
      refereeClientRef.current = null;
    };
  }, [
    match?.matchId,
    match?.status,
    match?.exerciseId,
    match?.challengeType,
    match?.ceilingSeconds,
    onnxSkeletonUrl,
    planId,
    recommendedCameraAngle,
    stopPoseWorkerLoop,
  ]);

  useSyncExternalStore(
    subscribeSession,
    () => true,
    () => true,
  );

  // Second-by-second countdown interval for match ceiling timer
  const isCeilingTicking = !liveState.matchEnded && liveState.myStatus !== "COMPLETED";
  const subscribeCeilingTimer = useCallback(() => {
    if (!isCeilingTicking) {
      return () => {};
    }
    const timer = setInterval(() => {
      setLiveState((prev) => {
        if (prev.remainingCeilingSeconds <= 0 || prev.matchEnded) {
          return prev;
        }
        return {
          ...prev,
          remainingCeilingSeconds: prev.remainingCeilingSeconds - 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCeilingTicking]);

  useSyncExternalStore(
    subscribeCeilingTimer,
    () => liveState.remainingCeilingSeconds,
    () => 300,
  );

  const submitScore = useCallback(async () => {
    isSpectatingOrDoneRef.current = true;
    stopPoseWorkerLoop();
    camera.stop();
    setLiveState((prev) => ({
      ...prev,
      myStatus: "SPECTATING",
    }));
    await refereeClientRef.current?.submit();
  }, [camera, stopPoseWorkerLoop]);

  const forfeitMatch = useCallback(async () => {
    isSpectatingOrDoneRef.current = true;
    stopPoseWorkerLoop();
    camera.stop();
    await refereeClientRef.current?.abort("USER_FORFEITED");
    refereeClientRef.current?.close();
    if (match?.matchId) {
      onMatchEnded?.(match.matchId);
    }
  }, [camera, match?.matchId, onMatchEnded, stopPoseWorkerLoop]);

  return {
    camera,
    forfeitMatch,
    liveState,
    pose,
    submitScore,
  };
}
