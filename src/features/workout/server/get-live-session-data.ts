import { createClient } from "@connectrpc/connect";
import { notFound } from "next/navigation";

import {
  isTimedExerciseSlug,
  resolveDialogueAssetUrl,
  resolveRulesAssetUrl,
} from "@/features/workout/domain/motion-asset-url";
import { estimatedDurationMin } from "@/features/workout/domain/session-flow";
import type {
  LiveExercise,
  LiveSessionPlan,
  MotionSpec,
  Playlist,
} from "@/features/workout/model/live-session.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
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
  const mainExercises = (prescription.mainExercises || []).map((ex: any) =>
    mapExercise(ex, "main"),
  );
  const coolDowns = (prescription.coolDowns || []).map((ex: any) => mapExercise(ex, "cooldown"));

  const motionSpecs: Record<string, MotionSpec> = {};
  for (const specRes of specsRes) {
    if (specRes) {
      const spec = specRes.motionSpecification || specRes;
      const exId = spec.exerciseId;
      if (exId) {
        const info = infosRes.find((inf) => inf.exercise?.id === exId)?.exercise;
        const rawRulesUrl = spec.localRulesUrl || spec.rules_url;
        const rawDialogueUrl = spec.dialogueEngineUrl || spec.dialogues_url;
        motionSpecs[exId] = {
          exerciseId: exId,
          onnxDetectorUrl:
            spec.onnxDetectorUrl || spec.onnx_detector_url || "/models/yolo11n-pose.onnx",
          onnxSkeletonUrl:
            spec.onnxSkeletonUrl || spec.onnx_skeleton_url || "/models/yolo11n-pose.onnx",
          localRulesUrl: resolveRulesAssetUrl(rawRulesUrl, exId, info?.name),
          dialogueEngineUrl: resolveDialogueAssetUrl(rawDialogueUrl, exId, info?.name),
          recommendedCameraAngle: (spec.recommendedCameraAngle || "side").toLowerCase(),
          romRange: spec.romRange || { joints: [], startDeg: 0, endDeg: 0 },
          rep_type:
            spec.rep_type || (isTimedExerciseSlug(exId, info?.name, rawRulesUrl) ? "timed" : "rep"),
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
      const rawRulesUrl = ex.rulesUrl || ex.rules_url;
      const rawDialogueUrl = ex.dialoguesUrl || ex.dialogues_url;
      const isTimedName = isTimedExerciseSlug(ex.id, ex.name, rawRulesUrl);
      motionSpecs[ex.id] = {
        exerciseId: ex.id,
        onnxDetectorUrl: ex.onnxDetectorUrl || ex.onnx_detector_url || "/models/yolo11n-pose.onnx",
        onnxSkeletonUrl: ex.onnxSkeletonUrl || ex.onnx_skeleton_url || "/models/yolo11n-pose.onnx",
        localRulesUrl: resolveRulesAssetUrl(rawRulesUrl, ex.id, ex.name),
        dialogueEngineUrl: resolveDialogueAssetUrl(rawDialogueUrl, ex.id, ex.name),
        recommendedCameraAngle: "side",
        romRange: { joints: ["shoulder", "elbow", "wrist"], startDeg: 0, endDeg: 0 },
        rep_type: isTimedName ? "timed" : "rep",
        phase_detection: undefined,
        rules: [],
        cues: [],
        cueCooldownSec: {},
      };
    }
  }

  const sessions = historyRes.sessions || [];
  const validSessions = sessions.filter((s: any) => s.totalVolume > 0);
  const recentAvgVolumeKg =
    validSessions.length > 0
      ? Math.round(
          validSessions.reduce((acc: number, curr: any) => acc + (curr.totalVolume || 0), 0) /
            validSessions.length,
        )
      : 0;

  const personalRecords: Record<string, number> = {};
  if (recordsRes && recordsRes.records) {
    for (const rec of recordsRes.records) {
      personalRecords[rec.exerciseId] = rec.oneRepMax || rec.weight || 0;
    }
  }

  let protectionNote: { title: string; description: string } | undefined;
  const weeklyCount =
    (sessionRes as any)?.weeklySessionCount || (sessionRes as any)?.totalWeeklySessions || 0;
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

const AI_12_EXERCISES_CONFIG: {
  id: string;
  name: string;
  angle: "side" | "front";
  isTimed?: boolean;
  isWeighted?: boolean;
  targetReps: number;
  durationSeconds: number;
  instructions: string;
  formCues: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
}[] = [
  {
    id: "push_up",
    name: "Push-up",
    angle: "side",
    targetReps: 5,
    durationSeconds: 0,
    instructions:
      "Keep body in a straight line from shoulders to ankles, lower chest until elbows reach 90°.",
    formCues: ["Keep core braced", "Elbows at 45°", "Full lockout at top"],
    thumbnailUrl: "https://static.exercisedb.dev/media/I4hDWkc.gif",
    videoUrl: "https://www.youtube.com/watch?v=bSkNEdRaJlg",
  },
  {
    id: "squat",
    name: "Barbell / Bodyweight Squat",
    angle: "side",
    targetReps: 5,
    durationSeconds: 0,
    instructions:
      "Send hips back and down until thighs are parallel to the floor, keeping chest upright.",
    formCues: ["Knees track over toes", "Hit parallel depth", "Drive through heels"],
    thumbnailUrl: "https://static.exercisedb.dev/media/qXTaZnJ.gif",
    videoUrl: "https://www.youtube.com/watch?v=wFOgKtxNCiI",
  },
  {
    id: "plank",
    name: "Forearm Plank",
    angle: "side",
    isTimed: true,
    targetReps: 0,
    durationSeconds: 30,
    instructions: "Hold a rigid straight line from shoulders through hips to ankles.",
    formCues: ["Squeeze glutes", "Do not let hips sag or pike", "Neutral neck"],
    thumbnailUrl: "https://static.exercisedb.dev/media/VBAWRPG.gif",
    videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw",
  },
  {
    id: "lunge",
    name: "Forward Lunge",
    angle: "side",
    targetReps: 4,
    durationSeconds: 0,
    instructions: "Step forward and lower hips until both knees are bent at ~90 degrees.",
    formCues: ["Upright torso", "Front knee aligned with foot", "Push back to start"],
    thumbnailUrl: "https://static.exercisedb.dev/media/RRWFUcw.gif",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
  },
  {
    id: "bicep_curl",
    name: "Dumbbell Bicep Curl",
    angle: "side",
    isWeighted: true,
    targetReps: 5,
    durationSeconds: 0,
    instructions: "Curl weights toward shoulders while keeping elbows pinned to your sides.",
    formCues: ["Pin elbows to ribs", "Avoid swinging torso", "Full extension at bottom"],
    thumbnailUrl: "https://static.exercisedb.dev/media/NbVPDMW.gif",
    videoUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  },
  {
    id: "shoulder_press",
    name: "Overhead Shoulder Press",
    angle: "front",
    isWeighted: true,
    targetReps: 5,
    durationSeconds: 0,
    instructions: "Press weights overhead to full lockout without arching your lower back.",
    formCues: ["Core tight", "Full overhead lockout", "Control descent to shoulders"],
    thumbnailUrl: "https://static.exercisedb.dev/media/znQUdHY.gif",
    videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
  },
  {
    id: "bench_press",
    name: "Bench Press",
    angle: "side",
    isWeighted: true,
    targetReps: 5,
    durationSeconds: 0,
    instructions: "Lower the bar under control to mid-chest and press back to full extension.",
    formCues: ["Retract shoulder blades", "Controlled touch on chest", "Full elbow extension"],
    thumbnailUrl: "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    videoUrl: "https://www.youtube.com/watch?v=bSkNEdRaJlg",
  },
  {
    id: "deadlift",
    name: "Barbell Deadlift",
    angle: "side",
    isWeighted: true,
    targetReps: 5,
    durationSeconds: 0,
    instructions:
      "Hinge at hips, grip the bar, brace your lats and drive the floor away to lockout.",
    formCues: [
      "Neutral flat spine",
      "Bar stays close to shins",
      "Lock out hips and knees together",
    ],
    thumbnailUrl: "https://static.exercisedb.dev/media/ila4NZS.gif",
    videoUrl: "https://www.youtube.com/watch?v=wFOgKtxNCiI",
  },
  {
    id: "pull_up",
    name: "Pull-up",
    angle: "front",
    targetReps: 5,
    durationSeconds: 0,
    instructions: "Pull from a dead hang until your chin clears the bar, then lower with control.",
    formCues: ["Start from full hang", "Pull elbows down to ribs", "Chin over bar"],
    thumbnailUrl: "https://static.exercisedb.dev/media/lBDjFxJ.gif",
    videoUrl: "https://www.youtube.com/watch?v=m7mwLAyR3k4",
  },
  {
    id: "sit_up",
    name: "Sit-up",
    angle: "side",
    targetReps: 5,
    durationSeconds: 0,
    instructions:
      "Engage abs to curl your torso all the way up toward your knees, then lower back down.",
    formCues: ["Do not yank neck", "Exhale on the way up", "Controlled eccentric"],
    thumbnailUrl: "https://static.exercisedb.dev/media/Bn6TXyO.gif",
    videoUrl: "https://www.youtube.com/watch?v=1fbU_MkV7NE",
  },
  {
    id: "triceps_dip",
    name: "Triceps Dip",
    angle: "side",
    targetReps: 5,
    durationSeconds: 0,
    instructions:
      "Lower your body by bending elbows until upper arms are parallel to floor, then press up.",
    formCues: ["Keep shoulders down", "Hit 90° elbow flexion", "Lock out at top"],
    thumbnailUrl: "https://static.exercisedb.dev/media/X6C6i5Y.gif",
    videoUrl: "https://www.youtube.com/watch?v=pjo7EMsSWwc",
  },
  {
    id: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    angle: "front",
    isWeighted: true,
    targetReps: 5,
    durationSeconds: 0,
    instructions: "Raise arms out to the sides up to shoulder height with a slight bend in elbows.",
    formCues: ["Lead with elbows", "Raise to shoulder level", "No torso momentum"],
    thumbnailUrl: "https://static.exercisedb.dev/media/DsgkuIt.gif",
    videoUrl: "https://www.youtube.com/watch?v=AJZRMJ7qlbo",
  },
];

function buildAi12ExercisesSessionPlan(sessionId: string): LiveSessionPlan {
  const mainExercises: LiveExercise[] = AI_12_EXERCISES_CONFIG.map((cfg) => ({
    exerciseId: cfg.id,
    name: cfg.name,
    phase: "main",
    equipmentId: cfg.isWeighted ? "eq-dumbbell" : "eq-bodyweight",
    targetSets: 1,
    targetReps: cfg.targetReps,
    durationSeconds: cfg.durationSeconds,
    targetWeightKg: cfg.isWeighted ? 15 : 0,
    isWeighted: Boolean(cfg.isWeighted),
    restSetSec: 15,
    restExerciseSec: 15,
    targetRpe: 7.5,
    notes: `AI Camera Tracking (${cfg.angle} view recommended)`,
    instructions: cfg.instructions,
    formCues: cfg.formCues,
    commonMistakes: [],
    breathingCue: "Inhale on eccentric, exhale on effort",
    videoUrl: cfg.videoUrl || "",
    thumbnailUrl: cfg.thumbnailUrl || "",
    hasAiSupported: true,
  }));

  const motionSpecs: Record<string, MotionSpec> = {};
  for (const cfg of AI_12_EXERCISES_CONFIG) {
    motionSpecs[cfg.id] = {
      exerciseId: cfg.id,
      onnxDetectorUrl: "/models/yolo11n-pose.onnx",
      onnxSkeletonUrl: "/models/yolo11n-pose.onnx",
      localRulesUrl: resolveRulesAssetUrl(undefined, cfg.id, cfg.name),
      dialogueEngineUrl: resolveDialogueAssetUrl(undefined, cfg.id, cfg.name),
      recommendedCameraAngle: cfg.angle,
      romRange: { joints: ["shoulder", "elbow", "wrist"], startDeg: 0, endDeg: 0 },
      rep_type: cfg.isTimed ? "timed" : "rep",
      phase_detection: undefined,
      rules: [],
      cues: [],
      cueCooldownSec: {},
    };
  }

  const plan: LiveSessionPlan = {
    sessionId,
    sessionPlanId: sessionId,
    title: "12 AI-Supported Exercises Suite",
    targetRpe: 7.5,
    estimatedDurationMin: 25,
    warmUps: [],
    mainExercises,
    coolDowns: [],
    playlists: STATIC_PLAYLISTS,
    motionSpecs,
    recentAvgVolumeKg: 1000,
    personalRecords: {},
    durationWarnMin: 90,
  };

  return { ...plan, estimatedDurationMin: estimatedDurationMin(plan) };
}

// Fetch live workout screen data directly from gRPC backend.
export async function getLiveSessionData(planId: string): Promise<LiveSessionPlan> {
  if (planId === "ai-12-exercises" || planId.startsWith("ai-12-")) {
    return buildAi12ExercisesSessionPlan(planId);
  }

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
    console.warn(
      `[getLiveSessionData] coaching.getSessionPlan failed for targetPlanId=${targetPlanId}:`,
      err,
    );
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
    console.warn(
      "[getLiveSessionData] startWorkoutSession returned error (resolving conflict):",
      startErr?.message || startErr,
    );
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
      console.error(
        "[getLiveSessionData] Failed to resolve active session conflict & start session:",
        retryErr,
      );
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
          name: id
            .replace(/^ex-/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
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
  const aiIds = infosRes
    .filter((res: any) => res.exercise?.hasAiSupported)
    .map((res: any) => res.exercise!.id);
  const [specsRes, historyRes, recordsRes] = await Promise.all([
    Promise.all(
      aiIds.map((id: string) =>
        execution
          .getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" })
          .catch(() => ({
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
