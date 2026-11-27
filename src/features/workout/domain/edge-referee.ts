// Edge biomechanical referee with persistence filter and 3-phase state machine

import type { SetTelemetry } from "@/features/workout/domain/motion-engine";
import {
  type EvaluatedViolation,
  type InsufficientCriterionReport,
  type SkeletonPoint,
  areHandsBelowChest,
  evaluateMotionRule,
  isUprightTorso,
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
  insufficientDataRules?: InsufficientCriterionReport[];
  /** True while the rule's posture gate blocks evaluation (e.g. standing during a push-up set). */
  postureMismatch?: boolean;
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
  private eccentricDurationMs = 0;
  private lastDepthWarningMs = -10_000;
  private lastTempoWarningMs = -10_000;
  private lastLockoutWarningMs = -10_000;
  private lastBottomStuckWarningMs = -10_000;

  private isArmed = false;
  private restStableFrames = 0;
  private restReturnFrames = 0;
  private lockedRepDominantSide: "left" | "right" | null = null;
  private hadOcclusionInCycle = false;
  private uprightStreakFrames = 0;
  private lowHandsStreakFrames = 0;
  private frameAspect = 1;
  private resolvedCameraView: "front" | "side" | "oblique" = "side";

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
    if (sourceWidth > 1 && sourceHeight > 1) {
      this.frameAspect = sourceWidth / sourceHeight;
    }
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

    const preferredSide = this.repPhase !== "REST" ? this.lockedRepDominantSide : null;
    const rawResult = evaluateMotionRule(
      landmarks,
      this.rule,
      this.cameraAngle,
      preferredSide,
      this.frameAspect,
    );
    if (rawResult.activeView) {
      this.resolvedCameraView = rawResult.activeView;
    }
    const isNoPerson =
      rawResult.detectedErrors.length === 1 &&
      rawResult.detectedErrors[0] === "ERR_NO_PERSON_DETECTED";
    this.personDetected = !isNoPerson;

    if (isNoPerson) {
      this.isArmed = false;
      this.restStableFrames = 0;
    }

    // Posture gate: e.g. push-up must not count elbow-angle cycles while the user stands and gestures.
    // Debounced (3 frames) so a single mis-detected frame mid-rep does not abort the rep.
    if (!isNoPerson && this.rule.postureGate === "reject_upright") {
      const upright = isUprightTorso(landmarks, this.frameAspect);
      this.uprightStreakFrames = upright === true ? this.uprightStreakFrames + 1 : 0;
      if (this.uprightStreakFrames >= 3) {
        return this.buildPostureMismatchUpdate();
      }
    }
    if (!isNoPerson && this.rule.postureGate === "reject_low_hands") {
      const lowHands = areHandsBelowChest(landmarks);
      this.lowHandsStreakFrames = lowHands === true ? this.lowHandsStreakFrames + 1 : 0;
      if (this.lowHandsStreakFrames >= 3) {
        return this.buildPostureMismatchUpdate();
      }
    }

    const hasAngle = Boolean(rawResult.hasCalculatedAngle) || rawResult.calculatedAngle > 0;
    if (hasAngle) {
      this.currentAngle = rawResult.calculatedAngle;
      if (this.repPhase !== "REST" && !this.lockedRepDominantSide && rawResult.dominantSide) {
        this.lockedRepDominantSide = rawResult.dominantSide;
      }
    } else if (this.repPhase !== "REST") {
      this.hadOcclusionInCycle = true;
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
          hasAngle,
          rom,
          rawResult.metricValues,
          rawResult.dominantSide ?? null,
          deltaMs,
        );
        repCompleted = repOut.repCompleted;
        if (repOut.halfRepError) {
          newFormErrors.push(repOut.halfRepError);
          if (!persistedErrors.includes(repOut.halfRepError.code)) {
            persistedErrors.push(repOut.halfRepError.code);
          }
        }
        if (repOut.tempoError) {
          newFormErrors.push(repOut.tempoError);
          if (!persistedErrors.includes(repOut.tempoError.code)) {
            persistedErrors.push(repOut.tempoError.code);
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
      insufficientDataRules: rawResult.insufficientDataRules,
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

  private buildPostureMismatchUpdate(): EdgeFrameUpdate {
    // Disarm and silently abort any in-progress rep (no half-rep error: the user left the posture,
    // they did not perform a shallow rep). Clear form-fault streaks so nothing is nagged while standing.
    this.isArmed = false;
    this.restStableFrames = 0;
    this.repPhase = "REST";
    this.hasTransitionedIn = false;
    this.hasReachedActive = false;
    this.hasTransitionedOut = false;
    this.phaseFrames = 0;
    this.phaseDurationMs = 0;
    this.eccentricDurationMs = 0;
    this.restReturnFrames = 0;
    this.currentRepPeakRom = 0;
    this.currentRepPeakAngles = {};
    this.lockedRepDominantSide = null;
    this.hadOcclusionInCycle = false;
    this.pendingRepErrors.clear();
    this.errorStreakFrames.clear();
    this.errorStreakDurationMs.clear();
    this.prevConfirmedErrors.clear();

    if (this.elapsedDurationMs >= this.rule.timeCeilingMs) {
      this.elapsedDurationMs = this.rule.timeCeilingMs;
      this.isCompleted = true;
      if (!this.completionReason) {
        this.completionReason = "TIMEOUT";
      }
    }

    const { startDeg, endDeg, metricName } = resolvePhaseRomBounds(this.rule);
    return {
      audioCue: "",
      currentAngle: this.currentAngle,
      detectedErrors: [],
      endDeg,
      formScore: 100,
      frameIndex: this.frameIndex,
      holdDurationSeconds:
        this.rule.challengeType === "DURATION" ? Math.floor(this.accumulatedDurationMs / 1000) : 0,
      isValidForm: false,
      metricName,
      newFormErrors: [],
      personDetected: this.personDetected,
      postureMismatch: true,
      repCompleted: null,
      repCount: this.confirmedValue,
      repPhase: this.repPhase,
      rom: 0,
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
    hasAngle: boolean,
    rom: number,
    metricValues: Record<string, number>,
    dominantSide: "left" | "right" | null,
    deltaMs: number,
  ): {
    repCompleted: { count: number; romPercentage: number; counted: boolean } | null;
    halfRepError: EdgeFormErrorEvent | null;
    tempoError: EdgeFormErrorEvent | null;
  } {
    if (angle <= 0 || !this.rule.phaseDetection) {
      return { halfRepError: null, repCompleted: null, tempoError: null };
    }

    // If primary joint angle dropped out this frame due to brief occlusion, hold current phase
    // rather than resetting or misinterpreting stale angle.
    if (!hasAngle && this.repPhase !== "REST") {
      this.hadOcclusionInCycle = true;
      this.phaseDurationMs += deltaMs;
      return { halfRepError: null, repCompleted: null, tempoError: null };
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

    const checkTempoFault = (): EdgeFormErrorEvent | null => {
      const minEcc = this.rule.minEccentricDurationMs ?? 0;
      const minRep = this.rule.minRepDurationMs ?? 0;
      const tooFastEcc = minEcc > 0 && this.eccentricDurationMs > 0 && this.eccentricDurationMs < minEcc;
      const tooFastRep = minRep > 0 && this.phaseDurationMs > 0 && this.phaseDurationMs < minRep;

      if (
        (tooFastEcc || tooFastRep) &&
        this.elapsedDurationMs - this.lastTempoWarningMs > 2500
      ) {
        this.lastTempoWarningMs = this.elapsedDurationMs;
        if (!this.pendingRepErrors.has("ERR_TEMPO_TOO_FAST")) {
          this.pendingRepErrors.add("ERR_TEMPO_TOO_FAST");
          this.totalErrorEvents += 1;
        }
        return {
          code: "ERR_TEMPO_TOO_FAST",
          message: "Bạn đang tập quá nhanh, hãy kiểm soát nhịp độ chậm lại!",
          metric: "tempo",
          severity: 1,
          source: "referee-error",
        };
      }
      return null;
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
      this.eccentricDurationMs = 0;
      this.restReturnFrames = 0;
      this.currentRepPeakRom = 0;
      this.currentRepPeakAngles = {};
      this.lockedRepDominantSide = null;
      this.hadOcclusionInCycle = false;
    };

    const requiredReadyFrames = Math.max(1, this.rule.readyGateFrames ?? 1);

    switch (this.repPhase) {
      case "REST": {
        if (isRest) {
          this.restStableFrames += 1;
          if (this.restStableFrames >= requiredReadyFrames) {
            this.isArmed = true;
          }
          return { halfRepError: null, repCompleted: null, tempoError: null };
        }

        // Ready Posture Gate: do not start a rep if the user entered the frame mid-flexion
        // without first passing through REST posture.
        if (!this.isArmed) {
          return { halfRepError: null, repCompleted: null, tempoError: null };
        }

        if (isTransition) {
          this.repPhase = "TRANSITION";
          this.hasTransitionedIn = true;
          this.hasReachedActive = false;
          this.hasTransitionedOut = false;
          this.phaseFrames = 1;
          this.phaseDurationMs = deltaMs;
          this.eccentricDurationMs = deltaMs;
          this.currentRepPeakRom = 0;
          this.currentRepPeakAngles = {};
          this.lockedRepDominantSide = dominantSide;
          this.hadOcclusionInCycle = false;
          recordPeak();
        } else if (isActive) {
          this.repPhase = "ACTIVE";
          this.hasTransitionedIn = false;
          this.hasReachedActive = false;
          this.hasTransitionedOut = false;
          this.phaseFrames = 1;
          this.phaseDurationMs = deltaMs;
          this.eccentricDurationMs = deltaMs;
          this.currentRepPeakRom = 0;
          this.currentRepPeakAngles = {};
          this.lockedRepDominantSide = dominantSide;
          this.hadOcclusionInCycle = false;
          recordPeak();
        }
        return { halfRepError: null, repCompleted: null, tempoError: null };
      }

      case "TRANSITION": {
        this.phaseFrames += 1;
        this.phaseDurationMs += deltaMs;
        if (!this.hasReachedActive) {
          this.eccentricDurationMs += deltaMs;
        }
        recordPeak();

        if (isActive) {
          this.restReturnFrames = 0;
          let halfRepError: EdgeFormErrorEvent | null = null;
          if (this.hasTransitionedIn && this.hasReachedActive && this.hasTransitionedOut) {
            // User reached bottom, pushed up toward top, but sank back into ACTIVE without locking out!
            // Suppress for lateral_raise in unsupported side view (coronal foreshortening causes 2D tracking jitter across torso line)
            const exerciseSlug = (this.rule.exerciseId || this.rule.displayName || "").toLowerCase();
            const isSideLateralRaise =
              exerciseSlug.includes("lateral_raise") &&
              (this.cameraAngle === "side" || this.resolvedCameraView === "side");
            if (!isSideLateralRaise && this.elapsedDurationMs - this.lastLockoutWarningMs > 2500) {
              this.lastLockoutWarningMs = this.elapsedDurationMs;
              halfRepError = {
                code: "ERR_INCOMPLETE_LOCKOUT",
                message: this.resolveLockoutCueMessage(),
                metric: "lockout",
                severity: 1,
                source: "referee-error",
              };
            }
            this.hasTransitionedOut = false;
          }
          if (this.hasTransitionedIn) {
            this.hasReachedActive = true;
          }
          this.repPhase = "ACTIVE";
          return { halfRepError, repCompleted: null, tempoError: null };
        }

        if (isRest) {
          this.restReturnFrames += 1;
          // Need 2 REST frames so a 1-frame spike cannot close the rep; an upright torso
          // (standing up from a push-up) does not count as returning to the top either.
          if (
            this.restReturnFrames < 2 ||
            this.uprightStreakFrames > 0 ||
            this.lowHandsStreakFrames > 0
          ) {
            return { halfRepError: null, repCompleted: null, tempoError: null };
          }

          let repCompleted: { count: number; romPercentage: number; counted: boolean } | null =
            null;
          let halfRepError: EdgeFormErrorEvent | null = null;
          let tempoError: EdgeFormErrorEvent | null = null;

          if (this.hasTransitionedIn && this.hasReachedActive) {
            tempoError = checkTempoFault();
            repCompleted = completeRep();
          } else if (
            this.hasTransitionedIn &&
            !this.hasReachedActive &&
            this.hadOcclusionInCycle &&
            this.currentRepPeakRom >= 35
          ) {
            // Peak was briefly occluded near bottom/top of movement: avoid false Half-Rep penalty
            repCompleted = null;
          } else if (
            this.hasTransitionedIn &&
            !this.hasReachedActive &&
            this.phaseDurationMs >= 350 &&
            this.phaseFrames >= 4 &&
            this.currentRepPeakRom >= 30 &&
            this.elapsedDurationMs - this.lastDepthWarningMs > 2500
          ) {
            // Suppress unobservable 2D front-view squat/lunge depth (sagittal knee flexion foreshortened along line of sight)
            const isFrontSagittalKnee =
              ((this.rule.exerciseId || "").includes("squat") ||
                (this.rule.exerciseId || "").includes("lunge")) &&
              (this.cameraAngle === "front" || this.resolvedCameraView === "front");
            if (!isFrontSagittalKnee) {
              this.lastDepthWarningMs = this.elapsedDurationMs;
              halfRepError = {
                code: "ERR_INCORRECT_DEPTH",
                message: this.resolveDepthCueMessage(),
                metric: "depth",
                severity: 1,
                source: "referee-error",
              };
            }
          }

          resetCycle();
          this.restStableFrames = 1;
          return { halfRepError, repCompleted, tempoError };
        }

        // Proactive coaching cue: user is bouncing mid-range without reaching ACTIVE or REST for > 2.5s
        if (
          this.hasTransitionedIn &&
          !this.hasReachedActive &&
          this.phaseDurationMs > 2500 &&
          this.currentRepPeakRom >= 25 &&
          this.elapsedDurationMs - this.lastDepthWarningMs > 3000 &&
          !(
            ((this.rule.exerciseId || "").includes("squat") ||
              (this.rule.exerciseId || "").includes("lunge")) &&
            (this.cameraAngle === "front" || this.resolvedCameraView === "front")
          )
        ) {
          this.lastDepthWarningMs = this.elapsedDurationMs;
          return {
            halfRepError: {
              code: "ERR_INCORRECT_DEPTH",
              message: this.resolveDepthCueMessage(),
              metric: "depth",
              severity: 1,
              source: "referee-error",
            },
            repCompleted: null,
            tempoError: null,
          };
        }

        this.restReturnFrames = 0;
        if (isTransition && this.hasReachedActive && rom <= 55) {
          this.hasTransitionedOut = true;
        }
        return { halfRepError: null, repCompleted: null, tempoError: null };
      }

      case "ACTIVE": {
        this.phaseFrames += 1;
        this.phaseDurationMs += deltaMs;
        recordPeak();

        // Proactive coaching cue: stuck at the bottom of the movement for > 3.0s (only for bottom-active movements)
        const exerciseSlug = (this.rule.exerciseId || this.rule.displayName || "").toLowerCase();
        const isBottomActiveExercise =
          exerciseSlug.includes("squat") ||
          exerciseSlug.includes("lunge") ||
          exerciseSlug.includes("push_up") ||
          exerciseSlug.includes("pushup") ||
          exerciseSlug.includes("dip");
        if (
          isBottomActiveExercise &&
          this.phaseDurationMs > 3000 &&
          this.elapsedDurationMs - this.lastBottomStuckWarningMs > 3500
        ) {
          this.lastBottomStuckWarningMs = this.elapsedDurationMs;
          const msg =
            exerciseSlug.includes("squat") || exerciseSlug.includes("lunge")
              ? "Đang ở đáy động tác, hãy đứng thẳng dậy!"
              : "Đang ở đáy động tác, hãy đẩy người lên!";
          return {
            halfRepError: {
              code: "ERR_STALLED_AT_BOTTOM",
              message: msg,
              metric: "depth",
              severity: 1,
              source: "referee-error",
            },
            repCompleted: null,
            tempoError: null,
          };
        }

        if (isTransition) {
          if (this.hasReachedActive && rom <= 55) {
            this.hasTransitionedOut = true;
          }
          this.repPhase = "TRANSITION";
          return { halfRepError: null, repCompleted: null, tempoError: null };
        }

        if (isRest) {
          // Same posture-gate hold as TRANSITION -> REST (bottom -> standing jump in one frame).
          if (this.uprightStreakFrames > 0 || this.lowHandsStreakFrames > 0) {
            return { halfRepError: null, repCompleted: null, tempoError: null };
          }
          let repCompleted: { count: number; romPercentage: number; counted: boolean } | null =
            null;
          let tempoError: EdgeFormErrorEvent | null = null;
          if (
            this.hasTransitionedIn &&
            this.hasReachedActive &&
            this.phaseFrames >= 8 &&
            this.phaseDurationMs >= 400
          ) {
            tempoError = checkTempoFault();
            repCompleted = completeRep();
          }
          resetCycle();
          this.restStableFrames = 1;
          return { halfRepError: null, repCompleted, tempoError };
        }

        if (isActive && !this.hasReachedActive && this.phaseFrames >= 15) {
          this.hasTransitionedIn = true;
          this.hasReachedActive = true;
        }
        return { halfRepError: null, repCompleted: null, tempoError: null };
      }
    }
  }

  private resolveDepthCueMessage(): string {
    const slug = (this.rule.exerciseId || this.rule.displayName || "").toLowerCase();
    if (slug.includes("push_up") || slug.includes("pushup") || slug.includes("dip") || slug.includes("press")) {
      return "Chưa đủ biên độ, hãy hạ ngực sâu hơn để tính rep!";
    }
    if (slug.includes("squat") || slug.includes("lunge")) {
      return "Chưa đủ biên độ, hãy hạ đùi sâu hơn để tính rep!";
    }
    if (slug.includes("curl")) {
      return "Chưa đủ biên độ, hãy gập tay cao hơn để tính rep!";
    }
    if (slug.includes("lateral_raise") || slug.includes("raise")) {
      return "Chưa đủ biên độ, hãy nâng tay cao ngang vai để tính rep!";
    }
    return "Chưa đủ biên độ, hãy hạ sâu hơn!";
  }

  private resolveLockoutCueMessage(): string {
    const slug = (this.rule.exerciseId || this.rule.displayName || "").toLowerCase();
    if (slug.includes("push_up") || slug.includes("pushup") || slug.includes("dip") || slug.includes("press")) {
      return "Đẩy thẳng tay khóa khớp ở đỉnh để tính rep!";
    }
    if (slug.includes("squat") || slug.includes("lunge")) {
      return "Đứng thẳng người lên hết cỡ để tính rep!";
    }
    if (slug.includes("curl") || slug.includes("pull_up") || slug.includes("pullup")) {
      return "Hạ duỗi thẳng tay ở cuối động tác để tính rep!";
    }
    if (slug.includes("lateral_raise") || slug.includes("raise")) {
      return "Hạ tay xuống sát thân người để hoàn thành rep!";
    }
    return "Hãy trở về tư thế ban đầu để hoàn thành rep!";
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
