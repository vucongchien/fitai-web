import "server-only";

import { createClient } from "@connectrpc/connect";

import type { LiveExercise, LiveSessionPlan, MotionSpec, Playlist } from "@/features/workout/model/live-session.types";
import { estimatedDurationMin } from "@/features/workout/domain/session-flow";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

//hard code: Fallback static playlist since gRPC backend does not have playlist music service.
const STATIC_PLAYLISTS: Playlist[] = [
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
    ],
  },
];

function adaptLiveSessionPlan({
  sessionId,
  sessionRes,
  infosRes,
  specsRes,
  historyRes,
  recordsRes,
}: {
  sessionId: string;
  sessionRes: any;
  infosRes: any[];
  specsRes: any[];
  historyRes: any;
  recordsRes: any;
}): LiveSessionPlan {
  const prescription = sessionRes.prescription || { warmUps: [], mainExercises: [], coolDowns: [] };

  const mapExercise = (prescribed: any, phase: "warmup" | "main" | "cooldown"): LiveExercise => {
    const info = infosRes.find((inf) => inf.exercise?.id === prescribed.exerciseId)?.exercise;
    const isWeighted = info ? info.equipmentId !== "eq-bodyweight" : false;

    return {
      exerciseId: prescribed.exerciseId,
      name: prescribed.exerciseName || info?.name || "Exercise",
      phase,
      equipmentId: info?.equipmentId || "",
      targetSets: prescribed.targetSets || 3,
      targetReps: prescribed.targetReps || 0,
      durationSeconds: prescribed.durationSeconds || 0,
      targetWeightKg: prescribed.targetWeight || 0,
      isWeighted,
      restSetSec: prescribed.restSetSec || 60,
      restExerciseSec: prescribed.restExerciseSec || 90,
      targetRpe: prescribed.targetRpe || 7,
      notes: prescribed.notes || "",
      instructions: info?.instructions || "",
      formCues: info?.formCues || [],
      commonMistakes: info?.commonMistakes || [],
      breathingCue: info?.breathingCue || "",
      videoUrl: info?.videoUrl || "",
      thumbnailUrl: info?.thumbnailUrl || "",
      hasAiSupported: Boolean(info?.hasAiSupported),
    };
  };

  const warmUps = (prescription.warmUps || []).map((ex: any) => mapExercise(ex, "warmup"));
  const mainExercises = (prescription.mainExercises || []).map((ex: any) => mapExercise(ex, "main"));
  const coolDowns = (prescription.coolDowns || []).map((ex: any) => mapExercise(ex, "cooldown"));

  const motionSpecs: Record<string, MotionSpec> = {};
  for (const specRes of specsRes) {
    if (specRes.motionSpecification) {
      const spec = specRes.motionSpecification;
      motionSpecs[spec.exerciseId] = {
        exerciseId: spec.exerciseId,
        //need to migrate: These local model assets should be provided dynamically by gRPC server in the future.
        onnxDetectorUrl: spec.onnxDetectorUrl || "/models/person-detector.onnx",
        onnxSkeletonUrl: spec.onnxSkeletonUrl || "/models/rtmpose-17kp.onnx",
        localRulesUrl: spec.localRulesUrl || `/models/rules/${spec.exerciseId}.json`,
        dialogueEngineUrl: spec.dialogueEngineUrl || `/models/dialogue/${spec.exerciseId}.json`,
        recommendedCameraAngle: spec.recommendedCameraAngle || "side", //hard code: fallback camera angle
        romRange: spec.romRange || { joints: [], startDeg: 0, endDeg: 0 },
        rules: (spec.rules || []).map((rule: any) => ({
          code: rule.code,
          message: rule.message,
          severity: rule.severity === 2 ? 2 : 1,
          joints: rule.joints || [],
          kind: rule.kind || "angle-below",
          thresholdDeg: rule.thresholdDeg || 0,
        })),
        cues: (spec.cues || []).map((cue: any) => ({
          code: cue.code,
          text: cue.text,
          audioUrl: cue.audioUrl || "",
          severity: cue.severity === 2 ? 2 : 1,
        })),
        cueCooldownSec: spec.cueCooldownSec || {},
      };
    }
  }

  const sessions = historyRes.sessions || [];
  const validSessions = sessions.filter((s: any) => s.totalVolume > 0);
  const recentAvgVolumeKg = validSessions.length > 0
    ? Math.round(validSessions.reduce((acc: number, curr: any) => acc + (curr.totalVolume || 0), 0) / validSessions.length)
    : 0;

  const personalRecords: Record<string, number> = {};
  if (recordsRes && recordsRes.records) {
    for (const rec of recordsRes.records) {
      personalRecords[rec.exerciseId] = rec.oneRepMax || rec.weight || 0;
    }
  }

  const plan: LiveSessionPlan = {
    sessionId,
    sessionPlanId: sessionId,
    title: sessionRes.targetMuscleGroups?.join(", ") || "Workout Session",
    targetRpe: mainExercises?.[0]?.targetRpe || 7, //hard code: fallback default RPE of 7 if main exercises do not specify target RPE
    estimatedDurationMin: 0,
    warmUps,
    mainExercises,
    coolDowns,
    playlists: STATIC_PLAYLISTS,
    motionSpecs,
    recentAvgVolumeKg,
    personalRecords,
    durationWarnMin: 90, //hard code: default warning threshold for session duration
  };

  return { ...plan, estimatedDurationMin: estimatedDurationMin(plan) };
}

async function getRealLiveSession(sessionId: string, accessToken: string, userId: string): Promise<LiveSessionPlan> {
  const transport = createServerTransport(accessToken);
  const coaching = createClient(CoachingService, transport);
  const exercises = createClient(ExerciseService, transport);
  const execution = createClient(WorkoutExecutionService, transport);

  // 1. Prescription: warm_ups / main_exercises / cool_downs
  const sessionRes = await coaching.getSessionPlan({ userId, sessionPlanId: sessionId });
  const prescription = sessionRes.sessionPlan?.prescription;
  if (!sessionRes.sessionPlan || !prescription) {
    throw new Error("Prescription not found for session plan.");
  }

  // 2. Exercise library data for guidance
  const ids = [...(prescription.warmUps || []), ...(prescription.mainExercises || []), ...(prescription.coolDowns || [])]
    .map((item) => item.exerciseId);
  const infosRes = await Promise.all(ids.map((id) => exercises.getExercise({ id })));

  // 3. Motion specs
  const aiIds = infosRes.filter((res) => res.exercise?.hasAiSupported).map((res) => res.exercise!.id);
  const specsRes = await Promise.all(
    aiIds.map((id) => execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" })),
  );

  // 4. Baselines
  const [historyRes, recordsRes] = await Promise.all([
    execution.getWorkoutHistory({ limit: 5, offset: 0 }),
    execution.getPersonalRecords({ exerciseIds: ids }),
  ]);

  return adaptLiveSessionPlan({
    sessionId,
    sessionRes: sessionRes.sessionPlan,
    infosRes,
    specsRes,
    historyRes,
    recordsRes,
  });
}

//hard code: Fallback safe empty session data when gRPC fails to fetch live session.
const getEmptyLiveSession = (sessionId: string): LiveSessionPlan => ({
  sessionId,
  sessionPlanId: sessionId,
  title: "Workout Session",
  targetRpe: 7,
  estimatedDurationMin: 45,
  warmUps: [],
  mainExercises: [],
  coolDowns: [],
  playlists: STATIC_PLAYLISTS,
  motionSpecs: {},
  recentAvgVolumeKg: 0,
  personalRecords: {},
  durationWarnMin: 90,
});

/**
 * Everything the live workout screen needs, in one payload.
 */
export async function getLiveSessionData(sessionId: string): Promise<LiveSessionPlan> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealLiveSession(sessionId, accessToken, userId || "");
    } catch (error) {
      console.warn("[getLiveSessionData] gRPC error:", error);
    }
  }

  return getEmptyLiveSession(sessionId);
}
