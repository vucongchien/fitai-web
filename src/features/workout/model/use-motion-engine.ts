"use client";

import { useCallback, useRef, useState } from "react";

import { EMPTY_TELEMETRY } from "@/features/workout/domain/motion-engine";
import type {
  MotionEngine,
  MotionEngineEvent,
  MotionEngineKind,
  SetTelemetry,
} from "@/features/workout/domain/motion-engine";
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
  onFormError?: (error: {
    code: string;
    message: string;
    severity: CueSeverity;
    source?: "referee-error" | "coach-cue";
  }) => void;
  /** Tracking gave up (dark room, floor exercise) — hand over to manual logging. */
  onFallback?: (reason: string) => void;
  /** Called when a rep closes, counted or not. */
  onRep?: (rep: { count: number; romPercentage: number; counted: boolean }) => void;
}

// Owns the motion engine lifecycle for current exercise
export function useMotionEngine(options: MotionEngineOptions = {}) {
  const engineRef = useRef<MotionEngine | null>(null);
  const prepareIdRef = useRef(0);
  const errorTimerRef = useRef<number | null>(null);
  const handlers = useRef(options);
  handlers.current = options;

  const [kind, setKind] = useState<MotionEngineKind | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<CalibrationStatus | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [metrics, setMetrics] = useState<{
    frameIndex: number;
    metricName: string;
    angle: number;
    rom: number;
    phase: string;
    repCount: number;
    startDeg: number;
    endDeg: number;
    detectedErrors?: string[];
  } | null>(null);
  const [activeErrors, setActiveErrors] = useState<string[]>([]);
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
      case "metrics": {
        setMetrics({
          angle: event.angle,
          detectedErrors: event.detectedErrors,
          endDeg: event.endDeg,
          frameIndex: event.frameIndex,
          metricName: event.metricName,
          phase: event.phase,
          repCount: event.repCount,
          rom: event.rom,
          startDeg: event.startDeg,
        });
        if (event.detectedErrors !== undefined) {
          setActiveErrors(event.detectedErrors);
          if (event.detectedErrors.length === 0) {
            setLastError(null);
          }
        }
        break;
      }
      case "rep": {
        if (event.counted) {
          setRepCount(event.count);
          // Sang rep mới: xóa ngay trạng thái lỗi cũ, trả xương về xanh sạch sẽ
          if (errorTimerRef.current !== null) {
            window.clearTimeout(errorTimerRef.current);
            errorTimerRef.current = null;
          }
          setLastError(null);
          setActiveErrors([]);
        }
        handlers.current.onRep?.(event);
        break;
      }
      case "form-error": {
        setLastError(event.message);
        handlers.current.onFormError?.(event);

        // Tự động tắt cảnh báo đỏ sau 1.5 giây nếu người tập đã sửa lại form
        if (errorTimerRef.current !== null) {
          window.clearTimeout(errorTimerRef.current);
        }
        errorTimerRef.current = window.setTimeout(() => {
          setLastError(null);
          errorTimerRef.current = null;
        }, 1500);
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
    prepareIdRef.current += 1;
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    engineRef.current?.dispose();
    engineRef.current = null;
    setKind(null);
    setCalibration(null);
    setPose(null);
    setRepCount(0);
    setLastError(null);
    setActiveErrors([]);
  }, []);

  /** Load the engine for `spec`. Resolves to the engine kind that was picked. */
  const prepare = useCallback(
    async (spec: MotionSpec | null, video: HTMLVideoElement | null): Promise<MotionEngineKind> => {
      dispose();
      const myPrepareId = prepareIdRef.current;
      setPreparing(true);
      setError(null);
      try {
        const engine = await resolveMotionEngine(spec);
        if (myPrepareId !== prepareIdRef.current) {
          engine.dispose();
          return "manual";
        }
        await engine.prepare({ spec, video });
        if (myPrepareId !== prepareIdRef.current) {
          engine.dispose();
          return "manual";
        }
        engineRef.current = engine;
        setKind(engine.kind);
        return engine.kind;
      } catch (error) {
        if (myPrepareId !== prepareIdRef.current) {
          return "manual";
        }
        setError(error instanceof Error ? error.message : "Motion engine unavailable");
        const fallback = await resolveMotionEngine(null);
        if (myPrepareId !== prepareIdRef.current) {
          fallback.dispose();
          return "manual";
        }
        engineRef.current = fallback;
        setKind(fallback.kind);
        return fallback.kind;
      } finally {
        if (myPrepareId === prepareIdRef.current) {
          setPreparing(false);
        }
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
    setActiveErrors([]);
    engineRef.current?.startSet(onEvent);
  }, [onEvent]);

  const stopSet = useCallback(async (): Promise<SetTelemetry> => {
    setRepCount(0);
    setLastError(null);
    setActiveErrors([]);
    return (await engineRef.current?.stopSet()) ?? EMPTY_TELEMETRY;
  }, []);

  return {
    activeErrors,
    kind,
    preparing,
    error,
    calibration,
    pose,
    metrics,
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
