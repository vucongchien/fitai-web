import "server-only";
import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import { estimatedDurationMin } from "@/features/workout/domain/session-flow";
import type {
  CoachCue,
  FormRule,
  LiveExercise,
  LiveSessionPlan,
  MotionSpec,
  Playlist,
  RomRange,
  SessionPhase,
} from "@/features/workout/model/live-session.types";
import { MOCK_EXERCISES } from "@/shared/mock/exercises";

const BODYWEIGHT_EQUIPMENT_ID = "eq-bodyweight";

/** Suggested load per equipment family — the BFF derives this server-side for real data. */
const DEFAULT_WEIGHT_KG: Record<string, number> = {
  "eq-dumbbell": 12,
  "eq-barbell": 40,
  "eq-kettlebell": 16,
  "eq-machine": 25,
  "eq-band": 0,
};

function findExercise(id: string): ExerciseSummary {
  const exercise = MOCK_EXERCISES.find((entry) => entry.id === id);
  if (!exercise) throw new Error(`Mock exercise not found: ${id}`);
  return exercise;
}

type PrescriptionSeed = {
  id: string;
  phase: SessionPhase;
  sets: number;
  /** Rep-based prescription. Omit for a hold. */
  reps?: number;
  /** Time-based prescription in seconds. */
  seconds?: number;
  restSetSec?: number;
  restExerciseSec?: number;
  targetRpe: number;
  notes: string;
};

function toLiveExercise(seed: PrescriptionSeed): LiveExercise {
  const source = findExercise(seed.id);
  const isWeighted = source.equipmentId !== BODYWEIGHT_EQUIPMENT_ID;
  const restSetSec = seed.restSetSec ?? source.defaultRestSeconds;

  return {
    exerciseId: source.id,
    name: source.name,
    phase: seed.phase,
    equipmentId: source.equipmentId,
    targetSets: seed.sets,
    targetReps: seed.reps ?? 0,
    durationSeconds: seed.seconds ?? 0,
    targetWeightKg: isWeighted ? (DEFAULT_WEIGHT_KG[source.equipmentId] ?? 10) : 0,
    isWeighted,
    restSetSec,
    restExerciseSec: seed.restExerciseSec ?? Math.max(restSetSec, 45),
    targetRpe: seed.targetRpe,
    notes: seed.notes,
    instructions: source.instructions,
    formCues: source.formCues ?? [],
    commonMistakes: source.commonMistakes ?? [],
    videoUrl: source.videoUrl,
    thumbnailUrl: source.thumbnailUrl,
    hasAiSupported: source.hasAiSupported,
  };
}

const WARM_UP_SEEDS: PrescriptionSeed[] = [
  {
    id: "ex-worlds-greatest-stretch",
    phase: "warmup",
    sets: 1,
    seconds: 60,
    restSetSec: 0,
    restExerciseSec: 20,
    targetRpe: 3,
    notes: "Move slowly through each position, two passes per side.",
  },
  {
    id: "ex-band-pull-apart",
    phase: "warmup",
    sets: 2,
    reps: 15,
    restSetSec: 30,
    restExerciseSec: 45,
    targetRpe: 3,
    notes: "Light tension — this is about waking the shoulders up.",
  },
  {
    id: "ex-glute-bridge",
    phase: "warmup",
    sets: 1,
    reps: 12,
    restSetSec: 30,
    restExerciseSec: 60,
    targetRpe: 4,
    notes: "Squeeze at the top for a beat before lowering.",
  },
];

const MAIN_SEEDS: PrescriptionSeed[] = [
  {
    id: "ex-incline-push-up",
    phase: "main",
    sets: 3,
    reps: 10,
    targetRpe: 6,
    notes: "Keep ribs stacked and move as one unit.",
  },
  {
    id: "ex-supported-row",
    phase: "main",
    sets: 3,
    reps: 10,
    targetRpe: 7,
    notes: "Pause briefly when the elbow reaches your side.",
  },
  {
    id: "ex-half-kneeling-press",
    phase: "main",
    sets: 3,
    reps: 8,
    targetRpe: 7,
    notes: "Use a weight that keeps the last two reps controlled.",
  },
  {
    id: "ex-plank",
    phase: "main",
    sets: 2,
    seconds: 30,
    targetRpe: 6,
    notes: "Neutral spine, breathe through the hold.",
  },
];

const COOL_DOWN_SEEDS: PrescriptionSeed[] = [
  {
    id: "ex-hip-airplane",
    phase: "cooldown",
    sets: 1,
    reps: 6,
    restSetSec: 20,
    restExerciseSec: 20,
    targetRpe: 2,
    notes: "Slow and balanced — six per side.",
  },
  {
    id: "ex-cable-face-pull",
    phase: "cooldown",
    sets: 1,
    reps: 15,
    restSetSec: 0,
    restExerciseSec: 0,
    targetRpe: 2,
    notes: "Very light. Finish with the shoulders feeling open.",
  },
];

// ---------------------------------------------------------------------------
// Music — mock playlists. Files live in public/audio/music/; a missing file
// fails silently in the player so the session is never blocked by an asset.
// ---------------------------------------------------------------------------

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: "pl-steady",
    name: "Steady drive",
    mood: "Even tempo, good for controlled reps",
    tracks: [
      {
        id: "tr-steady-1",
        title: "Groundwork",
        artist: "FITAI Sessions",
        url: "/audio/music/steady-01.mp3",
      },
      {
        id: "tr-steady-2",
        title: "Long Runway",
        artist: "FITAI Sessions",
        url: "/audio/music/steady-02.mp3",
      },
    ],
  },
  {
    id: "pl-push",
    name: "Push harder",
    mood: "Higher energy for the working sets",
    tracks: [
      {
        id: "tr-push-1",
        title: "Overhead",
        artist: "FITAI Sessions",
        url: "/audio/music/push-01.mp3",
      },
      {
        id: "tr-push-2",
        title: "Second Wind",
        artist: "FITAI Sessions",
        url: "/audio/music/push-02.mp3",
      },
    ],
  },
  {
    id: "pl-calm",
    name: "Calm focus",
    mood: "Quiet beds for warm-up and cooldown",
    tracks: [
      {
        id: "tr-calm-1",
        title: "Slow Tide",
        artist: "FITAI Sessions",
        url: "/audio/music/calm-01.mp3",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Motion specifications — one per AI-supported exercise.
//
// The ONNX URLs point at S3 in production (GetMotionSpecification). Locally they
// resolve to /models/... which is normally absent, so resolveMotionEngine falls
// back to the simulated engine. See domain/onnx-motion-engine.ts.
// ---------------------------------------------------------------------------

const LIFECYCLE_CUES: CoachCue[] = [
  {
    code: "set-start",
    text: "Starting the set — take your time.",
    audioUrl: "/audio/cues/set-start.mp3",
    severity: 1,
  },
  {
    code: "set-end",
    text: "Set done. Take your rest.",
    audioUrl: "/audio/cues/set-end.mp3",
    severity: 1,
  },
  {
    code: "good-rep",
    text: "Good depth — keep that.",
    audioUrl: "/audio/cues/good-rep.mp3",
    severity: 1,
  },
];

function motionSpec(
  exerciseId: string,
  romRange: RomRange,
  rules: FormRule[],
  cameraAngle: string,
): MotionSpec {
  return {
    exerciseId,
    onnxDetectorUrl: "/models/person-detector.onnx",
    onnxSkeletonUrl: "/models/rtmpose-17kp.onnx",
    localRulesUrl: `/models/rules/${exerciseId}.json`,
    dialogueEngineUrl: `/models/dialogue/${exerciseId}.json`,
    recommendedCameraAngle: cameraAngle,
    romRange,
    rules,
    cues: [
      ...LIFECYCLE_CUES,
      ...rules.map((rule) => ({
        code: rule.code,
        text: rule.message,
        audioUrl: `/audio/cues/${rule.code}.mp3`,
        severity: rule.severity,
      })),
    ],
    cueCooldownSec: {
      "good-rep": 20,
      ...Object.fromEntries(rules.map((rule) => [rule.code, rule.severity === 2 ? 6 : 12])),
    },
  };
}

const MOCK_MOTION_SPECS: Record<string, MotionSpec> = {
  "ex-incline-push-up": motionSpec(
    "ex-incline-push-up",
    { joints: ["left_shoulder", "left_elbow", "left_wrist"], startDeg: 170, endDeg: 90 },
    [
      {
        code: "hip-sag",
        message: "Lift the hips — keep one straight line.",
        severity: 2,
        joints: ["left_shoulder", "left_hip", "left_knee"],
        kind: "angle-below",
        thresholdDeg: 155,
      },
    ],
    "side",
  ),
  "ex-half-kneeling-press": motionSpec(
    "ex-half-kneeling-press",
    { joints: ["left_shoulder", "left_elbow", "left_wrist"], startDeg: 80, endDeg: 170 },
    [
      {
        code: "trunk-lean",
        message: "Stay tall — don't lean back.",
        severity: 2,
        joints: ["left_shoulder", "left_hip", "left_knee"],
        kind: "angle-below",
        thresholdDeg: 160,
      },
    ],
    "front",
  ),
  "ex-glute-bridge": motionSpec(
    "ex-glute-bridge",
    { joints: ["left_shoulder", "left_hip", "left_knee"], startDeg: 105, endDeg: 165 },
    [
      {
        code: "shallow-hips",
        message: "Drive the hips a little higher.",
        severity: 1,
        joints: ["left_shoulder", "left_hip", "left_knee"],
        kind: "angle-below",
        thresholdDeg: 130,
      },
    ],
    "side",
  ),
};

// ---------------------------------------------------------------------------
// Public mock
// ---------------------------------------------------------------------------

const SESSION_TITLES: Record<string, string> = {
  "lower-foundation": "Lower-body foundation",
  "upper-control": "Upper-body control",
  "posterior-chain": "Posterior-chain strength",
  "full-body-rhythm": "Full-body rhythm",
};

export function getMockLiveSession(sessionId: string): LiveSessionPlan {
  const warmUps = WARM_UP_SEEDS.map(toLiveExercise);
  const mainExercises = MAIN_SEEDS.map(toLiveExercise);
  const coolDowns = COOL_DOWN_SEEDS.map(toLiveExercise);

  const usedMotionSpecs = Object.fromEntries(
    [...warmUps, ...mainExercises, ...coolDowns]
      .filter((exercise) => exercise.hasAiSupported && MOCK_MOTION_SPECS[exercise.exerciseId])
      .map((exercise) => [exercise.exerciseId, MOCK_MOTION_SPECS[exercise.exerciseId]!]),
  );

  const plan: LiveSessionPlan = {
    sessionId,
    sessionPlanId: sessionId,
    title: SESSION_TITLES[sessionId] ?? "Today's session",
    targetRpe: 7,
    estimatedDurationMin: 0,
    warmUps,
    mainExercises,
    coolDowns,
    playlists: MOCK_PLAYLISTS,
    motionSpecs: usedMotionSpecs,
    recentAvgVolumeKg: 1180,
    personalRecords: {
      "ex-supported-row": 21.5,
      "ex-half-kneeling-press": 17.2,
    },
    durationWarnMin: 90,
  };

  return { ...plan, estimatedDurationMin: estimatedDurationMin(plan) };
}
