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
  planId,
  sessionRes,
  infosRes,
  specsRes,
  historyRes,
  recordsRes,
}: {
  sessionId: string;
  planId: string;
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
    if (specRes) {
      const spec = specRes.motionSpecification || specRes;
      const exId = spec.exerciseId;
      if (exId) {
        motionSpecs[exId] = {
          exerciseId: exId,
          onnxDetectorUrl: spec.onnxDetectorUrl || spec.onnx_detector_url || "/models/person-detector.onnx",
          onnxSkeletonUrl: spec.onnxSkeletonUrl || spec.onnx_skeleton_url || "/models/rtmpose-17kp.onnx",
          localRulesUrl: spec.localRulesUrl || spec.rules_url || `/models/rules/${exId}.json`,
          dialogueEngineUrl: spec.dialogueEngineUrl || spec.dialogues_url || `/models/dialogue/${exId}.json`,
          recommendedCameraAngle: spec.recommendedCameraAngle || "side",
          romRange: spec.romRange || { joints: [], startDeg: 0, endDeg: 0 },
          rep_type:
            spec.rep_type ||
            (exId.toLowerCase().includes("plank") ||
            exId.toLowerCase().includes("hold") ||
            exId.toLowerCase().includes("wall_sit")
              ? "timed"
              : "rep"),
          phase_detection: spec.phase_detection,
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
  }

  // Guarantee motionSpecs object exists for all AI supported exercises
  for (const infoRes of infosRes) {
    const ex = infoRes?.exercise;
    if (ex && ex.hasAiSupported && !motionSpecs[ex.id]) {
      const isTimedName =
        ex.id.toLowerCase().includes("plank") ||
        ex.id.toLowerCase().includes("hold") ||
        ex.id.toLowerCase().includes("wall_sit");
      motionSpecs[ex.id] = {
        exerciseId: ex.id,
        onnxDetectorUrl: ex.onnxDetectorUrl || ex.onnx_detector_url || "/models/person-detector.onnx",
        onnxSkeletonUrl: ex.onnxSkeletonUrl || ex.onnx_skeleton_url || "/models/rtmpose-17kp.onnx",
        localRulesUrl: ex.rulesUrl || ex.rules_url || `/models/rules/${ex.id}.json`,
        dialogueEngineUrl: ex.dialoguesUrl || ex.dialogues_url || `/models/dialogue/${ex.id}.json`,
        recommendedCameraAngle: "side",
        romRange: { joints: ["shoulder", "elbow", "wrist"], startDeg: 0, endDeg: 0 },
        rep_type: isTimedName ? "timed" : "rep",
        phase_detection: isTimedName ? { metric: "none", thresholds: { always: {} } } : undefined,
        rules: [],
        cues: [],
        cueCooldownSec: {},
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

  let protectionNote: { title: string; description: string } | undefined;
  const weeklyCount = (sessionRes as any)?.weeklySessionCount || (sessionRes as any)?.totalWeeklySessions || 0;
  if (weeklyCount > 6) {
    protectionNote = {
      title: "Workout Frequency Warning",
      description: `You have ${weeklyCount} workout sessions this week (exceeding the recommended 6 sessions/week). Please listen to your body and prioritize recovery.`,
    };
  }

  const plan: LiveSessionPlan = {
    sessionId,
    sessionPlanId: planId,
    title: sessionRes.targetMuscleGroups?.join(", ") || "Workout Session",
    targetRpe: mainExercises?.[0]?.targetRpe || 7,
    estimatedDurationMin: 0,
    warmUps,
    mainExercises,
    coolDowns,
    playlists: STATIC_PLAYLISTS,
    motionSpecs,
    protectionNote,
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

  let targetPlanId = planId;
  let sessionRes: any = null;

  // 1. Tải thông tin kế hoạch bài tập (Prescription) từ Coaching Service
  try {
    sessionRes = await coaching.getSessionPlan({ userId, sessionPlanId: targetPlanId });
  } catch (err) {
    console.warn(`[getLiveSessionData] coaching.getSessionPlan failed for targetPlanId=${targetPlanId}:`, err);
  }

  const prescription = sessionRes?.sessionPlan?.prescription;
  if (!sessionRes?.sessionPlan || !prescription) {
    notFound();
  }

  // 2. Kích hoạt phiên tập trong Execution Service để lấy workout_session_id (UUID)
  let activeSessionId = "";
  try {
    const startRes = await execution.startWorkoutSession({ planId: targetPlanId });
    if (startRes.sessionId) {
      activeSessionId = startRes.sessionId;
    }
  } catch (startErr: any) {
    console.warn("[getLiveSessionData] startWorkoutSession returned error (resolving conflict):", startErr?.message || startErr);
    try {
      const historyRes = await execution.getWorkoutHistory({ limit: 10, offset: 0 });
      const firstSession = historyRes.sessions?.[0];
      if (firstSession?.sessionId) {
        console.log("[getLiveSessionData] Aborting hanging session:", firstSession.sessionId);
        await execution.abortWorkoutSession({
          sessionId: firstSession.sessionId,
          reason: "SYSTEM_ABORT_FOR_NEW_SESSION",
        });
      }
      const retryRes = await execution.startWorkoutSession({ planId: targetPlanId });
      if (retryRes.sessionId) {
        activeSessionId = retryRes.sessionId;
      }
    } catch (retryErr) {
      console.error("[getLiveSessionData] Failed to resolve active session conflict & start session:", retryErr);
    }
  }

  // ĐẢM BẢO NGHIÊM NGẶT: activeSessionId bắt buộc phải là UUID hợp lệ của workout_execution
  // Tuyệt đối KHÔNG BAO GIỜ fallback activeSessionId = planId!
  if (!activeSessionId) {
    console.error("[getLiveSessionData] CRITICAL ERROR: Could not obtain execution session UUID.");
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
          name: id.replace(/^ex-/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
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
  const [specsRes, historyRes, recordsRes] = await Promise.all([
    Promise.all(
      aiIds.map((id: string) =>
        execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" }).catch(() => ({
          motionSpecification: undefined,
        })),
      ),
    ),
    execution.getWorkoutHistory({ limit: 10, offset: 0 }).catch(() => ({ sessions: [] })),
    execution.getPersonalRecords({ exerciseIds: ids }).catch(() => ({ records: [] })),
  ]);

  return adaptLiveSessionPlan({
    sessionId: activeSessionId,
    planId: targetPlanId,
    sessionRes: sessionRes.sessionPlan,
    infosRes,
    specsRes,
    historyRes,
    recordsRes,
  });
}
