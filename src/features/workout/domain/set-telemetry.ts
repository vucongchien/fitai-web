/**
 * Accumulates what happens during one tracked set: reps, ROM, rule violations and
 * how many frames actually tracked. Shared by the ONNX and simulated engines so
 * both produce identical telemetry for the review sheet and LogWorkoutSet.
 */

import { EMPTY_TELEMETRY } from "@/features/workout/domain/motion-engine";
import type { SetTelemetry } from "@/features/workout/domain/motion-engine";
import { createRepCounter, feedRepCounter } from "@/features/workout/domain/pose-metrics";
import type { RepCounterState } from "@/features/workout/domain/pose-metrics";
import type { RepLogEntry } from "@/features/workout/model/live-session.types";

export interface Accumulator {
  counter: RepCounterState;
  reps: RepLogEntry[];
  errorCodes: string[];
  validFrames: number;
  totalFrames: number;
  startedAt: number;
  /** Errors seen since the last completed rep — attached to that rep. */
  pendingErrors: Set<string>;
  lastJointAngles?: Record<string, number>;
  validHoldTimeMs?: number;
  lastValidFrameTimeMs?: number | null;
}

export function freshAccumulator(): Accumulator {
  return {
    counter: createRepCounter(),
    errorCodes: [],
    lastJointAngles: {},
    lastValidFrameTimeMs: null,
    pendingErrors: new Set(),
    reps: [],
    startedAt: Date.now(),
    totalFrames: 0,
    validFrames: 0,
    validHoldTimeMs: 0,
  };
}

export interface RepEvent {
  type: "rep";
  count: number;
  romPercentage: number;
  counted: boolean;
}

/** Push one ROM sample. Returns a rep event on the frame a rep closes. */
export function feedCounter(
  accumulator: Accumulator,
  rom: number,
  jointAngles?: Record<string, number>,
): RepEvent | null {
  const tick = feedRepCounter(accumulator.counter, rom);
  accumulator.counter = tick.state;
  if (!tick.completedRep) {
    return null;
  }

  accumulator.reps.push({
    errorCodes: [...accumulator.pendingErrors],
    jointAngles: jointAngles ?? (accumulator.lastJointAngles ? { ...accumulator.lastJointAngles } : {}),
    repNumber: accumulator.reps.length + 1,
    romPercentage: tick.completedRep.romPercentage,
  });
  accumulator.pendingErrors.clear();

  return {
    count: tick.completedRep.repNumber,
    counted: tick.completedRep.counted,
    romPercentage: tick.completedRep.romPercentage,
    type: "rep",
  };
}

export function summarise(accumulator: Accumulator, endedAt = Date.now()): SetTelemetry {
  if (accumulator.totalFrames === 0) {
    return EMPTY_TELEMETRY;
  }
  const counted = accumulator.counter.completedRoms;
  const seconds = (endedAt - accumulator.startedAt) / 1000;
  const countedReps = accumulator.counter.count;
  const averageRom =
    counted.length === 0
      ? countedReps > 0
        ? 100
        : 0
      : counted.reduce((total, rom) => total + rom, 0) / counted.length;
  return {
    averageRom,
    countedReps,
    errorCount: accumulator.errorCodes.length,
    reps: accumulator.reps,
    secondsPerRep: countedReps === 0 ? 0 : seconds / countedReps,
    validFrameRatio: accumulator.validFrames / accumulator.totalFrames,
  };
}
