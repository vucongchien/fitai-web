// Motion engine contract — the seam between the live UI and pose tracking.

import type {
  CalibrationDistance,
  CalibrationLighting,
  Pose,
} from "@/features/workout/domain/pose-metrics";
import type {
  CueSeverity,
  MotionSpec,
  RepLogEntry,
} from "@/features/workout/model/live-session.types";

export type MotionEngineEvent =
  | { type: "ready" }
  | { type: "blocked"; reason: string }
  | {
      type: "calibration";
      distance: CalibrationDistance;
      lighting: CalibrationLighting;
      hint: string;
      ready: boolean;
    }
  /** Latest skeleton, for the overlay. */
  | { type: "pose"; pose: Pose | null }
  | {
      type: "metrics";
      frameIndex: number;
      metricName: string;
      angle: number;
      rom: number;
      phase: string;
      repCount: number;
      startDeg: number;
      endDeg: number;
      detectedErrors?: string[];
    }
  | { type: "rep"; count: number; romPercentage: number; counted: boolean }
  // source: "coach-cue" marks referee voice lines (not error codes)
  | {
      type: "form-error";
      code: string;
      message: string;
      severity: CueSeverity;
      source?: "referee-error" | "coach-cue";
    }
  /** Emitted when tracking degrades enough to hand the set back to manual logging. */
  | { type: "fallback"; reason: string };

export type MotionEngineKind = "onnx" | "manual";

/** What a finished set produced. Feeds the review sheet and LogWorkoutSet. */
export interface SetTelemetry {
  reps: RepLogEntry[];
  countedReps: number;
  /** Mean ROM of counted reps, 0-100. */
  averageRom: number;
  errorCount: number;
  /** Share of frames with a usable skeleton — BR-CC-02. */
  validFrameRatio: number;
  secondsPerRep: number;
  // Set form score from the Go referee, 0-100 (single source of truth)
  formScore?: number | null;
}

export const EMPTY_TELEMETRY: SetTelemetry = {
  reps: [],
  countedReps: 0,
  averageRom: 0,
  errorCount: 0,
  validFrameRatio: 0,
  secondsPerRep: 0,
};

export interface MotionEngineContext {
  /** Live camera feed. Absent for the manual engine. */
  video?: HTMLVideoElement | null;
  /** Null for the manual engine — an exercise without AI support has no spec. */
  spec: MotionSpec | null;
}

export type MotionEventHandler = (event: MotionEngineEvent) => void;

export interface MotionEngine {
  readonly kind: MotionEngineKind;
  /** Load models / warm up. Rejects only on unrecoverable errors. */
  prepare(context: MotionEngineContext): Promise<void>;
  /** Framing feedback loop — runs until stopCalibration(). */
  startCalibration(onEvent: MotionEventHandler): void;
  stopCalibration(): void;
  /** Rep tracking for one set. */
  startSet(onEvent: MotionEventHandler): void;
  // Stop tracking and return what the set produced
  stopSet(): Promise<SetTelemetry>;
  dispose(): void;
}

/** The non-AI branch: no camera, no scores. BR-WL-03 keeps Form Score N/A. */
export class ManualMotionEngine implements MotionEngine {
  readonly kind = "manual" as const;

  async prepare(): Promise<void> {}
  startCalibration(onEvent: MotionEventHandler): void {
    onEvent({ type: "ready" });
  }
  stopCalibration(): void {}
  startSet(): void {}
  async stopSet(): Promise<SetTelemetry> {
    return EMPTY_TELEMETRY;
  }
  dispose(): void {}
}
