// Coordinates off-main-thread ONNX pose inference and Edge biomechanical refereeing

import { EMPTY_TELEMETRY } from "@/features/workout/domain/motion-engine";
import type {
  MotionEngine,
  MotionEngineContext,
  MotionEventHandler,
  SetTelemetry,
} from "@/features/workout/domain/motion-engine";
import { isInferenceResponse } from "@/features/workout/model/inference-protocol";
import type { InferenceRequest } from "@/features/workout/model/inference-protocol";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

const WASM_PATHS = "/ort/";
const TELEMETRY_TIMEOUT_MS = 2000;

export function supportsInferenceWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

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

  private rafId: number | null = null;
  private pending = false;
  private telemetryResolve: ((telemetry: SetTelemetry) => void) | null = null;
  private telemetryTimer: number | null = null;

  constructor(private readonly fallbackOnnxUrl?: string) {}

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

    const effectiveSpec: MotionSpec = this.fallbackOnnxUrl
      ? { ...context.spec, onnxSkeletonUrl: this.fallbackOnnxUrl }
      : context.spec;

    this.video = context.video;
    this.spec = effectiveSpec;
    this.disposed = false;
    const worker = getOrCreateSharedWorker();
    this.worker = worker;

    const initKey = `${effectiveSpec.onnxSkeletonUrl}:${WASM_PATHS}`;
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
          this.send({ spec: effectiveSpec, type: "init", wasmPaths: WASM_PATHS });
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
    this.send({ mode: "set", spec: this.spec, type: "mode" });
    this.startLoop();
  }

  async stopSet(): Promise<SetTelemetry> {
    this.stopLoop();
    if (!this.worker) {
      return EMPTY_TELEMETRY;
    }
    return new Promise<SetTelemetry>((resolve) => {
      this.settleTelemetry(EMPTY_TELEMETRY);
      this.telemetryResolve = resolve;
      this.send({ type: "stop-set" });
      this.telemetryTimer = window.setTimeout(
        () => this.settleTelemetry(EMPTY_TELEMETRY),
        TELEMETRY_TIMEOUT_MS,
      );
    });
  }

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
        this.onEvent?.(response.event);
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
    let lastVideoTime = -1;
    const loop = () => {
      const video = this.video;
      if (!this.pending && video && video.videoWidth > 0 && video.videoHeight > 0) {
        const currentTime = video.currentTime;
        const isVideoFile = Boolean(video.src);
        if (!isVideoFile || (!video.paused && Math.abs(currentTime - lastVideoTime) > 0.001)) {
          lastVideoTime = currentTime;
          this.pending = true;
          createImageBitmap(video).then(
            (bitmap) => {
              if (this.disposed || this.rafId === null) {
                bitmap.close?.();
                this.pending = false;
                return;
              }
              this.send({ bitmap, type: "frame" });
            },
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
  }
}
