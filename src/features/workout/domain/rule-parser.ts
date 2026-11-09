// Biomechanical rule & dialogue parser ported from Go cached_rule_provider.go

import type { CueSeverity, VoiceFeedbackMetric } from "@/features/workout/model/live-session.types";

export type FormulaType =
  | "ANGLE_3D"
  | "DISTANCE"
  | "HORIZONTAL_OFFSET_RATIO"
  | "VERTICAL_ANGLE"
  | "HORIZONTAL_ANGLE"
  | "BILATERAL_WIDTH_RATIO"
  | "VERTICAL_DIFF_RATIO";

export type ChallengeType = "REPS" | "DURATION";

export interface ThresholdCondition {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  comment?: string;
}

export interface PhaseThresholds {
  rest?: ThresholdCondition;
  transition?: ThresholdCondition;
  active?: ThresholdCondition;
  idle?: ThresholdCondition;
  always?: ThresholdCondition;
}

export interface PhaseCalculation {
  landmarks: string[];
  joints: number[];
  formula: FormulaType;
  description?: string;
}

export interface PhaseDetectionConfig {
  metric: string;
  thresholds: PhaseThresholds;
  calculation: PhaseCalculation;
}

export interface RuleRange {
  severity: number;
  status: string;
  min: number | null;
  max: number | null;
  comment?: string;
}

export interface ValidAngleRange {
  min: number;
  max: number;
}

export interface RuleCriterion {
  name: string;
  formula: FormulaType;
  joints: number[];
  validRange: ValidAngleRange;
  ranges: RuleRange[];
  errorCodeBelow: string;
  errorCodeAbove: string;
  audioCue: string;
  penaltyPerError: number;
  applyForView: string;
  applyInPhases: string[];
}

export interface ExerciseMotionRule {
  exerciseId: string;
  exerciseName: string;
  displayName: string;
  challengeType: ChallengeType;
  repType: "counted" | "timed";
  notes: string;
  minConfidence: number;
  phaseDetection: PhaseDetectionConfig | null;
  rules: RuleCriterion[];
  passCondition: string;
  timeCeilingMs: number;
  violationMaxDurationMs: number;
  recommendedCameraAngle: string;
  voiceFeedbacks?: Record<string, VoiceFeedbackMetric>;
}

const LANDMARK_NUMBER_REGEX = /[pP]?(\d+)/;

const SEMANTIC_LANDMARKS: Record<string, number> = {
  ankle: 15,
  ear: 3,
  elbow: 7,
  eye: 1,
  hip: 11,
  knee: 13,
  left_ankle: 15,
  left_ear: 3,
  left_elbow: 7,
  left_eye: 1,
  left_hip: 11,
  left_knee: 13,
  left_shoulder: 5,
  left_wrist: 9,
  mid_hip: 11,
  mid_shoulder: 5,
  nose: 0,
  right_ankle: 16,
  right_ear: 4,
  right_elbow: 8,
  right_eye: 2,
  right_hip: 12,
  right_knee: 14,
  right_shoulder: 6,
  right_wrist: 10,
  shoulder: 5,
  wrist: 9,
};

export function getSemanticLandmark(name: string): number | null {
  const clean = name.trim().toLowerCase().replace(/-/g, "_");
  return SEMANTIC_LANDMARKS[clean] ?? null;
}

export function parseLandmarkNumbers(landmarks: string[] | undefined): number[] {
  if (!landmarks || !Array.isArray(landmarks)) {
    return [];
  }
  const joints: number[] = [];
  for (const lm of landmarks) {
    if (typeof lm !== "string") {
      continue;
    }
    const match = LANDMARK_NUMBER_REGEX.exec(lm);
    if (match?.[1] !== undefined) {
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) {
        joints.push(parsed);
        continue;
      }
    }
    const idx = getSemanticLandmark(lm);
    if (idx !== null) {
      joints.push(idx);
    }
  }
  return joints;
}

export function classifyFormula(
  metricName: string,
  formulaStr: string,
  numJoints: number,
): FormulaType {
  const m = (metricName || "").trim().toLowerCase();
  const f = (formulaStr || "").trim().toLowerCase();

  if (numJoints >= 3) {
    if (
      m === "signed_hip_y_diff" ||
      m.includes("distance") ||
      m.includes("hip_sag") ||
      m.includes("hip_pike") ||
      f.includes("point_to_line") ||
      f.includes("distance")
    ) {
      return "DISTANCE";
    }
    return "ANGLE_3D";
  }

  if (numJoints === 2) {
    if (
      m.includes("hand_width") ||
      m.includes("stance_width") ||
      m.includes("grip_width") ||
      f.includes("width_ratio") ||
      f.includes("x_shoulder_left - x_shoulder_right")
    ) {
      return "BILATERAL_WIDTH_RATIO";
    }
    if (m.includes("incline") || f.includes("arctan2(y_") || f.includes("horizontal")) {
      return "HORIZONTAL_ANGLE";
    }
    if (
      m.includes("spine_sway") ||
      m.includes("torso_lean") ||
      m.includes("trunk_lean") ||
      m.includes("back_lean") ||
      m.includes("torso_incline") ||
      f.includes("vertical") ||
      f.includes("arccos")
    ) {
      return "VERTICAL_ANGLE";
    }
    if (
      m.includes("chin") ||
      m.includes("wrist_symmetry") ||
      m.includes("foot_lift") ||
      m.includes("ankle_lift") ||
      m.includes("vertical_diff") ||
      f.includes("y_diff")
    ) {
      return "VERTICAL_DIFF_RATIO";
    }
    return "HORIZONTAL_OFFSET_RATIO";
  }

  return "ANGLE_3D";
}

export function hasThresholdCondition(cond: ThresholdCondition | undefined): boolean {
  if (!cond) {
    return false;
  }
  return (
    (cond.gt !== undefined && cond.gt > 0) ||
    (cond.gte !== undefined && cond.gte > 0) ||
    (cond.lt !== undefined && cond.lt > 0) ||
    (cond.lte !== undefined && cond.lte > 0)
  );
}

export function matchesThresholdCondition(
  cond: ThresholdCondition | undefined,
  val: number,
): boolean {
  if (!cond) {
    return false;
  }
  if (cond.gt !== undefined && cond.gt > 0 && val <= cond.gt) {
    return false;
  }
  if (cond.gte !== undefined && cond.gte > 0 && val < cond.gte) {
    return false;
  }
  if (cond.lt !== undefined && cond.lt > 0 && val >= cond.lt) {
    return false;
  }
  if (cond.lte !== undefined && cond.lte > 0 && val > cond.lte) {
    return false;
  }
  return hasThresholdCondition(cond);
}

function extractDialogueText(fb: VoiceFeedbackMetric | undefined): string {
  if (!fb?.severities) {
    return "";
  }
  for (const level of ["warning", "danger"] as const) {
    const sev = fb.severities[level];
    if (!sev?.styles) {
      continue;
    }
    if (sev.styles.normal?.text) {
      return sev.styles.normal.text;
    }
    for (const style of Object.values(sev.styles)) {
      if (style?.text) {
        return style.text;
      }
    }
  }
  return "";
}

export function resolveCriterionSeverity(ranges: RuleRange[], value: number): CueSeverity {
  for (const rng of ranges) {
    if (rng.severity !== 1) {
      continue;
    }
    const minOk = rng.min === null || rng.min === undefined || value >= rng.min;
    const maxOk = rng.max === null || rng.max === undefined || value <= rng.max;
    if (minOk && maxOk) {
      return 1;
    }
  }
  for (const rng of ranges) {
    if (rng.severity !== 2) {
      continue;
    }
    const minOk = rng.min === null || rng.min === undefined || value >= rng.min;
    const maxOk = rng.max === null || rng.max === undefined || value <= rng.max;
    if (minOk && maxOk) {
      return 2;
    }
  }
  return 1;
}

export function parseMotionRule(
  exerciseId: string,
  rawRule: Record<string, any>,
  rawDialogue?: Record<string, any> | null,
  recommendedCameraAngle = "side",
): ExerciseMotionRule {
  const displayName =
    (typeof rawRule.display_name === "string" && rawRule.display_name) || exerciseId;
  const rawRepType = String(rawRule.rep_type || "counted")
    .trim()
    .toLowerCase();
  const isTimed = rawRepType === "timed" || rawRepType === "duration";
  const challengeType: ChallengeType = isTimed ? "DURATION" : "REPS";
  const repType: "counted" | "timed" = isTimed ? "timed" : "counted";
  const timeCeilingMs = isTimed ? 30 * 60 * 1000 : 10 * 60 * 1000;

  let phaseDetection: PhaseDetectionConfig | null = null;
  if (rawRule.phase_detection && typeof rawRule.phase_detection === "object") {
    const pd = rawRule.phase_detection;
    const rawCalc = pd.calculation || {};
    const landmarks: string[] = Array.isArray(rawCalc.landmarks) ? rawCalc.landmarks : [];
    const joints: number[] = Array.isArray(rawCalc.joints)
      ? rawCalc.joints
      : parseLandmarkNumbers(landmarks);
    const metric = String(pd.metric || "");
    const formula = classifyFormula(metric, String(rawCalc.formula || ""), joints.length);

    const rawTh = pd.thresholds || {};
    const thresholds: PhaseThresholds = {
      active: rawTh.active ? { ...rawTh.active } : undefined,
      always: rawTh.always ? { ...rawTh.always } : undefined,
      idle: rawTh.idle ? { ...rawTh.idle } : undefined,
      rest: rawTh.rest ? { ...rawTh.rest } : undefined,
      transition: rawTh.transition ? { ...rawTh.transition } : undefined,
    };

    if (challengeType === "DURATION") {
      if (!thresholds.active?.lte && thresholds.always?.lte && thresholds.always.lte > 0) {
        thresholds.active = { ...thresholds.always };
      }
      if (!thresholds.rest?.gt && thresholds.idle?.gt && thresholds.idle.gt > 0) {
        thresholds.rest = { ...thresholds.idle };
      }
    }

    phaseDetection = {
      calculation: {
        description: rawCalc.description,
        formula,
        joints,
        landmarks,
      },
      metric,
      thresholds,
    };
  }

  const voiceFeedbacks: Record<string, VoiceFeedbackMetric> | undefined =
    rawDialogue?.voice_feedbacks && typeof rawDialogue.voice_feedbacks === "object"
      ? (rawDialogue.voice_feedbacks as Record<string, VoiceFeedbackMetric>)
      : undefined;

  const criteria: RuleCriterion[] = [];
  const rawCriteria = Array.isArray(rawRule.rules) ? rawRule.rules : [];
  for (const r of rawCriteria) {
    if (!r || typeof r !== "object") {
      continue;
    }
    const metric = String(r.metric || "").trim();
    const phases: string[] = Array.isArray(r.apply_in_phases)
      ? r.apply_in_phases
          .map((ph: unknown) =>
            String(ph || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean)
      : [];

    const evalType = String(r.evaluation_type || "")
      .trim()
      .toLowerCase();
    const metricUpper = metric.toUpperCase();
    const errorCodeBelow =
      evalType === "two_sided" ? `ERR_${metricUpper}_TOO_LOW` : `ERR_${metricUpper}`;
    const errorCodeAbove =
      evalType === "two_sided" ? `ERR_${metricUpper}_TOO_HIGH` : `ERR_${metricUpper}`;

    const rawCalc = r.calculation || {};
    const joints: number[] =
      Array.isArray(rawCalc.joints) && rawCalc.joints.length > 0
        ? rawCalc.joints
        : parseLandmarkNumbers(rawCalc.landmarks);
    const formula = classifyFormula(metric, String(rawCalc.formula || ""), joints.length);

    const ranges: RuleRange[] = Array.isArray(r.ranges)
      ? r.ranges.map((rng: any) => ({
          comment: rng.comment,
          max: typeof rng.max === "number" ? rng.max : null,
          min: typeof rng.min === "number" ? rng.min : null,
          severity: Number(rng.severity ?? 1),
          status: String(rng.status || ""),
        }))
      : [];

    const validRange: ValidAngleRange = { max: 0, min: 0 };
    for (const rng of ranges) {
      if (rng.severity === 0) {
        if (rng.min !== null) {
          validRange.min = rng.min;
        }
        if (rng.max !== null) {
          validRange.max = rng.max;
        }
        break;
      }
    }

    const audioCue = voiceFeedbacks?.[metric] ? extractDialogueText(voiceFeedbacks[metric]) : "";

    criteria.push({
      applyForView: String(r.apply_for_view || "")
        .trim()
        .toLowerCase(),
      applyInPhases: phases,
      audioCue,
      errorCodeAbove,
      errorCodeBelow,
      formula,
      joints,
      name: metric,
      penaltyPerError: 10.0,
      ranges,
      validRange,
    });
  }

  return {
    challengeType,
    displayName,
    exerciseId,
    exerciseName: displayName,
    minConfidence: 0.5,
    notes: String(rawRule.notes || ""),
    passCondition: "ALL_MATCH",
    phaseDetection,
    recommendedCameraAngle: (recommendedCameraAngle || "side").toLowerCase(),
    repType,
    rules: criteria,
    timeCeilingMs,
    violationMaxDurationMs: 5000,
    voiceFeedbacks,
  };
}
