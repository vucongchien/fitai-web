// Coordinates real-time skeleton streaming with Go referee via WebTransport

import { EMPTY_TELEMETRY } from "@/features/workout/domain/motion-engine";
import type {
  MotionEngine,
  MotionEngineContext,
  MotionEventHandler,
  SetTelemetry,
} from "@/features/workout/domain/motion-engine";
import { WebTransportRefereeClient } from "@/features/workout/domain/webtransport-client";
import { isInferenceResponse } from "@/features/workout/model/inference-protocol";
import type { InferenceRequest } from "@/features/workout/model/inference-protocol";
import type { CueSeverity, MotionSpec, RepLogEntry } from "@/features/workout/model/live-session.types";
import {
  SoloChallengeType,
  type StreamSoloMatchTrackingResponse,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

/** Where scripts/copy-ort-assets.mjs puts the ORT runtime. */
const WASM_PATHS = "/ort/";

/** How long stopSet() waits for the worker before giving up on telemetry. */
const TELEMETRY_TIMEOUT_MS = 2000;

/** Minimum interval between WebTransport skeleton frames sent to backend (~20 FPS). */
const SKELETON_STREAM_INTERVAL_MS = 45;

// Backoff delays for re-opening dropped referee stream
const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000];

/** How long stopSet() waits for the referee's Submit ack carrying the final score. */
const SUBMIT_ACK_TIMEOUT_MS = 1200;

/** Reason sent with SoloTrackingAbort — one the Go referee classifies as an abort. */
const ABORT_REASON = "USER_FORFEITED";

export function supportsInferenceWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

// Shared singleton worker to avoid spawning duplicate WebGPU contexts
let sharedWorker: Worker | null = null;
let sharedWorkerInitKey = "";
let sharedWorkerInitPromise: Promise<void> | null = null;

function getOrCreateSharedWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(
      new URL("@/features/workout/model/inference.worker.ts", import.meta.url),
      { name: "fitai-inference", type: "module" },
    );
  }
  return sharedWorker;
}

export class WorkerMotionEngine implements MotionEngine {
  readonly kind = "onnx" as const;

  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private spec: MotionSpec | null = null;
  private onEvent: MotionEventHandler | null = null;
  private disposed = false;

  private refereeClient: WebTransportRefereeClient = new WebTransportRefereeClient();
  private isStreaming = false;
  private lastFrameSendTime = 0;
  private frameIndex = 0;
  private lastRepCount = 0;
  private setStartMs = 0;
  private recordedReps: RepLogEntry[] = [];
  private pendingRepErrors = new Set<string>();
  private totalErrorEvents = 0;
  private lastFormScore = 100;

  /** Stable per set so a reconnect resumes the same referee match. */
  private matchId = "";
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  /** First response after a reconnect re-bases the rep count. */
  private resyncPending = false;
  /** Reps counted before a reconnect the server could not restore. */
  private repOffset = 0;
  /** Errors present in the previous referee response — form-error events are edge-triggered. */
  private prevDetectedErrors = new Set<string>();
  private prevAudioCue = "";
  private enteredRepMotion = false;
  private reachedActiveDepth = false;
  private lastDepthWarningTime = 0;
  private frameScoreSum = 0;
  private frameScoreCount = 0;
  private submitResolve: ((score: number | null) => void) | null = null;
  private submitTimer: number | null = null;

  private rafId: number | null = null;
  /** True while the worker still owes us a `frame-done`. */
  private pending = false;
  private telemetryResolve: ((telemetry: SetTelemetry) => void) | null = null;
  private telemetryTimer: number | null = null;

  async prepare(context: MotionEngineContext): Promise<void> {
    if (!context.video) {
      throw new Error("WorkerMotionEngine needs a video element");
    }
    if (!context.spec) {
      throw new Error("WorkerMotionEngine needs a motion specification");
    }
    if (!supportsInferenceWorker()) {
      throw new Error("This browser cannot run pose tracking");
    }

    this.video = context.video;
    this.spec = context.spec;
    this.disposed = false;
    const { spec } = context;
    const worker = getOrCreateSharedWorker();
    this.worker = worker;

    const initKey = `${spec.onnxSkeletonUrl}:${WASM_PATHS}`;
    if (sharedWorkerInitKey !== initKey) {
      if (sharedWorkerInitPromise) {
        await sharedWorkerInitPromise.catch(() => {});
      }
      if (sharedWorkerInitKey !== initKey) {
        sharedWorkerInitPromise = new Promise<void>((resolve, reject) => {
          const settle = (error?: string) => {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
            sharedWorkerInitPromise = null;
            if (error) {
              sharedWorkerInitKey = "";
              reject(new Error(error));
            } else {
              sharedWorkerInitKey = initKey;
              resolve();
            }
          };
          const onMessage = (message: MessageEvent) => {
            if (!isInferenceResponse(message.data)) {
              return;
            }
            if (message.data.type === "ready") {
              settle();
            }
            if (message.data.type === "init-failed") {
              settle(message.data.message);
            }
          };
          const onError = () => settle("Pose worker failed to start");

          worker.addEventListener("message", onMessage);
          worker.addEventListener("error", onError);
          this.send({ spec, type: "init", wasmPaths: WASM_PATHS });
        });
        await sharedWorkerInitPromise;
      }
    }

    if (this.disposed) {
      throw new Error("WorkerMotionEngine disposed during prepare");
    }

    worker.removeEventListener("message", this.handleMessage);
    worker.addEventListener("message", this.handleMessage);
  }

  startCalibration(onEvent: MotionEventHandler): void {
    this.onEvent = onEvent;
    this.send({ mode: "calibration", type: "mode" });
    this.startLoop();
  }

  stopCalibration(): void {
    this.stopLoop();
    this.send({ mode: "idle", type: "mode" });
  }

  startSet(onEvent: MotionEventHandler): void {
    if (this.disposed || !this.worker || !this.spec) {
      return;
    }
    this.onEvent = onEvent;
    this.isStreaming = true;
    this.lastRepCount = 0;
    this.frameIndex = 0;
    this.lastFrameSendTime = 0;
    this.setStartMs = performance.now();
    this.recordedReps = [];
    this.pendingRepErrors.clear();
    this.totalErrorEvents = 0;
    this.lastFormScore = 100;
    this.reconnectAttempt = 0;
    this.resyncPending = false;
    this.repOffset = 0;
    this.prevDetectedErrors = new Set();
    this.prevAudioCue = "";
    this.enteredRepMotion = false;
    this.reachedActiveDepth = false;
    this.lastDepthWarningTime = 0;
    this.frameScoreSum = 0;
    this.frameScoreCount = 0;
    this.cancelReconnect();
    this.settleSubmit(null);

    // Connect to Go referee engine over WebTransport (HTTP/3) or WebSocket (TCP).
    // connectReferee() closes whatever stream the previous set left open.
    if (this.spec.exerciseId) {
      this.matchId = `live-${this.spec.exerciseId}-${Date.now()}`;
      this.connectReferee();
    }

    this.send({ mode: "set", type: "mode" });
    this.startLoop();
  }

  // Opens fresh client for current set's matchId
  private connectReferee(): void {
    const spec = this.spec;
    if (!spec || this.disposed || !this.isStreaming) {
      return;
    }
    const client = new WebTransportRefereeClient();
    this.refereeClient.close();
    this.refereeClient = client;
    const isCurrent = () => client === this.refereeClient && !this.disposed;

    const challengeType =
      spec.rep_type === "timed" || spec.exerciseId === "plank"
        ? SoloChallengeType.DURATION
        : SoloChallengeType.REPS;

    // The server sends its first status response right after Config, so the
    // flag must be set before connect() rather than in its `.then`.
    this.resyncPending = this.reconnectAttempt > 0;

    client
      .connect({
        cameraAngle: spec.recommendedCameraAngle || "auto",
        challengeType,
        exerciseId: spec.exerciseId,
        matchId: this.matchId,
        onClose: () => {
          if (isCurrent() && this.isStreaming) {
            console.warn("[WorkerMotionEngine] Referee stream dropped — reconnecting");
            this.scheduleReconnect();
          }
        },
        onError: (err) => console.warn("[RefereeClient] Stream warning:", err),
        onResponse: (resp) => {
          if (isCurrent()) {
            this.handleRefereeResponse(resp);
          }
        },
      })
      .catch((err) => {
        if (isCurrent()) {
          console.warn("[WorkerMotionEngine] Referee connection error:", err);
          this.scheduleReconnect();
        }
      });
  }

  private scheduleReconnect(): void {
    if (this.disposed || !this.isStreaming || this.reconnectTimer !== null) {
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempt];
    if (delay === undefined) {
      // Out of retries: stop pretending to count and hand the set to manual logging.
      this.refereeClient.close();
      this.onEvent?.({ reason: "referee-offline", type: "fallback" });
      return;
    }
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connectReferee();
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private severityFor(code: string): CueSeverity {
    const spec = this.spec;
    return (
      spec?.cues.find((cue) => cue.code === code)?.severity ??
      spec?.rules.find((rule) => rule.code === code)?.severity ??
      1
    );
  }

  private handleRefereeResponse(resp: StreamSoloMatchTrackingResponse): void {
    if (this.disposed) {
      return;
    }

    // Submit ack: carries the referee's average form score for the whole set.
    if (this.submitResolve && resp.isCompleted) {
      this.applyConfirmedValue(resp.myConfirmedValue, resp.currentAngle);
      this.settleSubmit(resp.myFormScore);
      return;
    }
    if (!this.isStreaming) {
      return;
    }

    // Any response proves the stream is healthy again.
    this.reconnectAttempt = 0;
    if (this.resyncPending) {
      this.resyncPending = false;
      // Without Redis the server cannot restore progress and restarts at 0;
      // keep the reps already counted instead of silently losing them.
      if (resp.myConfirmedValue + this.repOffset < this.lastRepCount) {
        this.repOffset = this.lastRepCount - resp.myConfirmedValue;
      }
    }

    if (resp.myFormScore > 0) {
      this.lastFormScore = resp.myFormScore;
      this.frameScoreSum += resp.myFormScore;
      this.frameScoreCount += 1;
    }

    // Form errors are edge-triggered: the referee repeats confirmed errors on
    // every frame (~20/s), which used to fire haptics and audit entries per frame.
    const rawErrors = resp.detectedErrors ?? [];
    const current = new Set<string>(rawErrors);
    for (const code of current) {
      if (!this.pendingRepErrors.has(code)) {
        this.pendingRepErrors.add(code);
        this.totalErrorEvents += 1;
      }
      if (!this.prevDetectedErrors.has(code)) {
        this.onEvent?.({
          code,
          message: code,
          severity: this.severityFor(code),
          source: "referee-error",
          type: "form-error",
        });
      }
    }
    this.prevDetectedErrors = current;

    const repCount = this.applyConfirmedValue(resp.myConfirmedValue, resp.currentAngle);

    // Biomechanical verification: Detect Incomplete / Half-reps (ROM < 70%)
    // If athlete starts transitioning into rep depth, but aborts back to rest without reaching active phase
    const phaseLower = (resp.repPhase || "").toLowerCase();
    if (phaseLower === "transition" || phaseLower === "inflection") {
      this.enteredRepMotion = true;
    } else if (phaseLower === "active") {
      this.enteredRepMotion = true;
      this.reachedActiveDepth = true;
    } else if (phaseLower === "rest" || phaseLower === "idle") {
      const now = Date.now();
      if (
        this.enteredRepMotion &&
        !this.reachedActiveDepth &&
        repCount === this.lastRepCount &&
        now - this.lastDepthWarningTime > 2500
      ) {
        this.lastDepthWarningTime = now;
        this.onEvent?.({
          code: "ERR_INCORRECT_DEPTH",
          message: "Chưa đủ biên độ, hãy hạ sâu hơn!",
          severity: 1,
          source: "referee-error",
          type: "form-error",
        });
      }
      this.enteredRepMotion = false;
      this.reachedActiveDepth = false;
    }

    // Real-time metrics
    this.frameIndex += 1;
    if (this.frameIndex === 1 || this.frameIndex % 15 === 0 || repCount > 0) {
      console.log(
        `[RefereeStream] frame=${this.frameIndex} ex=${this.spec?.exerciseId} phase=${resp.repPhase} angle=${Math.round(resp.currentAngle)}° reps=${repCount}`,
      );
    }
    this.onEvent?.({
      angle: Math.round(resp.currentAngle),
      detectedErrors: Array.from(current),
      endDeg: 0,
      frameIndex: this.frameIndex,
      metricName: "primary",
      phase: resp.repPhase || "active",
      repCount,
      rom: 0,
      startDeg: 0,
      type: "metrics",
    });

    // Vietnamese coaching voice line from the referee — free text, spoken only.
    if (resp.audioCue && resp.audioCue !== this.prevAudioCue) {
      this.onEvent?.({
        code: resp.audioCue,
        message: resp.audioCue,
        severity: 1,
        source: "coach-cue",
        type: "form-error",
      });
    }
    this.prevAudioCue = resp.audioCue ?? "";
  }

  /** Records newly confirmed reps; returns the effective (offset-adjusted) count. */
  private applyConfirmedValue(serverValue: number, currentAngle: number): number {
    const repCount = serverValue + this.repOffset;
    if (repCount > this.lastRepCount) {
      // TODO(rom): the referee does not stream ROM yet, so this is derived from
      // the form score and is NOT a real range-of-motion measurement.
      const romPercentage = Math.max(70, Math.min(100, Math.round(this.lastFormScore)));
      for (let r = this.lastRepCount + 1; r <= repCount; r++) {
        this.recordedReps.push({
          errorCodes: Array.from(this.pendingRepErrors),
          jointAngles: { primary: Math.round(currentAngle) },
          repNumber: r,
          romPercentage,
        });
      }
      this.pendingRepErrors.clear();
      this.lastRepCount = repCount;
      this.onEvent?.({
        count: repCount,
        counted: true,
        romPercentage,
        type: "rep",
      });
    }
    return Math.max(repCount, this.lastRepCount);
  }

  private settleSubmit(score: number | null): void {
    if (this.submitTimer !== null) {
      window.clearTimeout(this.submitTimer);
      this.submitTimer = null;
    }
    const resolve = this.submitResolve;
    this.submitResolve = null;
    resolve?.(score);
  }

  async stopSet(): Promise<SetTelemetry> {
    this.stopLoop();
    this.isStreaming = false;
    this.cancelReconnect();

    // Submit and wait (bounded) for the ack with the referee's final average score.
    const client = this.refereeClient;
    const submitAck = client.isConnected
      ? new Promise<number | null>((resolve) => {
          this.settleSubmit(null);
          this.submitResolve = resolve;
          this.submitTimer = window.setTimeout(
            () => this.settleSubmit(null),
            SUBMIT_ACK_TIMEOUT_MS,
          );
          client.submit().catch(() => this.settleSubmit(null));
        })
      : Promise.resolve<number | null>(null);

    const workerTelemetryPromise = this.worker
      ? new Promise<SetTelemetry>((resolve) => {
          this.settleTelemetry(EMPTY_TELEMETRY);
          this.telemetryResolve = resolve;
          this.send({ type: "stop-set" });
          this.telemetryTimer = window.setTimeout(
            () => this.settleTelemetry(EMPTY_TELEMETRY),
            TELEMETRY_TIMEOUT_MS,
          );
        })
      : Promise.resolve(EMPTY_TELEMETRY);

    const [submitScore, workerTelemetry] = await Promise.all([submitAck, workerTelemetryPromise]);
    client.close();

    return this.buildMergedTelemetry(workerTelemetry, submitScore);
  }

  private buildMergedTelemetry(
    workerTelemetry: SetTelemetry,
    submitScore: number | null,
  ): SetTelemetry {
    const countedReps = this.lastRepCount;
    const elapsedSec = Math.max(0.1, (performance.now() - this.setStartMs) / 1000);
    const averageRom =
      this.recordedReps.length > 0
        ? Math.round(
            this.recordedReps.reduce((sum, r) => sum + r.romPercentage, 0) /
              this.recordedReps.length,
          )
        : countedReps > 0
          ? 100
          : 0;
    // Prefer the referee's own set average (Submit ack); if the ack never came,
    // the mean of the per-frame scores it streamed is the same quantity.
    const formScore =
      submitScore !== null
        ? Math.round(submitScore)
        : this.frameScoreCount > 0
          ? Math.round(this.frameScoreSum / this.frameScoreCount)
          : null;

    return {
      averageRom,
      countedReps,
      errorCount: this.totalErrorEvents,
      formScore,
      reps: [...this.recordedReps],
      secondsPerRep: countedReps > 0 ? Number((elapsedSec / countedReps).toFixed(2)) : 0,
      validFrameRatio: workerTelemetry.validFrameRatio,
    };
  }

  /** Resolves the pending stopSet() caller, if any, and clears its timeout. */
  private settleTelemetry(telemetry: SetTelemetry): void {
    if (this.telemetryTimer !== null) {
      window.clearTimeout(this.telemetryTimer);
      this.telemetryTimer = null;
    }
    const resolve = this.telemetryResolve;
    this.telemetryResolve = null;
    resolve?.(telemetry);
  }

  dispose(): void {
    this.disposed = true;
    this.stopLoop();
    this.cancelReconnect();
    this.settleSubmit(null);
    if (this.isStreaming) {
      // Mid-set teardown (pain stop, leaving the screen): tell the referee
      // explicitly instead of leaving a DISCONNECTED session for 45s.
      void this.refereeClient.abortAndClose(ABORT_REASON);
    } else {
      this.refereeClient.close();
    }
    this.isStreaming = false;
    if (this.worker) {
      this.send({ mode: "idle", type: "mode" });
      this.worker.removeEventListener("message", this.handleMessage);
    }
    this.worker = null;
    this.video = null;
    this.spec = null;
    this.onEvent = null;
    this.settleTelemetry(EMPTY_TELEMETRY);
  }

  private handleMessage = (message: MessageEvent): void => {
    if (!isInferenceResponse(message.data)) {
      return;
    }
    const response = message.data;
    switch (response.type) {
      case "event": {
        // Forward pose event to UI for skeleton overlay (keeps pixel coordinates for canvas)
        this.onEvent?.(response.event);

        // If currently in an active set and skeleton was detected, stream normalized [0, 1] coords (x / sw, y / sh) to Go referee at ~20 FPS
        if (this.isStreaming && response.event.type === "pose" && response.event.pose) {
          const now = performance.now();
          if (now - this.lastFrameSendTime >= SKELETON_STREAM_INTERVAL_MS) {
            this.lastFrameSendTime = now;
            const sw = Math.max(1, response.event.pose.sourceWidth || this.video?.videoWidth || 1);
            const sh = Math.max(1, response.event.pose.sourceHeight || this.video?.videoHeight || 1);
            const normKeypoints = response.event.pose.keypoints.map((k) => ({
              score: k.score > 0.4 ? 1.0 : k.score,
              x: k.x / sw,
              y: k.y / sh,
            }));
            this.refereeClient.sendFrame(normKeypoints, Date.now()).catch(() => {});
          }
        }
        break;
      }
      case "frame-done": {
        this.pending = false;
        break;
      }
      case "telemetry": {
        this.settleTelemetry(response.telemetry);
        break;
      }
      default: {
        break;
      }
    }
  };

  private send(request: InferenceRequest): void {
    if (request.type === "frame") {
      this.worker?.postMessage(request, [request.bitmap]);
    } else {
      this.worker?.postMessage(request);
    }
  }

  private startLoop(): void {
    this.stopLoop();
    this.pending = false;
    let lastVideoTime = -1;
    const loop = () => {
      const video = this.video;
      if (!this.pending && video && video.videoWidth > 0 && video.videoHeight > 0) {
        const currentTime = video.currentTime;
        const isVideoFile = Boolean(video.src);
        // Avoid re-running ONNX on identical paused or unadvanced video frames
        if (!isVideoFile || (!video.paused && Math.abs(currentTime - lastVideoTime) > 0.001)) {
          lastVideoTime = currentTime;
          this.pending = true;
          createImageBitmap(video).then(
            (bitmap) => this.send({ bitmap, type: "frame" }),
            (err) => {
              console.warn("[AI Engine] createImageBitmap failed:", err);
              this.pending = false;
            },
          );
        }
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pending = false;
  }
}
