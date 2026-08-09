import { createClient } from "@connectrpc/connect";
import { notFound } from "next/navigation";

import { estimatedDurationMin } from "@/features/workout/domain/session-flow";
import type { LiveExercise, LiveSessionPlan, MotionSpec, Playlist } from "@/features/workout/model/live-session.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

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
        onnxDetectorUrl: spec.onnxDetectorUrl || "/models/person-detector.onnx",
        onnxSkeletonUrl: spec.onnxSkeletonUrl || "/models/rtmpose-17kp.onnx",
        localRulesUrl: spec.localRulesUrl || `/models/rules/${spec.exerciseId}.json`,
        dialogueEngineUrl: spec.dialogueEngineUrl || `/models/dialogue/${spec.exerciseId}.json`,
        recommendedCameraAngle: spec.recommendedCameraAngle || "side",
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
    targetRpe: mainExercises?.[0]?.targetRpe || 7,
    estimatedDurationMin: 0,
    warmUps,
    mainExercises,
    coolDowns,
    playlists: STATIC_PLAYLISTS,
    motionSpecs,
    recentAvgVolumeKg,
    personalRecords,
    durationWarnMin: 90,
  };

  return { ...plan, estimatedDurationMin: estimatedDurationMin(plan) };
}

/**
 * Everything the live workout screen needs, fetched directly from gRPC Backend.
 */
export async function getLiveSessionData(planId: string): Promise<LiveSessionPlan> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (!accessToken || !userId) {
    notFound();
  }

  const transport = createServerTransport(accessToken);
  const coaching = createClient(CoachingService, transport);
  const exercises = createClient(ExerciseService, transport);
  const execution = createClient(WorkoutExecutionService, transport);

  // 1. Kích hoạt phiên tập trong Execution Service nếu chưa start
  let activeSessionId = planId;
  try {
    const startRes = await execution.startWorkoutSession({ planId });
    if (startRes.sessionId) {
      activeSessionId = startRes.sessionId;
    }
  } catch {
    // Session có thể đã được start trước đó, tiếp tục dùng planId
  }

  // 2. Lấy kế hoạch bài tập (Prescription) từ Coaching Service
  let sessionRes;
  try {
    sessionRes = await coaching.getSessionPlan({ userId, sessionPlanId: planId });
  } catch (error) {
    console.error(`[getLiveSessionData] Coaching.getSessionPlan failed for planId=${planId}:`, error);
    notFound();
  }

  const prescription = sessionRes.sessionPlan?.prescription;
  if (!sessionRes.sessionPlan || !prescription) {
    notFound();
  }

  // 3. Tải thông tin chi tiết bài tập từ Exercise Service
  const ids = [
    ...(prescription.warmUps || []),
    ...(prescription.mainExercises || []),
    ...(prescription.coolDowns || []),
  ].map((item) => item.exerciseId);

  const infosRes = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await exercises.getExercise({ id });
        if (res.exercise) {
          return res;
        }
      } catch (err) {
        console.warn(`[getLiveSessionData] exercises.getExercise failed for id=${id}:`, err);
      }
      return {
        exercise: {
          id,
          name: id.replace(/^ex-/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          equipmentId: "",
          instructions: "",
          videoUrl: "",
          thumbnailUrl: "",
          hasAiSupported: false,
          formCues: [],
          commonMistakes: [],
          breathingCue: "",
        },
      };
    }),
  );

  // 4. Tải AI Motion Specifications cho các bài có AI Support
  const aiIds = infosRes.filter((res: any) => res.exercise?.hasAiSupported).map((res: any) => res.exercise!.id);
  const specsRes = await Promise.all(
    aiIds.map((id: string) =>
      execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" }).catch(() => ({
        motionSpecification: undefined,
      })),
    ),
  );

  // 5. Tải lịch sử tập luyện và kỷ lục cá nhân
  const [historyRes, recordsRes] = await Promise.all([
    execution.getWorkoutHistory({ limit: 5, offset: 0 }).catch(() => ({ sessions: [] })),
    execution.getPersonalRecords({ exerciseIds: ids }).catch(() => ({ records: [] })),
  ]);

  return adaptLiveSessionPlan({
    sessionId: activeSessionId,
    sessionRes: sessionRes.sessionPlan,
    infosRes,
    specsRes,
    historyRes,
    recordsRes,
  });
}
