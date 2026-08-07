/**
 * The main-thread half of pose tracking.
 *
 * Replaces OnnxMotionEngine, whose inference ran inside a requestAnimationFrame
 * loop and blocked the UI thread for the duration of every frame. This class does
 * only two cheap things per frame — createImageBitmap (async, GPU-side) and
 * postMessage of a transferable — and lets inference.worker.ts do the rest.
 *
 * Backpressure: exactly one frame is in flight. `pending` gates the rAF loop, so
 * a device that infers at 8fps sends 8 frames a second rather than queueing 60.
 *
 * The engine falls back by rejecting `prepare()`. useMotionEngine already catches
 * that and resolves a manual engine instead, so a device without OffscreenCanvas
 * or Worker support degrades to hand logging rather than a blank screen.
 */

import { EMPTY_TELEMETRY } from '@/features/workout/domain/motion-engine';
import type { MotionEngine, MotionEngineContext, MotionEventHandler, SetTelemetry } from '@/features/workout/domain/motion-engine';
import { isInferenceResponse } from '@/features/workout/model/inference-protocol';
import type { InferenceRequest } from '@/features/workout/model/inference-protocol';

/** Where scripts/copy-ort-assets.mjs puts the ORT runtime. */
const WASM_PATHS = "/ort/";

/** How long stopSet() waits for the worker before giving up on telemetry. */
const TELEMETRY_TIMEOUT_MS = 2000;

export function supportsInferenceWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

export class WorkerMotionEngine implements MotionEngine {
  readonly kind = "onnx" as const;

  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private onEvent: MotionEventHandler | null = null;

  private rafId: number | null = null;
  /** True while the worker still owes us a `frame-done`. */
  private pending = false;
  private telemetryResolve: ((telemetry: SetTelemetry) => void) | null = null;
  private telemetryTimer: number | null = null;

  async prepare(context: MotionEngineContext): Promise<void> {
    if (!context.video) {throw new Error("WorkerMotionEngine needs a video element");}
    if (!context.spec) {throw new Error("WorkerMotionEngine needs a motion specification");}
    if (!supportsInferenceWorker()) {throw new Error("This browser cannot run pose tracking");}

    this.video = context.video;
    const {spec} = context;
    const worker = new Worker(
      new URL("@/features/workout/model/inference.worker.ts", import.meta.url),
      { name: "fitai-inference", type: "module" },
    );
    this.worker = worker;

    await new Promise<void>((resolve, reject) => {
      const settle = (error?: string) => {
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        if (error) {
          // Prepare() rejects here and the caller never gets a handle to this
          // Engine, so nothing would ever call dispose() — tear the worker down
          // Now or a failed model load leaks a thread per attempt.
          worker.terminate();
          this.worker = null;
          reject(new Error(error));
        } else {
          resolve();
        }
      };
      const onMessage = (message: MessageEvent) => {
        if (!isInferenceResponse(message.data)) {return;}
        if (message.data.type === "ready") {settle();}
        if (message.data.type === "init-failed") {settle(message.data.message);}
      };
      const onError = () => settle("Pose worker failed to start");

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      this.send({ spec, type: "init", wasmPaths: WASM_PATHS });
    });

    // Only now attach the long-lived listener, so the init handshake above is
    // Not competing with it for the `ready` message.
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
    this.onEvent = onEvent;
    this.send({ mode: "set", type: "mode" });
    this.startLoop();
  }

  async stopSet(): Promise<SetTelemetry> {
    this.stopLoop();
    if (!this.worker) {return EMPTY_TELEMETRY;}
    // A second stopSet() before the first answers would otherwise strand the
    // Earlier promise, since telemetryResolve holds only one caller.
    this.settleTelemetry(EMPTY_TELEMETRY);

    return await new Promise<SetTelemetry>((resolve) => {
      this.telemetryResolve = resolve;
      this.send({ type: "stop-set" });
      // A worker that has died would hang the set review forever.
      this.telemetryTimer = window.setTimeout(
        () => this.settleTelemetry(EMPTY_TELEMETRY),
        TELEMETRY_TIMEOUT_MS,
      );
    });
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
    this.stopLoop();
    // No `dispose` message: terminate() kills the worker before it could handle
    // One, and tearing the thread down releases the ORT sessions and the frame
    // Buffer anyway. Posting it would only read as if it did something.
    this.worker?.removeEventListener("message", this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
    this.video = null;
    this.onEvent = null;
    // Unblocks anyone awaiting stopSet() when the session is torn down mid-set.
    this.settleTelemetry(EMPTY_TELEMETRY);
  }

  private handleMessage = (message: MessageEvent): void => {
    if (!isInferenceResponse(message.data)) {return;}
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
    if (request.type === "frame") {this.worker?.postMessage(request, [request.bitmap]);}
    else {this.worker?.postMessage(request);}
  }

  private startLoop(): void {
    this.stopLoop();
    this.pending = false;
    const loop = () => {
      const {video} = this;
      if (!this.pending && video && video.videoWidth > 0 && video.videoHeight > 0) {
        this.pending = true;
        createImageBitmap(video).then(
          (bitmap) => this.send({ bitmap, type: "frame" }),
          () => {
            this.pending = false;
          },
        );
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
