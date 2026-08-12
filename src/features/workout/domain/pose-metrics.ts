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

export function resolveLandmarkPoint(
  pose: Pose,
  descriptor: string,
): { x: number; y: number } | null {
  if (!pose || !descriptor) {
    return null;
  }
  const clean = descriptor
    .split("(")[0]
    ?.trim()
    .toLowerCase()
    .replace("mid-", "")
    .replace("mid_", "") ?? "";

  let keyName: KeypointName = "nose";
  if (clean.includes("shoulder")) keyName = "left_shoulder";
  else if (clean.includes("hip")) keyName = "left_hip";
  else if (clean.includes("knee")) keyName = "left_knee";
  else if (clean.includes("ankle") || clean.includes("toe")) keyName = "left_ankle";
  else if (clean.includes("elbow")) keyName = "left_elbow";
  else if (clean.includes("wrist")) keyName = "left_wrist";
  else if (clean.includes("ear")) keyName = "left_ear";
  else if (clean.includes("eye")) keyName = "left_eye";
  else if (clean.includes("nose")) keyName = "nose";
  else return null;

  const altName = (
    keyName.startsWith("left_") ? keyName.replace("left_", "right_") : keyName
  ) as KeypointName;

  const leftPt = keypoint(pose, keyName);
  const rightPt = keypoint(pose, altName);

  if (leftPt && rightPt) {
    return { x: (leftPt.x + rightPt.x) / 2, y: (leftPt.y + rightPt.y) / 2 };
  }
  if (leftPt) return leftPt;
  if (rightPt) return rightPt;

  return null;
}

export function signedHipYDiff(pose: Pose): number | null {
  const shoulder = keypoint(pose, "left_shoulder") ?? keypoint(pose, "right_shoulder");
  const hip = keypoint(pose, "left_hip") ?? keypoint(pose, "right_hip");
  const ankle = keypoint(pose, "left_ankle") ?? keypoint(pose, "right_ankle");
  if (!shoulder || !hip || !ankle) {
    return null;
  }

  const lS = keypoint(pose, "left_shoulder");
  const rS = keypoint(pose, "right_shoulder");
  const sX = lS && rS ? (lS.x + rS.x) / 2 : shoulder.x;
  const sY = lS && rS ? (lS.y + rS.y) / 2 : shoulder.y;

  const lH = keypoint(pose, "left_hip");
  const rH = keypoint(pose, "right_hip");
  const hX = lH && rH ? (lH.x + rH.x) / 2 : hip.x;
  const hY = lH && rH ? (lH.y + rH.y) / 2 : hip.y;

  const lA = keypoint(pose, "left_ankle");
  const rA = keypoint(pose, "right_ankle");
  const aX = lA && rA ? (lA.x + rA.x) / 2 : ankle.x;
  const aY = lA && rA ? (lA.y + rA.y) / 2 : ankle.y;

  const torsoLength = Math.hypot(hX - sX, hY - sY);
  if (torsoLength === 0) {
    return 0;
  }

  const lineDx = aX - sX;
  const lineDy = aY - sY;
  const lineLen = Math.hypot(lineDx, lineDy);
  if (lineLen === 0) {
    return 0;
  }

  const cross = lineDx * (hY - sY) - lineDy * (hX - sX);
  const perpDist = cross / lineLen;
  return Math.abs(perpDist) / torsoLength;
}

/**
  * Dynamic metric evaluation driven by the `calculation` spec (landmarks, formula) in each rule JSON file.
  */
export function evaluateMetricValue(
  metricName: string,
  landmarks: string[] | undefined,
  formula: string | undefined,
  pose: Pose,
): number | null {
  if (!pose) {
    return null;
  }

  // 1. Dynamic Landmark Point Resolution
  const pts: { x: number; y: number }[] = [];
  if (landmarks && Array.isArray(landmarks)) {
    for (const lm of landmarks) {
      const p = resolveLandmarkPoint(pose, lm);
      if (p) pts.push(p);
    }
  }

  const formulaStr = (formula ?? "").toLowerCase();

  // Formula Case 1: Point to Line Distance (e.g. signed_hip_y_diff)
  if (
    formulaStr.includes("signed_distance_point_to_line") ||
    metricName.includes("signed_hip_y_diff") ||
    metricName.includes("hip_y")
  ) {
    const s = pts[0] ?? resolveLandmarkPoint(pose, "shoulder");
    const h = pts[1] ?? resolveLandmarkPoint(pose, "hip");
    const a = pts[2] ?? resolveLandmarkPoint(pose, "ankle");
    if (!s || !h || !a) return null;

    const torsoLen = Math.hypot(h.x - s.x, h.y - s.y);
    if (torsoLen === 0) return 0;

    const lineDx = a.x - s.x;
    const lineDy = a.y - s.y;
    const lineLen = Math.hypot(lineDx, lineDy);
    if (lineLen === 0) return 0;

    const cross = lineDx * (h.y - s.y) - lineDy * (h.x - s.x);
    const perpDist = cross / lineLen;
    return Math.abs(perpDist) / torsoLen;
  }

  // Formula Case 2: Angle Relative to Vertical Vector [0, -1, 0] (e.g. spine_angle, spine_sway_angle)
  if (
    formulaStr.includes("[0, -1") ||
    formulaStr.includes("vertical") ||
    metricName.includes("spine")
  ) {
    const s = pts[0] ?? resolveLandmarkPoint(pose, "shoulder");
    const h = pts[1] ?? resolveLandmarkPoint(pose, "hip");
    if (!s || !h) return null;

    const dx = s.x - h.x;
    const dy = s.y - h.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return 0;

    const cosine = -dy / len;
    const clamped = Math.min(1, Math.max(-1, cosine));
    return (Math.acos(clamped) * 180) / Math.PI;
  }

  // Formula Case 3: Horizontal Sway / Translation Offset (e.g. elbow_sway, knee_toe_distance)
  if (
    formulaStr.includes("sway") ||
    formulaStr.includes("x_") ||
    metricName.includes("sway") ||
    metricName.includes("knee_toe")
  ) {
    const p1 = pts[0] ?? resolveLandmarkPoint(pose, "shoulder");
    const p2 = pts[1] ?? resolveLandmarkPoint(pose, "elbow");
    const hip = resolveLandmarkPoint(pose, "hip");
    if (!p1 || !p2) return null;

    const dx = Math.abs(p2.x - p1.x);
    const torsoLen =
      p1 && hip
        ? Math.hypot(hip.x - p1.x, hip.y - p1.y)
        : Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (torsoLen === 0) return 0;

    return dx / torsoLen;
  }

  // Formula Case 4: 3-Point Joint Interior Angle (e.g. knee_angle, elbow_angle, hip_angle, neck_pull_angle)
  if (pts.length >= 3) {
    return jointAngle(pts[0]!, pts[1]!, pts[2]!);
  }

  // Fallbacks based on landmarks string parsing
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

  // Fallbacks based on metric name
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
  if (
    !phaseDet ||
    phaseDet.metric === "none" ||
    ruleFile.rep_type === "timed" ||
    Boolean(phaseDet.thresholds?.always)
  ) {
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
            message: range.comment || rule.description || `Form error: ${rule.metric}`,
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

export interface FatigueLevel {
  label: "Exhausted" | "High" | "Moderate" | "Light";
  color: string;
}

export function getFatigueLevel(pct: number): FatigueLevel {
  if (pct >= 85) return { label: "Exhausted", color: "var(--color-danger)" };
  if (pct >= 70) return { label: "High", color: "var(--color-effort)" };
  if (pct >= 50) return { label: "Moderate", color: "var(--color-recovery)" };
  return { label: "Light", color: "var(--color-action)" };
}

