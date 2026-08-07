/**
 * The wire between WorkerMotionEngine (main thread) and inference.worker.ts.
 *
 * Design notes:
 * - Responses carry the existing MotionEngineEvent union rather than a new one,
 *   so the UI layer is unaware a worker exists.
 * - `frame-done` is the backpressure signal. The main thread keeps exactly one
 *   frame in flight: it does not grab another until the worker acknowledges the
 *   previous one. Without this a slow device queues frames until it dies.
 * - ImageBitmap is transferable, so a frame costs no copy.
 */

import type { MotionEngineEvent, SetTelemetry } from "@/features/workout/domain/motion-engine";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

/** What the worker is doing with incoming frames. */
export type InferenceMode = "idle" | "calibration" | "set";

export type InferenceRequest =
  /** Load the models. `wasmPaths` is where the ORT runtime lives (Task 3). */
  | { type: "init"; spec: MotionSpec; wasmPaths: string }
  | { type: "mode"; mode: InferenceMode }
  | { type: "frame"; bitmap: ImageBitmap }
  /** Stop tracking and reply with a `telemetry` response. */
  | { type: "stop-set" }
  | { type: "dispose" };

export type InferenceResponse =
  | { type: "ready" }
  | { type: "init-failed"; message: string }
  | { type: "event"; event: MotionEngineEvent }
  | { type: "frame-done" }
  | { type: "telemetry"; telemetry: SetTelemetry };

const RESPONSE_TYPES = new Set(["ready", "init-failed", "event", "frame-done", "telemetry"]);

/** Guards `onmessage`, which is typed `any` and reachable from any origin. */
export function isInferenceResponse(value: unknown): value is InferenceResponse {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && RESPONSE_TYPES.has(type);
}
