"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EMPTY_TELEMETRY } from '@/features/workout/domain/motion-engine';
import type { MotionEngine, MotionEngineEvent, MotionEngineKind, SetTelemetry } from '@/features/workout/domain/motion-engine';
import type {
  CalibrationDistance,
  CalibrationLighting,
  Pose,
} from "@/features/workout/domain/pose-metrics";
import { resolveMotionEngine } from "@/features/workout/domain/resolve-motion-engine";
import type { CueSeverity, MotionSpec } from "@/features/workout/model/live-session.types";

export interface CalibrationStatus {
  distance: CalibrationDistance;
  lighting: CalibrationLighting;
  hint: string;
  ready: boolean;
}

export interface MotionEngineOptions {
  /** Called on every detected form error, already carrying the cue copy. */
  onFormError?: (error: { code: string; message: string; severity: CueSeverity }) => void;
  /** Tracking gave up (dark room, floor exercise) — hand over to manual logging. */
  onFallback?: (reason: string) => void;
  /** Called when a rep closes, counted or not. */
  onRep?: (rep: { count: number; romPercentage: number; counted: boolean }) => void;
}

/**
 * Owns the motion engine lifecycle for the current exercise: which engine, model
 * loading, the calibration loop and the per-set tracking loop.
 */
export function useMotionEngine(options: MotionEngineOptions = {}) {
  const engineRef = useRef<MotionEngine | null>(null);
  const handlers = useRef(options);
  handlers.current = options;

  const [kind, setKind] = useState<MotionEngineKind | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<CalibrationStatus | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const onEvent = useCallback((event: MotionEngineEvent) => {
    switch (event.type) {
      case "calibration": {
        setCalibration({
          distance: event.distance,
          hint: event.hint,
          lighting: event.lighting,
          ready: event.ready,
        });
        break;
      }
      case "pose": {
        setPose(event.pose);
        break;
      }
      case "rep": {
        if (event.counted) setRepCount(event.count);
        handlers.current.onRep?.(event);
        break;
      }
      case "form-error": {
        setLastError(event.message);
        handlers.current.onFormError?.(event);
        break;
      }
      case "fallback": {
        handlers.current.onFallback?.(event.reason);
        break;
      }
      case "blocked": {
        setError(event.reason);
        break;
      }
      default: {
        break;
      }
    }
  }, []);

  const dispose = useCallback(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    setKind(null);
    setCalibration(null);
    setPose(null);
    setRepCount(0);
    setLastError(null);
  }, []);

  /** Load the engine for `spec`. Resolves to the engine kind that was picked. */
  const prepare = useCallback(
    async (spec: MotionSpec | null, video: HTMLVideoElement | null): Promise<MotionEngineKind> => {
      dispose();
      setPreparing(true);
      setError(null);
      try {
        const engine = await resolveMotionEngine(spec);
        await engine.prepare({ spec, video });
        engineRef.current = engine;
        setKind(engine.kind);
        return engine.kind;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Motion engine unavailable");
        const fallback = await resolveMotionEngine(null);
        engineRef.current = fallback;
        setKind(fallback.kind);
        return fallback.kind;
      } finally {
        setPreparing(false);
      }
    },
    [dispose],
  );

  const startCalibration = useCallback(() => {
    engineRef.current?.startCalibration(onEvent);
  }, [onEvent]);

  const stopCalibration = useCallback(() => {
    engineRef.current?.stopCalibration();
  }, []);

  const startSet = useCallback(() => {
    setRepCount(0);
    setLastError(null);
    engineRef.current?.startSet(onEvent);
  }, [onEvent]);

  const stopSet = useCallback(async (): Promise<SetTelemetry> => 
    (await engineRef.current?.stopSet()) ?? EMPTY_TELEMETRY
  , []);

  useEffect(() => dispose, [dispose]);

  return {
    kind,
    preparing,
    error,
    calibration,
    pose,
    repCount,
    lastError,
    prepare,
    startCalibration,
    stopCalibration,
    startSet,
    stopSet,
    dispose,
  };
}

export type MotionController = ReturnType<typeof useMotionEngine>;
