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

export type InsufficientDataReason =
  | "UNSUPPORTED_CAMERA_VIEW"
  | "LOW_KEYPOINT_VISIBILITY"
  | "DEGENERATE_GEOMETRY"
  | "PHASE_NOT_ACTIVE";

export interface InsufficientCriterionReport {
  metric: string;
  reason: InsufficientDataReason;
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
  activeView?: "front" | "side" | "oblique";
  metricValues: Record<string, number>;
  insufficientDataRules?: InsufficientCriterionReport[];
  dominantSide?: "left" | "right" | null;
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

// Deviation of b from line a->c over torso length: > 0 sags (HIP_SAG), < 0 pikes (HIP_PIKE).
// Null for a tiny torso, a folded body (|ac| < 0.8 torso) or a near-vertical line (|dx| < 0.35 |ac|).
export function calculateSignedPointToLineDistanceRatio(
  a: SkeletonPoint,
  b: SkeletonPoint,
  c: SkeletonPoint,
): number | null {
  const torsoLen = Math.hypot(b.x - a.x, b.y - a.y);
  if (torsoLen < 1e-4) {
    return null;
  }

  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const lineLen = Math.hypot(dx, dy);
  const legLen = Math.hypot(c.x - b.x, c.y - b.y);
  // Reject collapsed/bunched-up skeletons (e.g. Nano model collapsing legs onto elbows in dark-on-dark frames)
  if (lineLen < 1.25 * torsoLen || legLen < 0.6 * torsoLen) {
    return null;
  }

  const absDx = Math.abs(dx);
  if (absDx < 0.35 * lineLen) {
    return null;
  }

  const sx = dx >= 0 ? 1 : -1;
  const signedNum = -(b.x - a.x) * sx * dy + (b.y - a.y) * absDx;
  return signedNum / (lineLen * torsoLen);
}

// Horizontal offset of b from a over torso length; with facingSign (+1 facing right, -1 left)
// a positive value always means forward.
export function calculateSignedHorizontalOffsetRatio(
  a: SkeletonPoint,
  b: SkeletonPoint,
  torsoLen: number,
  facingSign = 1,
): number | null {
  const effectiveTorso = torsoLen >= 1e-6 ? torsoLen : Math.hypot(b.x - a.x, b.y - a.y);
  if (effectiveTorso < 1e-6) {
    return null;
  }
  const sign = facingSign >= 0 ? 1 : -1;
  return ((b.x - a.x) * sign) / effectiveTorso;
}

export function calculateVerticalAngle(a: SkeletonPoint, b: SkeletonPoint): number | null {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (dx < 1e-6 && dy < 1e-6) {
    return null;
  }
  return Math.atan2(dx, dy) * (180.0 / Math.PI);
}

/** Max tilt (deg) of mid-shoulder→mid-hip from vertical for an upright torso. */
export const UPRIGHT_TORSO_MAX_TILT_DEG = 35;
/** Min torso length / shoulder span for upright; rejects foreshortened front-view prone torsos. */
export const UPRIGHT_TORSO_MIN_LENGTH_TO_SPAN = 0.8;

// Upright = standing, sitting or kneeling tall; null when shoulders or hips are not visible.
// aspect = width / height, since x and y are normalized separately.
export function isUprightTorso(pts: SkeletonPoint[], aspect = 1, minVis = 0.3): boolean | null {
  const ls = pts[5], rs = pts[6], lh = pts[11], rh = pts[12];
  if (!ls || !rs || !lh || !rh) {
    return null;
  }
  if ((ls.visibility + rs.visibility) / 2 < minVis || (lh.visibility + rh.visibility) / 2 < minVis) {
    return null;
  }
  const dx = ((lh.x + rh.x) / 2 - (ls.x + rs.x) / 2) * aspect;
  const dy = (lh.y + rh.y) / 2 - (ls.y + rs.y) / 2;
  const torsoLen = Math.hypot(dx, dy);
  if (torsoLen < 1e-4) {
    return null;
  }
  const tiltFromDownDeg = Math.acos(Math.max(-1, Math.min(1, dy / torsoLen))) * (180 / Math.PI);
  const shoulderSpan = Math.abs(ls.x - rs.x) * aspect;
  return (
    tiltFromDownDeg < UPRIGHT_TORSO_MAX_TILT_DEG &&
    torsoLen >= UPRIGHT_TORSO_MIN_LENGTH_TO_SPAN * shoulderSpan
  );
}

export function areHandsBelowChest(pts: SkeletonPoint[], minVis = 0.25): boolean | null {
  const ls = pts[5], rs = pts[6], lh = pts[11], rh = pts[12];
  if (!ls || !rs || !lh || !rh) {
    return null;
  }
  const shVis = (ls.visibility + rs.visibility) / 2;
  const hipVis = (lh.visibility + rh.visibility) / 2;
  if (shVis < minVis || hipVis < minVis) {
    return null;
  }
  const shY = (ls.y + rs.y) / 2;
  const hipY = (lh.y + rh.y) / 2;
  const torsoLen = Math.abs(hipY - shY);
  if (torsoLen < 1e-4) {
    return null;
  }

  const lw = pts[9], rw = pts[10];
  const rL = lw && lw.visibility >= minVis ? (lw.y - shY) / torsoLen : null;
  const rR = rw && rw.visibility >= minVis ? (rw.y - shY) / torsoLen : null;
  if (rL === null && rR === null) {
    return null;
  }

  const validRatios: number[] = [];
  if (rL !== null) validRatios.push(rL);
  if (rR !== null) validRatios.push(rR);

  const maxR = Math.max(...validRatios);
  const minR = Math.min(...validRatios);

  // Both hands resting below 0.60 torsoLen (e.g. resting on thighs or hanging down)
  if (minR > 0.60) {
    return true;
  }
  // One hand hanging down at hip (> 0.65) and neither hand overhead (> 0.10) (talking/gesturing idle)
  if (maxR > 0.65 && minR > 0.10) {
    return true;
  }

  return false;
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
  aspect = 1.0,
): number {
  const sL = landmarkMap.get(5);
  const hL = landmarkMap.get(11);
  const lenL =
    sL && hL && sL.visibility >= minConfidence && hL.visibility >= minConfidence
      ? Math.hypot((sL.x - hL.x) * aspect, sL.y - hL.y)
      : 0;

  const sR = landmarkMap.get(6);
  const hR = landmarkMap.get(12);
  const lenR =
    sR && hR && sR.visibility >= minConfidence && hR.visibility >= minConfidence
      ? Math.hypot((sR.x - hR.x) * aspect, sR.y - hR.y)
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
    return Math.hypot((mpS.x - mpH.x) * aspect, mpS.y - mpH.y);
  }
  return 0;
}

export function resolveDominantJoints(
  landmarkMap: Map<number, SkeletonPoint>,
  joints: number[],
  minConfidence: number,
  preferredSide?: "left" | "right" | null,
): SkeletonPoint[] | null {
  if (joints.length === 0) {
    return null;
  }

  const minJointFloor = Math.min(minConfidence, 0.15);
  const minSumRequired = minConfidence * joints.length;

  const primaryPts = joints.map((j) => landmarkMap.get(j));
  const primaryVisSum = primaryPts.reduce((sum, p) => sum + (p?.visibility ?? 0), 0);
  const primaryValid =
    primaryVisSum >= minSumRequired &&
    primaryPts.every(
      (p): p is SkeletonPoint => p !== undefined && p.visibility >= minJointFloor,
    );

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
  const mirrorVisSum = mirrorPts.reduce((sum, p) => sum + (p?.visibility ?? 0), 0);
  const mirrorValid =
    mirrorVisSum >= minSumRequired &&
    mirrorPts.every(
      (p): p is SkeletonPoint => p !== undefined && p.visibility >= minJointFloor,
    );

  // Dominant side hysteresis: if a side is already locked during an active rep and has comparable visibility,
  // keep that side unless the opposite side is significantly clearer (> 0.08 per joint).
  if (preferredSide === "left" && primaryValid) {
    const hysteresisMargin = 0.08 * joints.length;
    if (!mirrorValid || mirrorVisSum <= primaryVisSum + hysteresisMargin) {
      return primaryPts;
    }
  } else if (preferredSide === "right" && mirrorValid) {
    const hysteresisMargin = 0.08 * joints.length;
    if (!primaryValid || primaryVisSum <= mirrorVisSum + hysteresisMargin) {
      return mirrorPts;
    }
  }

  if (mirrorValid && (!primaryValid || mirrorVisSum > primaryVisSum + 0.05)) {
    return mirrorPts;
  }
  if (primaryValid) {
    return primaryPts;
  }
  return null;
}

export function inferDominantSide(
  landmarkMap: Map<number, SkeletonPoint>,
  minConfidence: number,
  preferredSide?: "left" | "right" | null,
  focusJoints?: number[],
): "left" | "right" | null {
  const baseJoints =
    focusJoints && focusJoints.length >= 2 ? focusJoints : [5, 7, 9, 11, 13, 15];
  const leftIndices = baseJoints.map((j) => (j % 2 === 0 && j > 0 ? j - 1 : j));
  const rightIndices = leftIndices.map((j) => cocoBilateralMirror(j) ?? j);
  let leftSum = 0;
  let leftValidCount = 0;
  let rightSum = 0;
  let rightValidCount = 0;

  for (const idx of leftIndices) {
    const p = landmarkMap.get(idx);
    if (p && p.visibility >= minConfidence) {
      leftSum += p.visibility;
      leftValidCount += 1;
    }
  }
  for (const idx of rightIndices) {
    const p = landmarkMap.get(idx);
    if (p && p.visibility >= minConfidence) {
      rightSum += p.visibility;
      rightValidCount += 1;
    }
  }

  if (leftValidCount === 0 && rightValidCount === 0) {
    return null;
  }
  const margin = 0.08 * leftIndices.length;
  if (preferredSide === "left" && leftValidCount === leftIndices.length && rightSum <= leftSum + margin) {
    return "left";
  }
  if (preferredSide === "right" && rightValidCount === rightIndices.length && leftSum <= rightSum + margin) {
    return "right";
  }
  return rightSum > leftSum + 0.05 ? "right" : "left";
}

export function resolveFacingSign(landmarkMap: Map<number, SkeletonPoint>): number {
  const nose = landmarkMap.get(0);
  const sL = landmarkMap.get(5);
  const sR = landmarkMap.get(6);
  const shoulderX =
    sL && sR ? (sL.x + sR.x) / 2 : sL ? sL.x : sR ? sR.x : undefined;
  if (nose && shoulderX !== undefined && nose.visibility >= 0.3) {
    const diff = nose.x - shoulderX;
    if (Math.abs(diff) > 0.01) {
      return diff >= 0 ? 1 : -1;
    }
  }
  const kL = landmarkMap.get(13);
  const aL = landmarkMap.get(15);
  if (kL && aL && Math.abs(kL.x - aL.x) > 0.01) {
    return kL.x >= aL.x ? 1 : -1;
  }
  return 1;
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
  preferredSide?: "left" | "right" | null,
  aspect = 1.0,
): number | null {
  if (formula === "BILATERAL_WIDTH_RATIO") {
    const ratio = calculateBilateralWidthRatio(landmarkMap, joints, minConfidence);
    if (ratio === null) {
      return null;
    }
    // Knee valgus needs the shin tilted inward >= 13 deg; feet wider than knees with vertical
    // shins is a normal squat stance.
    if (name.includes("knee_valgus") && joints.length >= 2) {
      const pAnkleL = landmarkMap.get(joints[0]!);
      const pAnkleR = landmarkMap.get(cocoBilateralMirror(joints[0]!) ?? -1);
      const pKneeL = landmarkMap.get(joints[1]!);
      const pKneeR = landmarkMap.get(cocoBilateralMirror(joints[1]!) ?? -1);
      if (pAnkleL && pAnkleR && pKneeL && pKneeR) {
        const midAnkleX = (pAnkleL.x + pAnkleR.x) / 2;
        const dxL = pAnkleL.x >= midAnkleX ? pAnkleL.x - pKneeL.x : pKneeL.x - pAnkleL.x;
        const dyL = Math.abs(pAnkleL.y - pKneeL.y);
        const angleL = dyL > 1e-4 && dxL > 0 ? Math.atan2(dxL * aspect, dyL) * (180 / Math.PI) : 0;

        const dxR = pAnkleR.x <= midAnkleX ? pKneeR.x - pAnkleR.x : pAnkleR.x - pKneeR.x;
        const dyR = Math.abs(pAnkleR.y - pKneeR.y);
        const angleR = dyR > 1e-4 && dxR > 0 ? Math.atan2(dxR * aspect, dyR) * (180 / Math.PI) : 0;

        const maxShinInwardAngle = Math.max(angleL, angleR);
        if (maxShinInwardAngle < 13.0) {
          return 1.0;
        }
      }
    }
    return ratio;
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
    const pts = resolveDominantJoints(landmarkMap, joints, minConfidence, preferredSide);
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
      if (pAL && pAR && Math.abs(pAL.x - pAR.x) > 0.15 * torsoLen) {
        const facing = resolveFacingSign(landmarkMap);
        const isLeftForward = (pAL.x - pAR.x) * facing > 0;
        return isLeftForward ? valL : valR;
      }
      if (preferredSide === "left") return valL;
      if (preferredSide === "right") return valR;
      return Math.max(valL, valR);
    }
    if (valL !== null) {
      if (pAL && pAR && Math.abs(pAL.x - pAR.x) > 0.15 * torsoLen) {
        const facing = resolveFacingSign(landmarkMap);
        if ((pAL.x - pAR.x) * facing < 0) return null;
      }
      return valL;
    }
    if (valR !== null) {
      if (pAL && pAR && Math.abs(pAL.x - pAR.x) > 0.15 * torsoLen) {
        const facing = resolveFacingSign(landmarkMap);
        if ((pAR.x - pAL.x) * facing < 0) return null;
      }
      return valR;
    }
  }

  if ((name === "knee_angle" || name === "elbow_angle") && joints.length === 3) {
    if (preferredSide === "left" || preferredSide === "right") {
      const lockedPts = resolveDominantJoints(landmarkMap, joints, minConfidence, preferredSide);
      if (lockedPts) {
        const lockedAng = calculateJointAngle(lockedPts[0]!, lockedPts[1]!, lockedPts[2]!);
        if (lockedAng !== null) {
          return lockedAng;
        }
      }
    }
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

  const pts = resolveDominantJoints(landmarkMap, joints, minConfidence, preferredSide);
  if (!pts) {
    return null;
  }

  if (pts.length >= 3) {
    if (formula === "SIGNED_DISTANCE") {
      return calculateSignedPointToLineDistanceRatio(pts[0]!, pts[1]!, pts[2]!);
    }
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
      case "SIGNED_HORIZONTAL_OFFSET":
        return calculateSignedHorizontalOffsetRatio(
          pts[0]!,
          pts[1]!,
          torsoLen,
          resolveFacingSign(landmarkMap),
        );
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
  aspect = 1.0,
): "front" | "side" | "oblique" {
  if (torsoLen <= 1e-6) {
    return "front";
  }
  const sL = landmarkMap.get(5);
  const sR = landmarkMap.get(6);
  if (sL && sR && sL.visibility >= minConfidence && sR.visibility >= minConfidence) {
    const ratio = (Math.abs(sL.x - sR.x) * aspect) / torsoLen;
    if (ratio >= 0.55) {
      return "front";
    }
    if (ratio >= 0.30) {
      return "oblique";
    }
    return "side";
  }
  return "side";
}

export function matchesView(
  criterionView: string,
  activeView: string,
  formula?: FormulaType,
): boolean {
  const cView = criterionView.trim().toLowerCase();
  const aView = activeView.trim().toLowerCase();
  if (cView === "" || cView === "all" || aView === "") {
    return true;
  }
  const allowed = cView.split(",").map((v) => v.trim());
  if (allowed.includes(aView)) {
    return true;
  }
  // When in oblique view (30-60 deg), allow side-view sagittal rules AND non-width front-view rules
  // (strictly block BILATERAL_WIDTH_RATIO in oblique view unless "oblique" is explicitly listed).
  if (aView === "oblique") {
    if (allowed.includes("side")) {
      return true;
    }
    if (allowed.includes("front") && formula !== "BILATERAL_WIDTH_RATIO") {
      return true;
    }
  }
  return false;
}

export function evaluateMotionRule(
  landmarks: SkeletonPoint[],
  rule: ExerciseMotionRule | null,
  cameraAngle = "auto",
  preferredDominantSide?: "left" | "right" | null,
  aspect = 1.0,
): EvaluationResult {
  if (!rule) {
    return {
      activePhaseName: "",
      audioCue: "Bài tập chưa có quy tắc chấm form!",
      calculatedAngle: 0,
      detectedErrors: ["ERR_RULE_NOT_CONFIGURED"],
      dominantSide: null,
      formScore: 0,
      hasCalculatedAngle: false,
      insufficientDataRules: [],
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
      dominantSide: null,
      formScore: 0,
      hasCalculatedAngle: false,
      insufficientDataRules: [],
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
  const torsoLen = resolveTorsoLength(landmarkMap, minConfidence, aspect);
  const dominantSide = inferDominantSide(
    landmarkMap,
    minConfidence,
    preferredDominantSide,
    rule.phaseDetection?.calculation.joints,
  );

  const detectedErrors: string[] = [];
  const violations: EvaluatedViolation[] = [];
  const metricValues: Record<string, number> = {};
  const insufficientDataRules: InsufficientCriterionReport[] = [];
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
      dominantSide,
      aspect,
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
    rawView === "auto" ? inferCameraView(landmarkMap, torsoLen, minConfidence, aspect) : rawView;

  for (const criterion of rule.rules) {
    if (!matchesView(criterion.applyForView, activeView, criterion.formula)) {
      insufficientDataRules.push({
        metric: criterion.name,
        reason: "UNSUPPORTED_CAMERA_VIEW",
      });
      continue;
    }
    if (trajectoryAngle !== null && !matchesPhase(criterion.applyInPhases, activePhaseName)) {
      insufficientDataRules.push({
        metric: criterion.name,
        reason: "PHASE_NOT_ACTIVE",
      });
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
      dominantSide,
      aspect,
    );
    if (metricVal === null) {
      insufficientDataRules.push({
        metric: criterion.name,
        reason: "LOW_KEYPOINT_VISIBILITY",
      });
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
    const checkMin = criterion.validRange.min !== 0;
    const checkMax = criterion.validRange.max !== 0;

    if (checkMin && metricVal < criterion.validRange.min) {
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
    } else if (checkMax && metricVal > criterion.validRange.max) {
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
    activeView: activeView as "front" | "side" | "oblique",
    audioCue: firstAudioCue,
    calculatedAngle: finalAngle,
    detectedErrors,
    dominantSide,
    formScore: clampedScore,
    hasCalculatedAngle,
    insufficientDataRules,
    metricValues,
    passed: detectedErrors.length === 0,
    violations,
  };
}
