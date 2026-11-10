// Wire protocol between WorkerMotionEngine (main thread) and inference.worker.ts

import type { MotionEngineEvent, SetTelemetry } from "@/features/workout/domain/motion-engine";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

export type InferenceMode = "idle" | "calibration" | "set";

export type InferenceRequest =
  | { type: "init"; spec: MotionSpec; wasmPaths: string }
  | { type: "mode"; mode: InferenceMode; spec?: MotionSpec }
  | { type: "frame"; bitmap: ImageBitmap }
  | { type: "stop-set" };

export type InferenceResponse =
  | { type: "ready" }
  | { type: "init-failed"; message: string }
  | { type: "event"; event: MotionEngineEvent }
  | { type: "frame-done" }
  | { type: "telemetry"; telemetry: SetTelemetry };

const RESPONSE_TYPES = new Set(["ready", "init-failed", "event", "frame-done", "telemetry"]);

export function isInferenceResponse(value: unknown): value is InferenceResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { type } = value as { type?: unknown };
  return typeof type === "string" && RESPONSE_TYPES.has(type);
}
