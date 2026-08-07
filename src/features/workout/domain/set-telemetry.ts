/**
 * Accumulates what happens during one tracked set: reps, ROM, rule violations and
 * how many frames actually tracked. Shared by the ONNX and simulated engines so
 * both produce identical telemetry for the review sheet and LogWorkoutSet.
 */

import { EMPTY_TELEMETRY } from '@/features/workout/domain/motion-engine';
import type { SetTelemetry } from '@/features/workout/domain/motion-engine';
import { createRepCounter, feedRepCounter } from '@/features/workout/domain/pose-metrics';
import type { RepCounterState } from '@/features/workout/domain/pose-metrics';
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
}

export function freshAccumulator(): Accumulator {
  return {
    counter: createRepCounter(),
    errorCodes: [],
    pendingErrors: new Set(),
    reps: [],
    startedAt: Date.now(),
    totalFrames: 0,
    validFrames: 0,
  };
}

export interface RepEvent {
  type: "rep";
  count: number;
  romPercentage: number;
  counted: boolean;
}

/** Push one ROM sample. Returns a rep event on the frame a rep closes. */
export function feedCounter(accumulator: Accumulator, rom: number): RepEvent | null {
  const tick = feedRepCounter(accumulator.counter, rom);
  accumulator.counter = tick.state;
  if (!tick.completedRep) {return null;}

  accumulator.reps.push({
    errorCodes: [...accumulator.pendingErrors],
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
  if (accumulator.totalFrames === 0) {return EMPTY_TELEMETRY;}
  const counted = accumulator.counter.completedRoms;
  const seconds = (endedAt - accumulator.startedAt) / 1000;
  return {
    averageRom:
      counted.length === 0 ? 0 : counted.reduce((total, rom) => total + rom, 0) / counted.length,
    countedReps: accumulator.counter.count,
    errorCount: accumulator.errorCodes.length,
    reps: accumulator.reps,
    secondsPerRep: accumulator.counter.count === 0 ? 0 : seconds / accumulator.counter.count,
    validFrameRatio: accumulator.validFrames / accumulator.totalFrames,
  };
}
