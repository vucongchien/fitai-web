// Live workout session types (UC-03). Shapes mirror the backend contracts (PrescribedExercise,
// ExerciseInfo, GetMotionSpecificationResponse, LogWorkoutSetRequest) so the swap stays mechanical.

import type { Equipment } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

/** The three blocks of a session — ux-flow-spec §5.1, FR-AC-07. */
export type SessionPhase = "warmup" | "main" | "cooldown";

export interface LiveExercise {
  exerciseId: string;
  name: string;
  phase: SessionPhase;
  equipment: Equipment;
  targetSets: number;
  /** 0 when the exercise is time-based (hold/stretch). */
  targetReps: number;
  /** > 0 for time-based exercises, 0 for rep-based ones. */
  durationSeconds: number;
  /** Suggested load. 0 for bodyweight work. */
  targetWeightKg: number;
  /** Anything but BODY_ONLY carries a load. */
  isWeighted: boolean;
  /** Rest between sets of this exercise. */
  restSetSec: number;
  /** Rest before moving on to the next exercise. */
  restExerciseSec: number;
  targetRpe: number;
  /** Coach note for this prescription. */
  notes: string;
  /** From ExerciseInfo.instructions — one step per entry. */
  instructions: string[];
  formCues: string[];
  commonMistakes: string[];
  // NOT IN CONTRACT: ExerciseInfo has no breathing field.
  breathingCue?: string;
  /** Demo clip for the "watch the guide" overlay. */
  videoUrl?: string;
  /** Static frames from ExerciseInfo.images (start, end). */
  images: string[];
  /** Drives the AI camera branch — ux-flow-spec §5.3. */
  hasAiSupported: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  /** Public asset path. Missing files fail silently — the session still runs. */
  url: string;
}

export interface Playlist {
  id: string;
  name: string;
  mood: string;
  tracks: MusicTrack[];
}

/** Severity ladder of DialogueEngineConfig.dialogue_map (severity_1 / severity_2). */
export type CueSeverity = 1 | 2;

/** One spoken coaching line — DialogueOption in the contract. */
export interface CoachCue {
  /** Form error code this cue answers, or a lifecycle key such as "set-start". */
  code: string;
  text: string;
  /** Pre-recorded audio file. Playback ducks the music while it runs (FR-WL-03). */
  audioUrl: string;
  severity: CueSeverity;
}

/** A pose rule evaluated per frame — loaded from MotionSpec.localRulesUrl. */
export interface FormRule {
  code: string;
  message: string;
  severity: CueSeverity;
  /** Keypoint names forming the angle: [a, vertex, c]. */
  joints: [string, string, string];
  kind: "angle-below" | "angle-above";
  thresholdDeg: number;
}

// ROM window of an exercise's tracked joint, measured as travel from start to end: a push-up
// flexes (170° → 90°) while a press extends (80° → 170°).
export interface RomRange {
  joints: [string, string, string];
  /** Joint angle at the start of the rep. */
  startDeg: number;
  /** Joint angle at the end of a full-range rep. */
  endDeg: number;
}

export type CoachingStyle = "normal" | "strict" | "gentle";

export interface VoiceStyleContent {
  text: string;
  url?: string;
}

export interface VoiceSeverityItem {
  severity_level: number;
  status: string;
  styles: Record<string, VoiceStyleContent>;
}

export interface VoiceFeedbackMetric {
  metric_name: string;
  description?: string;
  severities: {
    warning?: VoiceSeverityItem;
    danger?: VoiceSeverityItem;
    [key: string]: VoiceSeverityItem | undefined;
  };
}

export interface MotionSpec {
  exerciseId: string;
  /** ONNX person detector, served from S3. */
  onnxDetectorUrl: string;
  /** ONNX pose model (mmpose / RTMPose), served from S3. */
  onnxSkeletonUrl: string;
  localRulesUrl: string;
  dialogueEngineUrl: string;
  recommendedCameraAngle: string;
  romRange: RomRange;
  rules: FormRule[];
  cues: CoachCue[];
  rep_type?: "timed" | "rep";
  phase_detection?: Record<string, any>;
  /** Voice feedbacks loaded from dialogues_url / voice_coaching json file. */
  voiceFeedbacks?: Record<string, VoiceFeedbackMetric>;
  /** Per-code cue cooldown in seconds so the coach does not nag. */
  cueCooldownSec: Record<string, number>;
}

/** Post-injury protection banner — ux-flow-spec §6.7, BR-AC-09. */
export interface ProtectionNote {
  title: string;
  description: string;
}

export interface LiveSessionPlan {
  sessionId: string;
  sessionPlanId: string;
  title: string;
  targetRpe: number;
  estimatedDurationMin: number;
  warmUps: LiveExercise[];
  mainExercises: LiveExercise[];
  coolDowns: LiveExercise[];
  playlists: Playlist[];
  /** Keyed by exerciseId; only present for AI-supported exercises. */
  motionSpecs: Record<string, MotionSpec>;
  protectionNote?: ProtectionNote;
  /** Mean volume of the last 5 comparable sessions — BR-WL-02 baseline. */
  recentAvgVolumeKg: number;
  /** Best known estimated 1RM per exercise — BR-WL-04 / FR-WL-04. */
  personalRecords: Record<string, number>;
  /** Soft duration warning threshold in minutes — BR-WL-01 (90 for beginners). */
  durationWarnMin: number;
}

export type SetSource = "manual" | "camera";

/** Per-rep telemetry from the camera branch — RepLog in the contract. */
export interface RepLogEntry {
  repNumber: number;
  romPercentage: number;
  errorCodes: string[];
  jointAngles?: Record<string, number>;
}

export interface SetLogDraft {
  exerciseId: string;
  phase: SessionPhase;
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weightKg: number;
  /** Null = N/A. RPE is optional — ux-flow-spec §5.4. */
  rpe: number | null;
  /** Null for non-AI sets — BR-WL-03 never invents a score. */
  formScore: number | null;
  source: SetSource;
  reps: RepLogEntry[];
  /** Share of frames with a valid skeleton; null when the camera was off — BR-CC-02. */
  validFrameRatio: number | null;
  cameraAngle: string;
  loggedAt: number;
  /** False while the set is still queued offline. */
  synced: boolean;
}

/** Reasons offered when the user stops early — ux-flow-spec §5.6. */
export type AbortReason = "pain" | "out-of-time" | "uncomfortable";

export interface SessionReport {
  sessionId: string;
  totalSets: number;
  totalVolumeKg: number;
  averageRpe: number | null;
  averageFormScore: number | null;
  estimatedCalories: number;
  durationMin: number;
  /** Set to true when < 50% of camera frames tracked — BR-CC-02. */
  hasUnverifiedSets: boolean;
  personalRecords: { exerciseId: string; name: string; oneRepMaxKg: number }[];
  // Recent average volume the summary compares against, not the previous session (the plan
  // carries no such history), so the summary does not claim "last time". 0 without history.
  recentAvgVolumeKg: number;
}

/** Key used in sessionStorage to persist the post-session report for Summary view. */
export function reportStorageKey(sessionId: string): string {
  return `fitai-live-report:${sessionId}`;
}
