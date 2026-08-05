/**
 * Types for the live workout session (UC-03 Workout Execution).
 *
 * Shapes mirror the backend contracts so the mock → gRPC swap stays mechanical:
 *   - LiveExercise      ← contracts.core.coaching.v1.PrescribedExercise + supporting.exercise.v1.ExerciseInfo
 *   - MotionSpec        ← contracts.core.workout_execution.v1.GetMotionSpecificationResponse + DialogueEngineConfig
 *   - SetLogDraft       → contracts.core.workout_execution.v1.LogWorkoutSetRequest
 */

/** The three blocks of a session — ux-flow-spec §5.1, FR-AC-07. */
export type SessionPhase = "warmup" | "main" | "cooldown";

export type LiveExercise = {
  exerciseId: string;
  name: string;
  phase: SessionPhase;
  equipmentId: string;
  targetSets: number;
  /** 0 when the exercise is time-based (hold/stretch). */
  targetReps: number;
  /** > 0 for time-based exercises, 0 for rep-based ones. */
  durationSeconds: number;
  /** Suggested load. 0 for bodyweight work. */
  targetWeightKg: number;
  /** BFF resolves: equipment.name !== "bodyweight". */
  isWeighted: boolean;
  /** Rest between sets of this exercise. */
  restSetSec: number;
  /** Rest before moving on to the next exercise. */
  restExerciseSec: number;
  targetRpe: number;
  /** Coach note for this prescription. */
  notes: string;
  /** From ExerciseInfo.instructions — the "read the guide" content. */
  instructions?: string;
  formCues: string[];
  commonMistakes: string[];
  /** Demo clip for the "watch the guide" overlay. */
  videoUrl?: string;
  thumbnailUrl?: string;
  /** Drives the AI camera branch — ux-flow-spec §5.3. */
  hasAiSupported: boolean;
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  /** Public asset path. Missing files fail silently — the session still runs. */
  url: string;
};

export type Playlist = {
  id: string;
  name: string;
  mood: string;
  tracks: MusicTrack[];
};

/** Severity ladder of DialogueEngineConfig.dialogue_map (severity_1 / severity_2). */
export type CueSeverity = 1 | 2;

/** One spoken coaching line — DialogueOption in the contract. */
export type CoachCue = {
  /** Form error code this cue answers, or a lifecycle key such as "set-start". */
  code: string;
  text: string;
  /** Pre-recorded audio file. Playback ducks the music while it runs (FR-WL-03). */
  audioUrl: string;
  severity: CueSeverity;
};

/** A pose rule evaluated per frame — loaded from MotionSpec.localRulesUrl. */
export type FormRule = {
  code: string;
  message: string;
  severity: CueSeverity;
  /** Keypoint names forming the angle: [a, vertex, c]. */
  joints: [string, string, string];
  kind: "angle-below" | "angle-above";
  thresholdDeg: number;
};

/**
 * Range of motion window for the tracked joint of an exercise.
 * Direction-agnostic: a push-up flexes (start 170° → end 90°) while a press
 * extends (start 80° → end 170°), so ROM is measured as travel from start to end.
 */
export type RomRange = {
  joints: [string, string, string];
  /** Joint angle at the start of the rep. */
  startDeg: number;
  /** Joint angle at the end of a full-range rep. */
  endDeg: number;
};

export type MotionSpec = {
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
  /** Per-code cue cooldown in seconds so the coach does not nag. */
  cueCooldownSec: Record<string, number>;
};

/** Post-injury protection banner — ux-flow-spec §6.7, BR-AC-09. */
export type ProtectionNote = {
  title: string;
  description: string;
};

export type LiveSessionPlan = {
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
};

export type SetSource = "manual" | "camera";

/** Per-rep telemetry from the camera branch — RepLog in the contract. */
export type RepLogEntry = {
  repNumber: number;
  romPercentage: number;
  errorCodes: string[];
};

export type SetLogDraft = {
  exerciseId: string;
  phase: SessionPhase;
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weightKg: number;
  /** null = N/A. RPE is optional — ux-flow-spec §5.4. */
  rpe: number | null;
  /** null for non-AI sets — BR-WL-03 never invents a score. */
  formScore: number | null;
  source: SetSource;
  reps: RepLogEntry[];
  /** Share of frames with a valid skeleton; null when the camera was off — BR-CC-02. */
  validFrameRatio: number | null;
  cameraAngle: string;
  loggedAt: number;
  /** false while the set is still queued offline. */
  synced: boolean;
};

/** Reasons offered when the user stops early — ux-flow-spec §5.6. */
export type AbortReason = "pain" | "out-of-time" | "uncomfortable";

export type SessionReport = {
  sessionId: string;
  totalSets: number;
  totalVolumeKg: number;
  averageRpe: number | null;
  averageFormScore: number | null;
  estimatedCalories: number;
  durationMin: number;
  /** Set to true when < 50% of camera frames tracked — BR-CC-02. */
  hasUnverifiedSets: boolean;
  personalRecords: Array<{ exerciseId: string; name: string; oneRepMaxKg: number }>;
};

/** Key used in sessionStorage to persist the post-session report for Summary view. */
export function reportStorageKey(sessionId: string): string {
  return `fitai-live-report:${sessionId}`;
}

