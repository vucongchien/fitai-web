// Edge biomechanical referee with persistence filter and 3-phase state machine

import type { SetTelemetry } from "@/features/workout/domain/motion-engine";
import {
  type EvaluatedViolation,
  type SkeletonPoint,
  evaluateMotionRule,
} from "@/features/workout/domain/rule-evaluator";
import {
  type ExerciseMotionRule,
  hasThresholdCondition,
  matchesThresholdCondition,
} from "@/features/workout/domain/rule-parser";
import type { CueSeverity, RepLogEntry } from "@/features/workout/model/live-session.types";

export type RefereeRepPhase = "REST" | "TRANSITION" | "ACTIVE";

export interface EdgeFormErrorEvent {
  code: string;
  metric: string;
  message: string;
  severity: CueSeverity;
  source: "referee-error" | "coach-cue";
}

export interface EdgeFrameUpdate {
  frameIndex: number;
  repCount: number;
  holdDurationSeconds: number;
  currentAngle: number;
  rom: number;
  startDeg: number;
  endDeg: number;
  metricName: string;
  repPhase: RefereeRepPhase;
  formScore: number;
  isValidForm: boolean;
  personDetected: boolean;
  detectedErrors: string[];
  audioCue: string;
  repCompleted: { count: number; romPercentage: number; counted: boolean } | null;
  newFormErrors: EdgeFormErrorEvent[];
}

export function resolvePhaseRomBounds(rule: ExerciseMotionRule): {
  startDeg: number;
  endDeg: number;
  metricName: string;
} {
  const pd = rule.phaseDetection;
  if (!pd || rule.challengeType === "DURATION") {
    return { endDeg: 0, metricName: pd?.metric || "none", startDeg: 0 };
  }
  const th = pd.thresholds;
  const restGt = th.rest?.gt ?? th.rest?.gte;
  const activeLte = th.active?.lte ?? th.active?.lt;
  if (restGt !== undefined && activeLte !== undefined) {
    return { endDeg: activeLte, metricName: pd.metric || "primary", startDeg: restGt };
  }
  const restLte = th.rest?.lte ?? th.rest?.lt ?? 28;
  const activeGte = th.active?.gte ?? th.active?.gt ?? 75;
  return { endDeg: activeGte, metricName: pd.metric || "primary", startDeg: restLte };
}

export function computeAngleRomPercent(angleDeg: number, startDeg: number, endDeg: number): number {
  const span = endDeg - startDeg;
  if (Math.abs(span) < 1e-6 || angleDeg <= 0) {
    return 0;
  }
  const travel = (angleDeg - startDeg) / span;
  return Math.min(100, Math.max(0, Math.round(travel * 85)));
}

export function keypointsToSkeletonPoints(
  keypoints: { x: number; y: number; score: number }[],
  sourceWidth = 1,
  sourceHeight = 1,
  boostLiveConfidence = false,
): SkeletonPoint[] {
  const sw = Math.max(1, sourceWidth);
  const sh = Math.max(1, sourceHeight);
  return keypoints.map((k, index) => ({
    index,
    visibility: boostLiveConfidence && k.score > 0.4 && k.score < 0.52 ? 0.52 : k.score,
    x: k.x / sw,
    y: k.y / sh,
    z: 0,
  }));
}

export class EdgeRefereeSession {
  private readonly rule: ExerciseMotionRule;
  private cameraAngle: string;
  private frameIndex = 0;
  private confirmedValue = 0;
  private elapsedDurationMs = 0;
  private lastTimestampMs: number | null = null;
  private scoreSum = 0;
  private scoreCount = 0;
  private currentAngle = 0;
  private personDetected = false;
  private isCompleted = false;
  private completionReason = "";

  private errorStreakFrames = new Map<string, number>();
  private errorStreakDurationMs = new Map<string, number>();
  private prevConfirmedErrors = new Set<string>();

  private accumulatedDurationMs = 0;
  private consecutiveViolationDurationMs = 0;

  private repPhase: RefereeRepPhase = "REST";
  private hasTransitionedIn = false;
  private hasReachedActive = false;
  private hasTransitionedOut = false;
  private phaseFrames = 0;
  private phaseDurationMs = 0;
  private lastDepthWarningMs = -10_000;

  private currentRepPeakRom = 0;
  private currentRepPeakAngles: Record<string, number> = {};
  private pendingRepErrors = new Set<string>();
  private recordedReps: RepLogEntry[] = [];
  private totalErrorEvents = 0;

  constructor(rule: ExerciseMotionRule, cameraAngle?: string) {
    this.rule = rule;
    this.cameraAngle = (cameraAngle || rule.recommendedCameraAngle || "auto").toLowerCase();
  }

  getRule(): ExerciseMotionRule {
    return this.rule;
  }

  getConfirmedValue(): number {
    return this.confirmedValue;
  }

  getAverageFormScore(): number {
    if (this.scoreCount === 0) {
      return 100;
    }
    return Math.round(this.scoreSum / this.scoreCount);
  }

  processKeypoints(
    keypoints: { x: number; y: number; score: number }[],
    timestampMs?: number,
    cameraAngle?: string,
    sourceWidth = 1,
    sourceHeight = 1,
    boostLiveConfidence = false,
  ): EdgeFrameUpdate {
    const landmarks = keypointsToSkeletonPoints(
      keypoints,
      sourceWidth,
      sourceHeight,
      boostLiveConfidence,
    );
    return this.processFrame(landmarks, timestampMs, cameraAngle);
  }

  processFrame(
    landmarks: SkeletonPoint[],
    timestampMs?: number,
    cameraAngle?: string,
  ): EdgeFrameUpdate {
    this.frameIndex += 1;
    if (cameraAngle) {
      this.cameraAngle = cameraAngle.trim().toLowerCase();
    }

    const deltaMs = this.resolveDeltaMs(timestampMs);
    this.elapsedDurationMs += deltaMs;

    const rawResult = evaluateMotionRule(landmarks, this.rule, this.cameraAngle);
    const isNoPerson =
      rawResult.detectedErrors.length === 1 &&
      rawResult.detectedErrors[0] === "ERR_NO_PERSON_DETECTED";
    this.personDetected = !isNoPerson;

    const hasAngle = Boolean(rawResult.hasCalculatedAngle) || rawResult.calculatedAngle > 0;
    if (hasAngle) {
      this.currentAngle = rawResult.calculatedAngle;
    }

    const { persistedErrors, persistedViolations, filteredScore, filteredCue } =
      this.applyPersistenceFilter(rawResult, deltaMs, isNoPerson);

    if (!isNoPerson && filteredScore >= 0) {
      this.scoreSum += filteredScore;
      this.scoreCount += 1;
    }

    const newFormErrors: EdgeFormErrorEvent[] = [];
    for (const v of persistedViolations) {
      if (!this.pendingRepErrors.has(v.code)) {
        this.pendingRepErrors.add(v.code);
        this.totalErrorEvents += 1;
      }
      if (!this.prevConfirmedErrors.has(v.code)) {
        newFormErrors.push({
          code: v.code,
          message: v.audioCue || v.code,
          metric: v.metric,
          severity: v.severity,
          source: "referee-error",
        });
      }
    }
    this.prevConfirmedErrors = new Set(persistedErrors);

    const { startDeg, endDeg, metricName } = resolvePhaseRomBounds(this.rule);
    const rom =
      this.rule.challengeType === "DURATION"
        ? 100
        : computeAngleRomPercent(this.currentAngle, startDeg, endDeg);

    let repCompleted: { count: number; romPercentage: number; counted: boolean } | null = null;
    if (!this.isCompleted) {
      if (this.rule.challengeType === "DURATION") {
        repCompleted = this.processDurationFrame(
          persistedErrors.length === 0 && !isNoPerson,
          this.currentAngle,
          hasAngle,
          deltaMs,
        );
      } else {
        const repOut = this.processRepFrame(
          this.currentAngle,
          rom,
          rawResult.metricValues,
          deltaMs,
        );
        repCompleted = repOut.repCompleted;
        if (repOut.halfRepError) {
          newFormErrors.push(repOut.halfRepError);
          if (!persistedErrors.includes(repOut.halfRepError.code)) {
            persistedErrors.push(repOut.halfRepError.code);
          }
        }
      }
    }

    if (this.elapsedDurationMs >= this.rule.timeCeilingMs) {
      this.elapsedDurationMs = this.rule.timeCeilingMs;
      this.isCompleted = true;
      if (!this.completionReason) {
        this.completionReason = "TIMEOUT";
      }
    }

    return {
      audioCue: filteredCue,
      currentAngle: this.currentAngle,
      detectedErrors: persistedErrors,
      endDeg,
      formScore: filteredScore,
      frameIndex: this.frameIndex,
      holdDurationSeconds:
        this.rule.challengeType === "DURATION" ? Math.floor(this.accumulatedDurationMs / 1000) : 0,
      isValidForm: persistedErrors.length === 0 && !isNoPerson,
      metricName,
      newFormErrors,
      personDetected: this.personDetected,
      repCompleted,
      repCount: this.confirmedValue,
      repPhase: this.repPhase,
      rom,
      startDeg,
    };
  }

  private resolveDeltaMs(timestampMs?: number): number {
    const defaultDeltaMs = 50;
    let delta = defaultDeltaMs;
    if (timestampMs !== undefined && Number.isFinite(timestampMs)) {
      if (this.lastTimestampMs !== null && timestampMs > this.lastTimestampMs) {
        delta = timestampMs - this.lastTimestampMs;
      }
      this.lastTimestampMs = timestampMs;
    } else if (this.lastTimestampMs !== null) {
      this.lastTimestampMs += defaultDeltaMs;
    } else {
      this.lastTimestampMs = 0;
    }
    return Math.min(500, Math.max(1, delta));
  }

  private applyPersistenceFilter(
    rawResult: ReturnType<typeof evaluateMotionRule>,
    deltaMs: number,
    isNoPerson: boolean,
  ): {
    persistedErrors: string[];
    persistedViolations: EvaluatedViolation[];
    filteredScore: number;
    filteredCue: string;
  } {
    if (isNoPerson) {
      return {
        filteredCue: rawResult.audioCue,
        filteredScore: rawResult.formScore,
        persistedErrors: rawResult.detectedErrors,
        persistedViolations: rawResult.violations,
      };
    }

    if (rawResult.detectedErrors.length === 0) {
      this.errorStreakFrames.clear();
      this.errorStreakDurationMs.clear();
      return {
        filteredCue: "",
        filteredScore: 100,
        persistedErrors: [],
        persistedViolations: [],
      };
    }

    const activeCodes = new Set<string>();
    const persistedErrors: string[] = [];
    const persistedViolations: EvaluatedViolation[] = [];

    for (let i = 0; i < rawResult.detectedErrors.length; i++) {
      const code = rawResult.detectedErrors[i]!;
      const violation = rawResult.violations[i];
      activeCodes.add(code);
      const nextFrames = (this.errorStreakFrames.get(code) ?? 0) + 1;
      const nextDuration = (this.errorStreakDurationMs.get(code) ?? 0) + deltaMs;
      this.errorStreakFrames.set(code, nextFrames);
      this.errorStreakDurationMs.set(code, nextDuration);

      if (nextFrames >= 3 || nextDuration >= 150) {
        persistedErrors.push(code);
        if (violation) {
          persistedViolations.push(violation);
        }
      }
    }

    for (const key of Array.from(this.errorStreakFrames.keys())) {
      if (!activeCodes.has(key)) {
        this.errorStreakFrames.delete(key);
        this.errorStreakDurationMs.delete(key);
      }
    }

    if (persistedErrors.length === 0) {
      return {
        filteredCue: "",
        filteredScore: 100,
        persistedErrors: [],
        persistedViolations: [],
      };
    }

    const cue = persistedViolations[0]?.audioCue || rawResult.audioCue;
    return {
      filteredCue: cue,
      filteredScore: rawResult.formScore,
      persistedErrors,
      persistedViolations,
    };
  }

  private processDurationFrame(
    passed: boolean,
    angle: number,
    hasAngle: boolean,
    deltaMs: number,
  ): { count: number; romPercentage: number; counted: boolean } | null {
    if (this.rule.phaseDetection && hasAngle) {
      const idleTh = this.rule.phaseDetection.thresholds.idle;
      if (hasThresholdCondition(idleTh) && matchesThresholdCondition(idleTh, angle)) {
        this.repPhase = "REST";
        return null;
      }
      this.repPhase = "ACTIVE";
    }

    if (passed) {
      this.accumulatedDurationMs += deltaMs;
      if (this.accumulatedDurationMs >= this.rule.timeCeilingMs) {
        this.accumulatedDurationMs = this.rule.timeCeilingMs;
        this.isCompleted = true;
        this.completionReason = "TIMEOUT";
      }
      this.consecutiveViolationDurationMs = 0;
      const nextSec = Math.floor(this.accumulatedDurationMs / 1000);
      if (nextSec > this.confirmedValue) {
        for (let s = this.confirmedValue + 1; s <= nextSec; s++) {
          this.recordedReps.push({
            errorCodes: Array.from(this.pendingRepErrors),
            jointAngles: { primary: Math.round(angle) },
            repNumber: s,
            romPercentage: 100,
          });
        }
        this.pendingRepErrors.clear();
        this.confirmedValue = nextSec;
        return { count: nextSec, counted: true, romPercentage: 100 };
      }
      return null;
    }

    this.consecutiveViolationDurationMs += deltaMs;
    return null;
  }

  private processRepFrame(
    angle: number,
    rom: number,
    metricValues: Record<string, number>,
    deltaMs: number,
  ): {
    repCompleted: { count: number; romPercentage: number; counted: boolean } | null;
    halfRepError: EdgeFormErrorEvent | null;
  } {
    if (angle <= 0 || !this.rule.phaseDetection) {
      return { halfRepError: null, repCompleted: null };
    }

    const th = this.rule.phaseDetection.thresholds;
    const isRest = matchesThresholdCondition(th.rest, angle);
    const isActive = matchesThresholdCondition(th.active, angle) && !isRest;
    const isTransition = matchesThresholdCondition(th.transition, angle) && !isRest && !isActive;

    const recordPeak = () => {
      if (rom >= this.currentRepPeakRom) {
        this.currentRepPeakRom = rom;
        const snapshot: Record<string, number> = { primary: Math.round(angle) };
        for (const [k, v] of Object.entries(metricValues)) {
          snapshot[k] = Math.round(v * 100) / 100;
        }
        this.currentRepPeakAngles = snapshot;
      }
    };

    const completeRep = (): { count: number; romPercentage: number; counted: boolean } => {
      this.confirmedValue += 1;
      const romPercentage = Math.max(70, Math.min(100, Math.round(this.currentRepPeakRom || 85)));
      this.recordedReps.push({
        errorCodes: Array.from(this.pendingRepErrors),
        jointAngles:
          Object.keys(this.currentRepPeakAngles).length > 0
            ? { ...this.currentRepPeakAngles }
            : { primary: Math.round(angle) },
        repNumber: this.confirmedValue,
        romPercentage,
      });
      this.pendingRepErrors.clear();
      return { count: this.confirmedValue, counted: true, romPercentage };
    };

    const resetCycle = () => {
      this.repPhase = "REST";
      this.hasTransitionedIn = false;
      this.hasReachedActive = false;
      this.hasTransitionedOut = false;
      this.phaseFrames = 0;
      this.phaseDurationMs = 0;
      this.currentRepPeakRom = 0;
      this.currentRepPeakAngles = {};
    };

    switch (this.repPhase) {
      case "REST": {
        if (isTransition) {
          this.repPhase = "TRANSITION";
          this.hasTransitionedIn = true;
          this.hasReachedActive = false;
          this.hasTransitionedOut = false;
          this.phaseFrames = 1;
          this.phaseDurationMs = deltaMs;
          this.currentRepPeakRom = 0;
          this.currentRepPeakAngles = {};
          recordPeak();
        } else if (isActive) {
          this.repPhase = "ACTIVE";
          this.hasTransitionedIn = false;
          this.hasReachedActive = false;
          this.hasTransitionedOut = false;
          this.phaseFrames = 1;
          this.phaseDurationMs = deltaMs;
          this.currentRepPeakRom = 0;
          this.currentRepPeakAngles = {};
          recordPeak();
        }
        return { halfRepError: null, repCompleted: null };
      }

      case "TRANSITION": {
        this.phaseFrames += 1;
        this.phaseDurationMs += deltaMs;
        recordPeak();

        if (isActive) {
          if (this.hasTransitionedIn) {
            this.hasReachedActive = true;
          }
          this.repPhase = "ACTIVE";
          return { halfRepError: null, repCompleted: null };
        }

        if (isRest) {
          let repCompleted: { count: number; romPercentage: number; counted: boolean } | null =
            null;
          let halfRepError: EdgeFormErrorEvent | null = null;

          if (this.hasTransitionedIn && this.hasReachedActive && this.hasTransitionedOut) {
            repCompleted = completeRep();
          } else if (
            this.hasTransitionedIn &&
            !this.hasReachedActive &&
            this.phaseFrames >= 3 &&
            this.elapsedDurationMs - this.lastDepthWarningMs > 2500
          ) {
            this.lastDepthWarningMs = this.elapsedDurationMs;
            halfRepError = {
              code: "ERR_INCORRECT_DEPTH",
              message: "Chưa đủ biên độ, hãy hạ sâu hơn!",
              metric: "depth",
              severity: 1,
              source: "referee-error",
            };
          }

          resetCycle();
          return { halfRepError, repCompleted };
        }

        if (isTransition && this.hasReachedActive) {
          this.hasTransitionedOut = true;
        }
        return { halfRepError: null, repCompleted: null };
      }

      case "ACTIVE": {
        this.phaseFrames += 1;
        this.phaseDurationMs += deltaMs;
        recordPeak();

        if (isTransition) {
          if (this.hasReachedActive) {
            this.hasTransitionedOut = true;
          }
          this.repPhase = "TRANSITION";
          return { halfRepError: null, repCompleted: null };
        }

        if (isRest) {
          let repCompleted: { count: number; romPercentage: number; counted: boolean } | null =
            null;
          if (
            this.hasTransitionedIn &&
            this.hasReachedActive &&
            this.phaseFrames >= 8 &&
            this.phaseDurationMs >= 400
          ) {
            repCompleted = completeRep();
          }
          resetCycle();
          return { halfRepError: null, repCompleted };
        }

        if (isActive && !this.hasReachedActive && this.phaseFrames >= 15) {
          this.hasTransitionedIn = true;
          this.hasReachedActive = true;
        }
        return { halfRepError: null, repCompleted: null };
      }
    }
  }

  buildSetTelemetry(validFrameRatio: number): SetTelemetry {
    const countedReps = this.confirmedValue;
    const elapsedSec = Math.max(0.1, this.elapsedDurationMs / 1000);
    const averageRom =
      this.recordedReps.length > 0
        ? Math.round(
            this.recordedReps.reduce((sum, r) => sum + r.romPercentage, 0) /
              this.recordedReps.length,
          )
        : countedReps > 0
          ? 100
          : 0;
    const formScore = this.scoreCount > 0 ? Math.round(this.scoreSum / this.scoreCount) : null;

    return {
      averageRom,
      countedReps,
      errorCount: this.totalErrorEvents,
      formScore,
      reps: [...this.recordedReps],
      secondsPerRep: countedReps > 0 ? Number((elapsedSec / countedReps).toFixed(2)) : 0,
      validFrameRatio,
    };
  }
}
