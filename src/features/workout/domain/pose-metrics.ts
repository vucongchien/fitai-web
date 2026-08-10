/**
 * Pose maths: joint angles, ROM, rep counting, form rules, Form Score.
 *
 * Pure module — it takes keypoints and returns numbers, so it can be unit tested
 * without a camera or a model. The ONNX engine feeds it; the simulated engine
 * feeds it too.
 *
 * FR-CC-02 (ROM), FR-CC-03 (error detection), FR-CC-05 (Form Score 0-100),
 * BR-CC-01 (a rep only counts at ROM >= 70%).
 */

import type { FormRule, RomRange } from "@/features/workout/model/live-session.types";

/** COCO-17 order, the layout mmpose / RTMPose models output (FR-CC-01). */
export const KEYPOINT_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;

export type KeypointName = (typeof KEYPOINT_NAMES)[number];

/** Skeleton edges for the overlay. */
export const SKELETON_EDGES: [KeypointName, KeypointName][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

export interface Keypoint {
  /** Pixel coordinates in the source frame. */
  x: number;
  y: number;
  score: number;
}

export interface Pose {
  /** 17 keypoints in KEYPOINT_NAMES order. */
  keypoints: Keypoint[];
  score: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

/** Below this a keypoint is treated as missing. */
export const MIN_KEYPOINT_SCORE = 0.15;

/** BR-CC-01 — a rep counts once ROM reaches 70% of the standard range. */
export const VALID_REP_ROM = 70;

export function normalizeKeypointName(name: string): KeypointName {
  if (KEYPOINT_NAMES.includes(name as KeypointName)) {
    return name as KeypointName;
  }
  const leftVariant = `left_${name}` as KeypointName;
  if (KEYPOINT_NAMES.includes(leftVariant)) {
    return leftVariant;
  }
  return name as KeypointName;
}

export function keypoint(pose: Pose, name: string): Keypoint | null {
  const normName = normalizeKeypointName(name);
  const index = KEYPOINT_NAMES.indexOf(normName);
  if (index === -1) {
    return null;
  }
  const point = pose.keypoints[index];
  if (point && point.score >= MIN_KEYPOINT_SCORE) {
    return point;
  }

  // If primary side keypoint is obscured, try opposite side fallback (e.g. left_hip -> right_hip)
  const altName = normName.startsWith("left_")
    ? normName.replace("left_", "right_")
    : normName.startsWith("right_")
      ? normName.replace("right_", "left_")
      : null;
  if (altName) {
    const altIndex = KEYPOINT_NAMES.indexOf(altName as KeypointName);
    if (altIndex !== -1) {
      const altPoint = pose.keypoints[altIndex];
      if (altPoint && altPoint.score >= MIN_KEYPOINT_SCORE) {
        return altPoint;
      }
    }
  }

  return null;
}

/** A pose is usable when at least 1 shoulder and 1 hip are tracked (supports side-view exercises like Sit-up & Push-up). */
export function isPoseUsable(pose: Pose): boolean {
  const hasLeftUpper = keypoint(pose, "left_shoulder") !== null && keypoint(pose, "left_hip") !== null;
  const hasRightUpper = keypoint(pose, "right_shoulder") !== null && keypoint(pose, "right_hip") !== null;
  const hasAnyShoulder = keypoint(pose, "left_shoulder") !== null || keypoint(pose, "right_shoulder") !== null;
  const hasAnyHip = keypoint(pose, "left_hip") !== null || keypoint(pose, "right_hip") !== null;

  return hasLeftUpper || hasRightUpper || (hasAnyShoulder && hasAnyHip);
}

/** Interior angle at vertex `b`, in degrees (0-180). */
export function jointAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const abX = a.x - b.x;
  const abY = a.y - b.y;
  const cbX = c.x - b.x;
  const cbY = c.y - b.y;
  const abLen = Math.hypot(abX, abY);
  const cbLen = Math.hypot(cbX, cbY);
  if (abLen === 0 || cbLen === 0) {
    return 0;
  }
  const cosine = (abX * cbX + abY * cbY) / (abLen * cbLen);
  const clamped = Math.min(1, Math.max(-1, cosine));
  return (Math.acos(clamped) * 180) / Math.PI;
}

export function spineAngle(pose: Pose): number | null {
  const shoulder = keypoint(pose, "shoulder");
  const hip = keypoint(pose, "hip");
  if (!shoulder || !hip) {
    return null;
  }
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return 0;
  }
  // Angle with vertical vector [0, -1]
  const cosine = -dy / len;
  const clamped = Math.min(1, Math.max(-1, cosine));
  return (Math.acos(clamped) * 180) / Math.PI;
}

export function angleOfJoints(pose: Pose, joints?: [string, string, string]): number | null {
  if (!joints || !Array.isArray(joints) || joints.length < 3) {
    return null;
  }
  let [a, b, c] = joints.map((name) => keypoint(pose, name as KeypointName));
  if (!a || !b || !c) {
    // Opposite side fallback if primary side is obscured in side-view videos (e.g. left_hip -> right_hip)
    const altJoints = joints.map((name) => {
      if (name.startsWith("left_")) return name.replace("left_", "right_");
      if (name.startsWith("right_")) return name.replace("right_", "left_");
      return name;
    });
    const [altA, altB, altC] = altJoints.map((name) => keypoint(pose, name as KeypointName));
    if (altA && altB && altC) {
      a = altA;
      b = altB;
      c = altC;
    } else {
      return null;
    }
  }
  return jointAngle(a, b, c);
}

/**
 * How far into the movement we are, as a percentage of the standard range.
 * Works in both directions (flexion or extension) — see RomRange.
 */
export function romPercent(angleDeg: number, range: RomRange): number {
  const span = range.endDeg - range.startDeg;
  if (span === 0) {
    return 0;
  }
  const travelled = (angleDeg - range.startDeg) / span;
  return Math.min(100, Math.max(0, travelled * 100));
}

export type RepPhase = "start" | "moving_to_target" | "target_reached" | "moving_to_start";

export interface RepCounterState {
  phase: RepPhase;
  count: number;
  /** Deepest ROM reached in the current rep. */
  peakRom: number;
  /** ROM of every completed rep, in order. */
  completedRoms: number[];
}

/** Hysteresis thresholds for strict 5-step sequential phase transitions. */
const START_ROM_MAX = 30;       // Below 30% ROM is considered START position
const MOVING_START_MIN = 20;     // Moving above 20% transitions to MOVING_TO_TARGET
const TARGET_REACH_MIN = 60;     // Reaching >= 60% ROM reaches TARGET_REACHED
const MOVING_START_MAX = 70;     // Dropping below 70% after target reached transitions to MOVING_TO_START

export function createRepCounter(): RepCounterState {
  return { phase: "start", count: 0, peakRom: 0, completedRoms: [] };
}

export interface RepCounterTick {
  state: RepCounterState;
  /** Set on the frame where a rep closes — null otherwise. */
  completedRep: { repNumber: number; romPercentage: number; counted: boolean } | null;
}

/**
 * Strict 5-step sequential state machine:
 * START (<=25%) -> MOVING_TO_TARGET (>=35%) -> TARGET_REACHED (>=70%) -> MOVING_TO_START (<=60%) -> RETURNED TO START (<=25%) (Rep + 1)
 * Must follow exact sequential order without skipping steps!
 */
export function feedRepCounter(state: RepCounterState, rom: number): RepCounterTick {
  const peakRom = Math.max(state.peakRom, rom);

  switch (state.phase) {
    case "start": {
      // Step 1: rest (start position). Transition to Step 2: transition (moving_to_target)
      if (rom >= MOVING_START_MIN) {
        return {
          state: { ...state, phase: "moving_to_target", peakRom },
          completedRep: null,
        };
      }
      return { state: { ...state, peakRom: 0 }, completedRep: null };
    }

    case "moving_to_target": {
      // Step 2: transition (moving_to_target). Must reach Step 3: active (target_reached)
      if (rom >= TARGET_REACH_MIN) {
        return {
          state: { ...state, phase: "target_reached", peakRom },
          completedRep: null,
        };
      }
      // If user turns back early to start (< 30%) WITHOUT reaching active, reset to start without incrementing!
      if (rom <= START_ROM_MAX) {
        return {
          state: { ...state, phase: "start", peakRom: 0 },
          completedRep: null,
        };
      }
      return { state: { ...state, peakRom }, completedRep: null };
    }

    case "target_reached": {
      // Step 3: active (target_reached). Returning to rest (<= 30%) or transition (<= 70%)
      if (rom <= START_ROM_MAX) {
        // Returned to rest position (<=30%) after reaching active — full sequence complete!
        const counted = peakRom >= VALID_REP_ROM;
        if (!counted) {
          return {
            state: { ...state, phase: "start", peakRom: 0 },
            completedRep: null,
          };
        }
        const count = state.count + 1;
        const completedRoms = [...state.completedRoms, peakRom];
        return {
          state: { phase: "start", count, peakRom: 0, completedRoms },
          completedRep: { repNumber: count, romPercentage: Math.round(peakRom), counted: true },
        };
      }
      if (rom <= MOVING_START_MAX) {
        return {
          state: { ...state, phase: "moving_to_start", peakRom },
          completedRep: null,
        };
      }
      return { state: { ...state, peakRom }, completedRep: null };
    }

    case "moving_to_start": {
      // Step 4 & 5: transition (moving_to_start). Returning fully to Step 5: rest (start position <= 30%)
      // Sequence COMPLETE: rest -> transition -> active -> transition -> rest! Rep + 1!
      if (rom <= START_ROM_MAX) {
        const counted = peakRom >= VALID_REP_ROM;
        if (!counted) {
          return {
            state: { ...state, phase: "start", peakRom: 0 },
            completedRep: null,
          };
        }
        const count = state.count + 1;
        const completedRoms = [...state.completedRoms, peakRom];
        return {
          state: { phase: "start", count, peakRom: 0, completedRoms },
          completedRep: { repNumber: count, romPercentage: Math.round(peakRom), counted: true },
        };
      }
      return { state: { ...state, peakRom }, completedRep: null };
    }

    default: {
      return { state: { ...state, phase: "start", peakRom: 0 }, completedRep: null };
    }
  }
}

/** FR-CC-03 — codes of every rule the current pose violates. */
export function evaluateRules(rules: FormRule[], pose: Pose): string[] {
  if (!rules || !Array.isArray(rules) || !pose) {
    return [];
  }
  const codes: string[] = [];
  for (const rule of rules) {
    if (!rule || !rule.joints) {
      continue;
    }
    const angle = angleOfJoints(pose, rule.joints);
    if (angle === null) {
      continue;
    }
    const violated =
      rule.kind === "angle-below" ? angle < rule.thresholdDeg : angle > rule.thresholdDeg;
    if (violated) {
      codes.push(rule.code);
    }
  }
  return codes;
}

export interface FormScoreInput {
  /** Mean ROM of the counted reps (0-100). */
  averageRom: number;
  /** Rule violations recorded during the set. */
  errorCount: number;
  /** Reps performed. */
  repCount: number;
  /** Mean seconds per rep; outside 1.5-4s costs a little. */
  secondsPerRep?: number;
}

/**
 * FR-CC-05 — Form Score 0-100 from ROM, joint alignment (rule violations) and tempo.
 * ROM carries most of the weight; errors are penalised per rep so a long set is
 * not punished harder than a short one for the same error rate.
 */
export function formScore(input: FormScoreInput): number {
  const romPart = Math.min(100, Math.max(0, input.averageRom)) * 0.7;

  const errorsPerRep = input.repCount > 0 ? input.errorCount / input.repCount : input.errorCount;
  const alignmentPart = Math.max(0, 20 - errorsPerRep * 20);

  const tempo = input.secondsPerRep ?? 2.5;
  const tempoPenalty = tempo < 1.5 ? (1.5 - tempo) * 6 : (tempo > 4 ? (tempo - 4) * 3 : 0);
  const tempoPart = Math.max(0, 10 - tempoPenalty);

  return Math.round(Math.min(100, Math.max(0, romPart + alignmentPart + tempoPart)));
}

export type CalibrationDistance = "too-far" | "too-close" | "ok" | "unknown";
export type CalibrationLighting = "low" | "ok";

/**
 * Distance proxy: the fraction of frame height the body occupies. At 1.5-2 m with
 * a phone in portrait the tracked body spans roughly 55-85% of the frame
 * (Assumption-01). Outside that we ask the user to step in or out.
 */
export function calibrationDistance(pose: Pose, frameHeight: number): CalibrationDistance {
  if (frameHeight <= 0 || !isPoseUsable(pose)) {
    return "unknown";
  }
  const visible = pose.keypoints.filter((point) => point.score >= MIN_KEYPOINT_SCORE);
  if (visible.length < 6) {
    return "unknown";
  }
  const top = Math.min(...visible.map((point) => point.y));
  const bottom = Math.max(...visible.map((point) => point.y));
  const coverage = (bottom - top) / frameHeight;
  if (coverage < 0.55) {
    return "too-far";
  }
  if (coverage > 0.85) {
    return "too-close";
  }
  return "ok";
}

/** Mean luma of a downsampled frame, 0-255. */
export const MIN_FRAME_BRIGHTNESS = 45;

export interface GenericRuleRange {
  severity: number;
  status: string;
  min: number | null;
  max: number | null;
  comment?: string;
}

export interface GenericRuleItem {
  metric: string;
  description?: string;
  evaluation_type?: string;
  apply_in_phases?: string[];
  ranges?: GenericRuleRange[];
  calculation?: {
    landmarks?: string[];
    formula?: string;
  };
}

export interface GenericRuleFile {
  display_name?: string;
  rep_type?: "counted" | "timed";
  notes?: string;
  phase_detection?: {
    metric?: string;
    thresholds?: Record<string, { gt?: number; gte?: number; lt?: number; lte?: number; comment?: string }>;
    calculation?: {
      landmarks?: string[];
      formula?: string;
    };
  };
  rules?: GenericRuleItem[];
}

export function evaluateMetricValue(
  metricName: string,
  landmarks: string[] | undefined,
  formula: string | undefined,
  pose: Pose,
): number | null {
  if (metricName === "spine_angle" || formula?.includes("[0, -1, 0]")) {
    return spineAngle(pose);
  }

  // Parse landmarks if provided (e.g. ["Hip (P11, P12)", "Knee (P13, P14)", "Ankle (P15, P16)"])
  if (landmarks && landmarks.length >= 3) {
    const parsedJoints = landmarks.slice(0, 3).map((item) => {
      const clean = item.split(" ")[0] ?? item;
      return clean.toLowerCase();
    }) as [string, string, string];
    const angle = angleOfJoints(pose, parsedJoints);
    if (angle !== null) {
      return angle;
    }
  }

  // Default joint fallbacks based on metric name
  if (metricName.includes("knee") || metricName.includes("leg")) {
    return angleOfJoints(pose, ["hip", "knee", "ankle"]);
  }
  if (metricName.includes("hip")) {
    return angleOfJoints(pose, ["shoulder", "hip", "knee"]);
  }
  if (metricName.includes("elbow") || metricName.includes("arm")) {
    return angleOfJoints(pose, ["shoulder", "elbow", "wrist"]);
  }

  return null;
}

export function detectPhaseFromRuleJson(
  ruleFile: GenericRuleFile,
  pose: Pose,
): { phase: string; startDeg: number; endDeg: number; metricName: string } {
  if (!ruleFile || !pose) {
    return { endDeg: 115, metricName: "knee_angle", phase: "start", startDeg: 150 };
  }

  const phaseDet = ruleFile.phase_detection;

  // Handle Timed / Isometric / Static exercises (e.g. Plank, Wall Sit, rep_type: "timed", metric: "none")
  if (!phaseDet || phaseDet.metric === "none" || ruleFile.rep_type === "timed") {
    return { endDeg: 0, metricName: "none", phase: "always", startDeg: 0 };
  }

  const metricName = phaseDet.metric ?? "knee_angle";
  const val = evaluateMetricValue(
    metricName,
    phaseDet.calculation?.landmarks,
    phaseDet.calculation?.formula,
    pose,
  );

  const thresholds = phaseDet.thresholds ?? {};
  const restCond = thresholds.rest ?? {};
  const activeCond = thresholds.active ?? {};

  const restGt = restCond.gt ?? restCond.gte ?? 150;
  const activeLte = activeCond.lte ?? activeCond.lt ?? 115;

  if (val === null) {
    return { endDeg: activeLte, metricName, phase: "start", startDeg: restGt };
  }

  // Parse conditions dynamically:
  // 1. Check rest condition (gt: Greater than, gte: Greater than or equal)
  const isRest =
    (restCond.gt !== undefined && val > restCond.gt) ||
    (restCond.gte !== undefined && val >= restCond.gte) ||
    (restCond.gt === undefined && restCond.gte === undefined && val > 150);

  if (isRest) {
    return { endDeg: activeLte, metricName, phase: "start", startDeg: restGt };
  }

  // 2. Check active condition (lte: Less than or equal to, lt: Less than)
  const isActive =
    (activeCond.lte !== undefined && val <= activeCond.lte) ||
    (activeCond.lt !== undefined && val < activeCond.lt) ||
    (activeCond.lte === undefined && activeCond.lt === undefined && val <= 115);

  if (isActive) {
    return { endDeg: activeLte, metricName, phase: "target_reached", startDeg: restGt };
  }

  // 3. Fallback: transition condition (gt 115: Greater than 115 and <= 150)
  return { endDeg: activeLte, metricName, phase: "moving_to_target", startDeg: restGt };
}

export function evaluateGenericRuleJson(
  ruleFile: GenericRuleFile,
  pose: Pose,
): { violations: { code: string; message: string; severity: number }[]; currentPhase: string } {
  const violations: { code: string; message: string; severity: number }[] = [];
  if (!ruleFile || !pose) {
    return { currentPhase: "start", violations };
  }

  // 1. Dynamic Phase Detection
  const { phase: currentPhase } = detectPhaseFromRuleJson(ruleFile, pose);

  // 2. Dynamic Rule Ranges Evaluation
  if (ruleFile.rules && Array.isArray(ruleFile.rules)) {
    for (const rule of ruleFile.rules) {
      const value = evaluateMetricValue(
        rule.metric,
        rule.calculation?.landmarks,
        rule.calculation?.formula,
        pose,
      );
      if (value === null || !rule.ranges) {
        continue;
      }

      for (const range of rule.ranges) {
        if (range.severity === 0) {
          continue;
        }

        if ((range.min !== null && range.max !== null && value >= range.min && value <= range.max) ||
            (range.min !== null && range.max === null && value >= range.min) ||
            (range.min === null && range.max !== null && value <= range.max)) {
          violations.push({
            code: rule.metric,
            message: range.comment || rule.description || `Lỗi tư thế ${rule.metric}`,
            severity: range.severity,
          });
          break;
        }
      }
    }
  }

  return { currentPhase, violations };
}

export function calibrationLighting(meanBrightness: number): CalibrationLighting {
  return meanBrightness < MIN_FRAME_BRIGHTNESS ? "low" : "ok";
}

export function calibrationHint(
  distance: CalibrationDistance,
  lighting: CalibrationLighting,
): string {
  if (lighting === "low") {
    return "Too dark to track — add some light.";
  }
  if (distance === "too-far") {
    return "Step closer, about two metres from the camera.";
  }
  if (distance === "too-close") {
    return "Step back, about two metres from the camera.";
  }
  if (distance === "unknown") {
    return "Stand where the camera can see your whole body.";
  }
  return "Framing looks good — you're ready.";
}
