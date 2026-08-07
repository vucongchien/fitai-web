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
}

/** Below this a keypoint is treated as missing. */
export const MIN_KEYPOINT_SCORE = 0.3;

/** BR-CC-01 — a rep counts once ROM reaches 70% of the standard range. */
export const VALID_REP_ROM = 70;

export function keypoint(pose: Pose, name: KeypointName): Keypoint | null {
  const index = KEYPOINT_NAMES.indexOf(name);
  const point = pose.keypoints[index];
  if (!point || point.score < MIN_KEYPOINT_SCORE) {return null;}
  return point;
}

/** A pose is usable when both hips and both shoulders tracked. */
export function isPoseUsable(pose: Pose): boolean {
  return (
    keypoint(pose, "left_shoulder") !== null &&
    keypoint(pose, "right_shoulder") !== null &&
    keypoint(pose, "left_hip") !== null &&
    keypoint(pose, "right_hip") !== null
  );
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
  if (abLen === 0 || cbLen === 0) {return 0;}
  const cosine = (abX * cbX + abY * cbY) / (abLen * cbLen);
  const clamped = Math.min(1, Math.max(-1, cosine));
  return (Math.acos(clamped) * 180) / Math.PI;
}

export function angleOfJoints(pose: Pose, joints: [string, string, string]): number | null {
  const [a, b, c] = joints.map((name) => keypoint(pose, name as KeypointName));
  if (!a || !b || !c) {return null;}
  return jointAngle(a, b, c);
}

/**
 * How far into the movement we are, as a percentage of the standard range.
 * Works in both directions (flexion or extension) — see RomRange.
 */
export function romPercent(angleDeg: number, range: RomRange): number {
  const span = range.endDeg - range.startDeg;
  if (span === 0) {return 0;}
  const travelled = (angleDeg - range.startDeg) / span;
  return Math.min(100, Math.max(0, travelled * 100));
}

export type RepPhase = "extended" | "contracting" | "contracted" | "extending";

export interface RepCounterState {
  phase: RepPhase;
  count: number;
  /** Deepest ROM reached in the current rep. */
  peakRom: number;
  /** ROM of every completed rep, in order. */
  completedRoms: number[];
}

/** Hysteresis so jitter around the threshold does not double count. */
const CONTRACT_ENTER_ROM = 40;
const EXTEND_EXIT_ROM = 20;

export function createRepCounter(): RepCounterState {
  return { phase: "extended", count: 0, peakRom: 0, completedRoms: [] };
}

export interface RepCounterTick {
  state: RepCounterState;
  /** Set on the frame where a rep closes — null otherwise. */
  completedRep: { repNumber: number; romPercentage: number; counted: boolean } | null;
}

/**
 * Feed one frame's ROM. A rep closes when the user comes back up past
 * EXTEND_EXIT_ROM after having gone below CONTRACT_ENTER_ROM; it only increments
 * the counter when peak ROM reached VALID_REP_ROM (BR-CC-01).
 */
export function feedRepCounter(state: RepCounterState, rom: number): RepCounterTick {
  const peakRom = Math.max(state.peakRom, rom);

  if (state.phase === "extended" || state.phase === "extending") {
    if (rom >= CONTRACT_ENTER_ROM) {
      return { state: { ...state, phase: "contracting", peakRom }, completedRep: null };
    }
    return { state: { ...state, phase: "extended", peakRom }, completedRep: null };
  }

  // Coming back up closes the rep.
  if (rom <= EXTEND_EXIT_ROM) {
    const counted = peakRom >= VALID_REP_ROM;
    const count = counted ? state.count + 1 : state.count;
    const completedRoms = counted ? [...state.completedRoms, peakRom] : state.completedRoms;
    return {
      state: { phase: "extended", count, peakRom: 0, completedRoms },
      completedRep: { repNumber: count, romPercentage: Math.round(peakRom), counted },
    };
  }

  return { state: { ...state, phase: "contracting", peakRom }, completedRep: null };
}

/** FR-CC-03 — codes of every rule the current pose violates. */
export function evaluateRules(rules: FormRule[], pose: Pose): string[] {
  const codes: string[] = [];
  for (const rule of rules) {
    const angle = angleOfJoints(pose, rule.joints);
    if (angle === null) {continue;}
    const violated =
      rule.kind === "angle-below" ? angle < rule.thresholdDeg : angle > rule.thresholdDeg;
    if (violated) {codes.push(rule.code);}
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
  if (frameHeight <= 0 || !isPoseUsable(pose)) {return "unknown";}
  const visible = pose.keypoints.filter((point) => point.score >= MIN_KEYPOINT_SCORE);
  if (visible.length < 6) {return "unknown";}
  const top = Math.min(...visible.map((point) => point.y));
  const bottom = Math.max(...visible.map((point) => point.y));
  const coverage = (bottom - top) / frameHeight;
  if (coverage < 0.55) {return "too-far";}
  if (coverage > 0.85) {return "too-close";}
  return "ok";
}

/** Mean luma of a downsampled frame, 0-255. */
export const MIN_FRAME_BRIGHTNESS = 45;

export function calibrationLighting(meanBrightness: number): CalibrationLighting {
  return meanBrightness < MIN_FRAME_BRIGHTNESS ? "low" : "ok";
}

export function calibrationHint(
  distance: CalibrationDistance,
  lighting: CalibrationLighting,
): string {
  if (lighting === "low") {return "Too dark to track — add some light.";}
  if (distance === "too-far") {return "Step closer, about two metres from the camera.";}
  if (distance === "too-close") {return "Step back, about two metres from the camera.";}
  if (distance === "unknown") {return "Stand where the camera can see your whole body.";}
  return "Framing looks good — you're ready.";
}
