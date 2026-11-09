// Biomechanical rule evaluator ported from Go rule_evaluator.go

import {
  type ChallengeType,
  type ExerciseMotionRule,
  type FormulaType,
  type PhaseThresholds,
  hasThresholdCondition,
  matchesThresholdCondition,
  resolveCriterionSeverity,
} from "@/features/workout/domain/rule-parser";
import type { CueSeverity } from "@/features/workout/model/live-session.types";

export interface SkeletonPoint {
  index: number;
  x: number;
  y: number;
  z?: number;
  visibility: number;
}

export interface EvaluatedViolation {
  code: string;
  metric: string;
  severity: CueSeverity;
  value: number;
  audioCue: string;
}

export interface EvaluationResult {
  passed: boolean;
  formScore: number;
  detectedErrors: string[];
  violations: EvaluatedViolation[];
  audioCue: string;
  calculatedAngle: number;
  hasCalculatedAngle?: boolean;
  activePhaseName: string;
  metricValues: Record<string, number>;
}

const COCO_BILATERAL_MIRROR: Record<number, number> = {
  1: 2,
  3: 4,
  5: 6,
  7: 8,
  9: 10,
  11: 12,
  13: 14,
  15: 16,
};

export function cocoBilateralMirror(jointIdx: number): number | null {
  return COCO_BILATERAL_MIRROR[jointIdx] ?? null;
}

export function calculateJointAngle(
  a: SkeletonPoint,
  b: SkeletonPoint,
  c: SkeletonPoint,
): number | null {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const baZ = (a.z ?? 0) - (b.z ?? 0);

  const bcX = c.x - b.x;
  const bcY = c.y - b.y;
  const bcZ = (c.z ?? 0) - (b.z ?? 0);

  const dot = baX * bcX + baY * bcY + baZ * bcZ;
  const magBA = Math.hypot(baX, baY, baZ);
  const magBC = Math.hypot(bcX, bcY, bcZ);

  if (magBA < 1e-6 || magBC < 1e-6) {
    return null;
  }

  const cosTheta = Math.min(1.0, Math.max(-1.0, dot / (magBA * magBC)));
  return Math.acos(cosTheta) * (180.0 / Math.PI);
}

export function calculatePointToLineDistanceRatio(
  a: SkeletonPoint,
  b: SkeletonPoint,
  c: SkeletonPoint,
): number | null {
  const torsoLen = Math.hypot(b.x - a.x, b.y - a.y);
  if (torsoLen < 1e-6) {
    return null;
  }

  const lineDx = c.x - a.x;
  const lineDy = c.y - a.y;
  const lineLen = Math.hypot(lineDx, lineDy);
  if (lineLen < 1e-6) {
    return null;
  }

  const cross = lineDx * (b.y - a.y) - lineDy * (b.x - a.x);
  const dist = Math.abs(cross / lineLen);
  return dist / torsoLen;
}

export function calculateVerticalAngle(a: SkeletonPoint, b: SkeletonPoint): number | null {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (dx < 1e-6 && dy < 1e-6) {
    return null;
  }
  return Math.atan2(dx, dy) * (180.0 / Math.PI);
}

export function calculateHorizontalAngle(a: SkeletonPoint, b: SkeletonPoint): number | null {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (dx < 1e-6 && dy < 1e-6) {
    return null;
  }
  return Math.atan2(dy, dx) * (180.0 / Math.PI);
}

export function calculateHorizontalOffsetRatio(
  a: SkeletonPoint,
  b: SkeletonPoint,
  torsoLen: number,
): number | null {
  const effectiveTorso = torsoLen >= 1e-6 ? torsoLen : Math.hypot(b.x - a.x, b.y - a.y);
  if (effectiveTorso < 1e-6) {
    return null;
  }
  return Math.abs(b.x - a.x) / effectiveTorso;
}

export function calculateVerticalDiffRatio(
  a: SkeletonPoint,
  b: SkeletonPoint,
  torsoLen: number,
): number | null {
  const effectiveTorso = torsoLen >= 1e-6 ? torsoLen : Math.hypot(b.x - a.x, b.y - a.y);
  if (effectiveTorso < 1e-6) {
    return null;
  }
  return Math.abs(b.y - a.y) / effectiveTorso;
}

export function resolveTorsoLength(
  landmarkMap: Map<number, SkeletonPoint>,
  minConfidence: number,
): number {
  const sL = landmarkMap.get(5);
  const hL = landmarkMap.get(11);
  const lenL =
    sL && hL && sL.visibility >= minConfidence && hL.visibility >= minConfidence
      ? Math.hypot(sL.x - hL.x, sL.y - hL.y)
      : 0;

  const sR = landmarkMap.get(6);
  const hR = landmarkMap.get(12);
  const lenR =
    sR && hR && sR.visibility >= minConfidence && hR.visibility >= minConfidence
      ? Math.hypot(sR.x - hR.x, sR.y - hR.y)
      : 0;

  if (lenL > 1e-6 && lenR > 1e-6 && sL && hL && sR && hR) {
    if (sR.visibility + hR.visibility > sL.visibility + hL.visibility + 0.05) {
      return lenR;
    }
    return lenL;
  }
  if (lenL > 1e-6) {
    return lenL;
  }
  if (lenR > 1e-6) {
    return lenR;
  }

  const mpS = landmarkMap.get(11);
  const mpH = landmarkMap.get(23);
  if (mpS && mpH && mpS.visibility >= minConfidence && mpH.visibility >= minConfidence) {
    return Math.hypot(mpS.x - mpH.x, mpS.y - mpH.y);
  }
  return 0;
}

export function resolveDominantJoints(
  landmarkMap: Map<number, SkeletonPoint>,
  joints: number[],
  minConfidence: number,
): SkeletonPoint[] | null {
  if (joints.length === 0) {
    return null;
  }

  const primaryPts = joints.map((j) => landmarkMap.get(j));
  const primaryValid = primaryPts.every(
    (p): p is SkeletonPoint => p !== undefined && p.visibility >= minConfidence,
  );
  const primaryVisSum = primaryValid ? primaryPts.reduce((sum, p) => sum + p.visibility, 0) : 0;

  const mirrorPts = joints.map((j) => {
    const mj = cocoBilateralMirror(j);
    if (mj !== null) {
      return landmarkMap.get(mj);
    }
    if (j === 0) {
      return landmarkMap.get(0);
    }
    return undefined;
  });
  const mirrorValid = mirrorPts.every(
    (p): p is SkeletonPoint => p !== undefined && p.visibility >= minConfidence,
  );
  const mirrorVisSum = mirrorValid ? mirrorPts.reduce((sum, p) => sum + p.visibility, 0) : 0;

  if (mirrorValid && (!primaryValid || mirrorVisSum > primaryVisSum + 0.05)) {
    return mirrorPts;
  }
  if (primaryValid) {
    return primaryPts;
  }
  return null;
}

export function calculateBilateralWidthRatio(
  landmarkMap: Map<number, SkeletonPoint>,
  joints: number[],
  minConfidence: number,
): number | null {
  if (joints.length < 2) {
    return null;
  }
  const jRef = joints[0]!;
  const jTarget = joints[1]!;
  const refR = cocoBilateralMirror(jRef);
  const targetR = cocoBilateralMirror(jTarget);
  if (refR === null || targetR === null) {
    return null;
  }

  const pRefL = landmarkMap.get(jRef);
  const pRefR = landmarkMap.get(refR);
  const pTarL = landmarkMap.get(jTarget);
  const pTarR = landmarkMap.get(targetR);
  if (!pRefL || !pRefR || !pTarL || !pTarR) {
    return null;
  }
  if (
    pRefL.visibility < minConfidence ||
    pRefR.visibility < minConfidence ||
    pTarL.visibility < minConfidence ||
    pTarR.visibility < minConfidence
  ) {
    return null;
  }

  const refWidth = Math.abs(pRefL.x - pRefR.x);
  if (refWidth < 1e-6) {
    return null;
  }
  const tarWidth = Math.abs(pTarL.x - pTarR.x);
  return tarWidth / refWidth;
}

export function evaluateCriterionMetric(
  landmarkMap: Map<number, SkeletonPoint>,
  formula: FormulaType,
  name: string,
  joints: number[],
  minConfidence: number,
  torsoLen: number,
): number | null {
  if (formula === "BILATERAL_WIDTH_RATIO") {
    return calculateBilateralWidthRatio(landmarkMap, joints, minConfidence);
  }

  if (joints.length === 2 && formula === "VERTICAL_DIFF_RATIO") {
    const mirrorJ = cocoBilateralMirror(joints[0]!);
    if (mirrorJ !== null && mirrorJ === joints[1]) {
      const pL = landmarkMap.get(joints[0]!);
      const pR = landmarkMap.get(joints[1]!);
      const minSymConf = Math.max(minConfidence, 0.65);
      if (!pL || !pR || pL.visibility < minSymConf || pR.visibility < minSymConf) {
        return null;
      }
      return calculateVerticalDiffRatio(pL, pR, torsoLen);
    }
  }

  if (name === "ankle_lift" && joints.length === 2) {
    const pts = resolveDominantJoints(landmarkMap, joints, minConfidence);
    if (!pts || torsoLen < 1e-6) {
      return null;
    }
    const pHip = pts[0]!;
    const pAnkle = pts[1]!;
    if (pAnkle.y >= pHip.y) {
      return 0;
    }
    return (pHip.y - pAnkle.y) / torsoLen;
  }

  if (name === "knee_over_toe" && joints.length >= 2) {
    const jKneeL = joints[0]!;
    const jAnkleL = joints[1]!;
    const jKneeR = cocoBilateralMirror(jKneeL);
    const jAnkleR = cocoBilateralMirror(jAnkleL);

    const pKL = landmarkMap.get(jKneeL);
    const pAL = landmarkMap.get(jAnkleL);
    const valL =
      pKL && pAL && pKL.visibility >= minConfidence && pAL.visibility >= minConfidence
        ? calculateHorizontalOffsetRatio(pKL, pAL, torsoLen)
        : null;

    const pKR = jKneeR !== null ? landmarkMap.get(jKneeR) : undefined;
    const pAR = jAnkleR !== null ? landmarkMap.get(jAnkleR) : undefined;
    const valR =
      pKR && pAR && pKR.visibility >= minConfidence && pAR.visibility >= minConfidence
        ? calculateHorizontalOffsetRatio(pKR, pAR, torsoLen)
        : null;

    if (valL !== null && valR !== null) {
      return Math.max(valL, valR);
    }
    if (valL !== null) {
      return valL;
    }
    if (valR !== null) {
      return valR;
    }
  }

  if ((name === "knee_angle" || name === "elbow_angle") && joints.length === 3) {
    const ptsL = resolveDominantJoints(landmarkMap, joints, minConfidence);
    const mj0 = cocoBilateralMirror(joints[0]!) ?? joints[0]!;
    const mj1 = cocoBilateralMirror(joints[1]!) ?? joints[1]!;
    const mj2 = cocoBilateralMirror(joints[2]!) ?? joints[2]!;
    const ptsR = resolveDominantJoints(landmarkMap, [mj0, mj1, mj2], minConfidence);
    if (ptsL && ptsR) {
      const angL = calculateJointAngle(ptsL[0]!, ptsL[1]!, ptsL[2]!);
      const angR = calculateJointAngle(ptsR[0]!, ptsR[1]!, ptsR[2]!);
      if (angL !== null && angR !== null) {
        return Math.min(angL, angR);
      }
    }
  }

  const pts = resolveDominantJoints(landmarkMap, joints, minConfidence);
  if (!pts) {
    return null;
  }

  if (pts.length >= 3) {
    if (formula === "DISTANCE" || name === "signed_hip_y_diff") {
      return calculatePointToLineDistanceRatio(pts[0]!, pts[1]!, pts[2]!);
    }
    return calculateJointAngle(pts[0]!, pts[1]!, pts[2]!);
  }

  if (pts.length === 2) {
    switch (formula) {
      case "HORIZONTAL_ANGLE":
        return calculateHorizontalAngle(pts[0]!, pts[1]!);
      case "VERTICAL_ANGLE":
        return calculateVerticalAngle(pts[0]!, pts[1]!);
      case "VERTICAL_DIFF_RATIO":
        return calculateVerticalDiffRatio(pts[0]!, pts[1]!, torsoLen);
      case "HORIZONTAL_OFFSET_RATIO":
      case "DISTANCE":
        return calculateHorizontalOffsetRatio(pts[0]!, pts[1]!, torsoLen);
      default:
        return calculateVerticalAngle(pts[0]!, pts[1]!);
    }
  }

  return null;
}

export function resolvePhaseName(
  th: PhaseThresholds,
  angle: number,
  challengeType: ChallengeType,
): string {
  if (challengeType === "DURATION") {
    if (hasThresholdCondition(th.idle) && matchesThresholdCondition(th.idle, angle)) {
      return "idle";
    }
    return "always";
  }
  if (hasThresholdCondition(th.rest) && matchesThresholdCondition(th.rest, angle)) {
    return "rest";
  }
  if (hasThresholdCondition(th.active) && matchesThresholdCondition(th.active, angle)) {
    return "active";
  }
  if (hasThresholdCondition(th.transition) && matchesThresholdCondition(th.transition, angle)) {
    return "transition";
  }
  return "";
}

export function matchesPhase(applyInPhases: string[], activePhase: string): boolean {
  if (applyInPhases.length === 0 || activePhase === "") {
    return true;
  }
  return applyInPhases.some((ph) => {
    const p = ph.trim().toLowerCase();
    return p === "all" || p === activePhase || (p === "always" && activePhase !== "idle");
  });
}

export function inferCameraView(
  landmarkMap: Map<number, SkeletonPoint>,
  torsoLen: number,
  minConfidence: number,
): "front" | "side" {
  if (torsoLen <= 1e-6) {
    return "front";
  }
  const sL = landmarkMap.get(5);
  const sR = landmarkMap.get(6);
  if (sL && sR && sL.visibility >= minConfidence && sR.visibility >= minConfidence) {
    const shoulderSpan = Math.abs(sL.x - sR.x);
    return shoulderSpan / torsoLen >= 0.45 ? "front" : "side";
  }
  return "side";
}

export function matchesView(criterionView: string, activeView: string): boolean {
  const cView = criterionView.trim().toLowerCase();
  const aView = activeView.trim().toLowerCase();
  if (cView === "" || cView === "all" || aView === "") {
    return true;
  }
  return cView
    .split(",")
    .map((v) => v.trim())
    .includes(aView);
}

export function evaluateMotionRule(
  landmarks: SkeletonPoint[],
  rule: ExerciseMotionRule | null,
  cameraAngle = "auto",
): EvaluationResult {
  if (!rule) {
    return {
      activePhaseName: "",
      audioCue: "Bài tập chưa có quy tắc chấm form!",
      calculatedAngle: 0,
      detectedErrors: ["ERR_RULE_NOT_CONFIGURED"],
      formScore: 0,
      hasCalculatedAngle: false,
      metricValues: {},
      passed: false,
      violations: [],
    };
  }

  if (landmarks.length === 0) {
    return {
      activePhaseName: "",
      audioCue: "Vui lòng đứng vào trong khung hình camera!",
      calculatedAngle: 0,
      detectedErrors: ["ERR_NO_PERSON_DETECTED"],
      formScore: 0,
      hasCalculatedAngle: false,
      metricValues: {},
      passed: false,
      violations: [],
    };
  }

  const landmarkMap = new Map<number, SkeletonPoint>();
  for (const lm of landmarks) {
    landmarkMap.set(lm.index, lm);
  }

  const minConfidence = rule.minConfidence > 0 ? rule.minConfidence : 0.5;
  const torsoLen = resolveTorsoLength(landmarkMap, minConfidence);

  const detectedErrors: string[] = [];
  const violations: EvaluatedViolation[] = [];
  const metricValues: Record<string, number> = {};
  let firstAudioCue = "";
  let totalScore = 100.0;
  let primaryAngle: number | null = null;
  let trajectoryAngle: number | null = null;
  let activePhaseName = "";

  if (rule.phaseDetection && rule.phaseDetection.calculation.joints.length >= 2) {
    const pd = rule.phaseDetection;
    const pdFormula: FormulaType =
      pd.calculation.formula ||
      (pd.calculation.joints.length >= 3 ? "ANGLE_3D" : "HORIZONTAL_ANGLE");
    const ang = evaluateCriterionMetric(
      landmarkMap,
      pdFormula,
      pd.metric,
      pd.calculation.joints,
      minConfidence,
      torsoLen,
    );
    if (ang !== null) {
      trajectoryAngle = ang;
      if (pd.metric) {
        metricValues[pd.metric] = ang;
      }
      activePhaseName = resolvePhaseName(pd.thresholds, ang, rule.challengeType);
    }
  }

  const rawView = (cameraAngle || rule.recommendedCameraAngle || "auto").trim().toLowerCase();
  const activeView =
    rawView === "auto" ? inferCameraView(landmarkMap, torsoLen, minConfidence) : rawView;

  for (const criterion of rule.rules) {
    if (!matchesView(criterion.applyForView, activeView)) {
      continue;
    }
    if (trajectoryAngle !== null && !matchesPhase(criterion.applyInPhases, activePhaseName)) {
      continue;
    }
    if (criterion.joints.length < 2) {
      continue;
    }

    const metricVal = evaluateCriterionMetric(
      landmarkMap,
      criterion.formula,
      criterion.name,
      criterion.joints,
      minConfidence,
      torsoLen,
    );
    if (metricVal === null) {
      continue;
    }

    metricValues[criterion.name] = metricVal;

    if (
      criterion.joints.length >= 3 &&
      criterion.formula === "ANGLE_3D" &&
      trajectoryAngle === null &&
      primaryAngle === null
    ) {
      primaryAngle = metricVal;
    }

    const penalty = criterion.penaltyPerError > 0 ? criterion.penaltyPerError : 5.0;

    if (criterion.validRange.min > 0 && metricVal < criterion.validRange.min) {
      const errCode = criterion.errorCodeBelow || "ERR_ANGLE_TOO_ACUTE";
      const severity = resolveCriterionSeverity(criterion.ranges, metricVal);
      detectedErrors.push(errCode);
      violations.push({
        audioCue: criterion.audioCue,
        code: errCode,
        metric: criterion.name,
        severity,
        value: metricVal,
      });
      totalScore -= penalty;
      if (!firstAudioCue && criterion.audioCue) {
        firstAudioCue = criterion.audioCue;
      }
    } else if (criterion.validRange.max > 0 && metricVal > criterion.validRange.max) {
      const errCode = criterion.errorCodeAbove || "ERR_ANGLE_TOO_OBTUSE";
      const severity = resolveCriterionSeverity(criterion.ranges, metricVal);
      detectedErrors.push(errCode);
      violations.push({
        audioCue: criterion.audioCue,
        code: errCode,
        metric: criterion.name,
        severity,
        value: metricVal,
      });
      totalScore -= penalty;
      if (!firstAudioCue && criterion.audioCue) {
        firstAudioCue = criterion.audioCue;
      }
    }
  }

  const clampedScore = Math.max(0, totalScore);
  const hasCalculatedAngle = trajectoryAngle !== null || primaryAngle !== null;
  const finalAngle = trajectoryAngle ?? primaryAngle ?? 0;

  return {
    activePhaseName,
    audioCue: firstAudioCue,
    calculatedAngle: finalAngle,
    detectedErrors,
    formScore: clampedScore,
    hasCalculatedAngle,
    metricValues,
    passed: detectedErrors.length === 0,
    violations,
  };
}
