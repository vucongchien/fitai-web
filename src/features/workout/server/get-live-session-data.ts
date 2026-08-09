import { createClient } from "@connectrpc/connect";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { estimatedDurationMin } from "@/features/workout/domain/session-flow";
import type { LiveExercise, LiveSessionPlan, MotionSpec, Playlist } from "@/features/workout/model/live-session.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

//Hard code: Fallback static playlist since gRPC backend does not have playlist music service.
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

export function getFallbackVideoForExercise(identifier: string): { videoUrl: string; thumbnailUrl: string } {
  const normalized = identifier.toLowerCase();
  if (normalized.includes("squat")) {
    return {
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-in-a-gym-43029-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop",
    };
  }
  if (normalized.includes("pushup") || normalized.includes("push-up") || normalized.includes("push up")) {
    return {
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-doing-push-ups-at-home-43033-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop",
    };
  }
  if (normalized.includes("plank")) {
    return {
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-plank-exercise-on-a-mat-43030-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop",
    };
  }
  if (normalized.includes("lunge")) {
    return {
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-lunges-in-a-gym-43028-large.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop",
    };
  }
  return {
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-in-a-gym-43029-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop",
  };
}

export function getFallbackInstructionsForExercise(identifier: string): {
  instructions: string;
  formCues: string[];
  commonMistakes: string[];
  breathingCue: string;
} {
  const normalized = identifier.toLowerCase();
  if (normalized.includes("squat")) {
    return {
      instructions: "Đứng chân rộng bằng vai, gồng chặt cơ bụng. Hạ hông gập gối xuống sâu như tư thế ngồi ghế, giữ ngực cao. Đẩy mạnh qua gót chân để đứng thẳng lên.",
      formCues: ["Giữ thẳng lưng", "Đẩy đầu gối theo hướng mũi chân", "Gồng chặt cơ bụng"],
      commonMistakes: ["Đầu gối chụm vào trong", "Võng thắt lưng"],
      breathingCue: "Hít vào sâu khi hạ người xuống, thở ra khi đẩy người đứng thẳng lên.",
    };
  }
  if (normalized.includes("pushup") || normalized.includes("push-up") || normalized.includes("push up")) {
    return {
      instructions: "Vào tư thế chống đẩy chuẩn, tay mở rộng hơn vai một chút. Hạ ngực xuống sát mặt sàn rồi dùng lực cơ ngực và tay sau đẩy mạnh về vị trí ban đầu.",
      formCues: ["Thân người trên một đường thẳng", "Khuỷu tay mở 45 độ", "Siết chặt cơ mông"],
      commonMistakes: ["Võng thắt lưng", "Nhô hông lên cao"],
      breathingCue: "Hít vào khi hạ người xuống, thở ra mạnh khi đẩy người lên.",
    };
  }
  if (normalized.includes("plank")) {
    return {
      instructions: "Chống hai cẳng tay xuống sàn, khuỷu tay vuông góc ngay dưới vai. Giữ toàn bộ đầu, lưng, hông và chân thành một đường thẳng tắp.",
      formCues: ["Gồng cứng cơ bụng", "Siết mông", "Không hạ võng hông"],
      commonMistakes: ["Cúi gập cổ quá sâu", "Hạ hông chạm sàn"],
      breathingCue: "Duy trì nhịp thở đều đặn và sâu, không nín thở.",
    };
  }
  if (normalized.includes("lunge")) {
    return {
      instructions: "Đứng thẳng, bước một chân về phía trước và hạ hông xuống cho tới khi cả hai gối gập thành góc 90 độ. Đẩy ngược gót chân trước để trở về tư thế ban đầu.",
      formCues: ["Giữ lưng thẳng đứng", "Gối trước không vượt quá mũi chân"],
      commonMistakes: ["Đầu gối trước đổ nghiêng vào trong"],
      breathingCue: "Hít vào khi bước hạ hông xuống, thở ra khi rút chân về.",
    };
  }
  return {
    instructions: "Giữ tư thế chuẩn, gồng chặt cơ lõi và thực hiện chuyển động một cách kiểm soát, đúng biên độ.",
    formCues: ["Duy trì tư thế trung tính", "Gồng cơ bụng"],
    commonMistakes: ["Ăn gian chuyển động bằng đà"],
    breathingCue: "Hít vào ở pha hạ lực, thở ra ở pha phát lực.",
  };
}

const DEFAULT_FALLBACK_EXERCISES: LiveExercise[] = [
  {
    exerciseId: "ex-bodyweight-squat",
    name: "Bodyweight Squat",
    phase: "main",
    equipmentId: "bodyweight",
    targetSets: 3,
    targetReps: 12,
    durationSeconds: 0,
    targetWeightKg: 0,
    isWeighted: false,
    restSetSec: 60,
    restExerciseSec: 90,
    targetRpe: 7,
    notes: "Giữ ngực mở, đẩy đầu gối về phía ngoài theo hướng mũi chân.",
    instructions: "Đứng chân rộng bằng vai, hạ hông xuống thấp như đang ngồi trên ghế, sau đó đứng thẳng dậy.",
    formCues: ["Thẳng lưng", "Đẩy đầu gối ra ngoài"],
    commonMistakes: ["Đầu gối chụm vào trong"],
    breathingCue: "Hít vào khi hạ xuống, thở ra khi đứng lên.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-in-a-gym-43029-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop",
    hasAiSupported: true,
  },
  {
    exerciseId: "ex-pushup",
    name: "Push-up",
    phase: "main",
    equipmentId: "bodyweight",
    targetSets: 3,
    targetReps: 10,
    durationSeconds: 0,
    targetWeightKg: 0,
    isWeighted: false,
    restSetSec: 60,
    restExerciseSec: 90,
    targetRpe: 7,
    notes: "Giữ cột sống trung tính và thực hiện hết phạm vi chuyển động.",
    instructions: "Vào tư thế chống đẩy, hạ ngực gần sát sàn, sau đó đẩy mạnh người lên.",
    formCues: ["Gồng cơ bụng", "Khuỷu tay mở 45 độ"],
    commonMistakes: ["Võng lưng"],
    breathingCue: "Hít vào khi hạ người xuống, thở ra khi đẩy người lên.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-doing-push-ups-at-home-43033-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop",
    hasAiSupported: true,
  },
  {
    exerciseId: "ex-plank",
    name: "Plank Hold",
    phase: "main",
    equipmentId: "bodyweight",
    targetSets: 3,
    targetReps: 0,
    durationSeconds: 45,
    targetWeightKg: 0,
    isWeighted: false,
    restSetSec: 45,
    restExerciseSec: 60,
    targetRpe: 7,
    notes: "Gồng chặt cơ bụng và cơ mông.",
    instructions: "Giữ tư thế chống bằng cẳng tay, giữ toàn bộ thân người trên một đường thẳng.",
    formCues: ["Gồng cơ mông", "Không hạ võng hông"],
    commonMistakes: ["Võng thắt lưng"],
    breathingCue: "Hít thở đều đặn và duy trì nhịp thở.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-plank-exercise-on-a-mat-43030-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop",
    hasAiSupported: false,
  },
];

async function getFallbackLiveSession(sessionId: string): Promise<LiveSessionPlan> {
  let mainExercises: LiveExercise[] = [];

  if (sessionId.startsWith("adhoc_")) {
    const parts = sessionId.split("_");
    if (parts.length >= 2 && parts[1] && parts[1] !== "default") {
      const rawIds = parts[1].split(",");
      const loaded = await Promise.all(
        rawIds.map(async (id) => {
          const ex = await exerciseSearchRepository.getById(id);
          const fallbackMedia = getFallbackVideoForExercise(ex?.name || id);
          const fallbackGuide = getFallbackInstructionsForExercise(ex?.name || id);
          return {
            exerciseId: id,
            name: ex?.name || id.replace(/^ex-/, "").replace(/-/g, " "),
            phase: "main" as const,
            equipmentId: ex?.equipmentId || "eq-standard",
            targetSets: 3,
            targetReps: 10,
            durationSeconds: 0,
            targetWeightKg: ex?.equipmentId === "bodyweight" ? 0 : 10,
            isWeighted: ex?.equipmentId !== "bodyweight",
            restSetSec: ex?.defaultRestSeconds || 60,
            restExerciseSec: 90,
            targetRpe: 7,
            notes: ex?.instructions || "Maintain proper form.",
            instructions: ex?.instructions || fallbackGuide.instructions,
            formCues: fallbackGuide.formCues,
            commonMistakes: fallbackGuide.commonMistakes,
            breathingCue: fallbackGuide.breathingCue,
            videoUrl: ex?.videoUrl || fallbackMedia.videoUrl,
            thumbnailUrl: ex?.thumbnailUrl || fallbackMedia.thumbnailUrl,
            hasAiSupported: Boolean(ex?.hasAiSupported),
          };
        }),
      );
      if (loaded.length > 0) {
        mainExercises = loaded;
      }
    }
  }

  if (mainExercises.length === 0) {
    mainExercises = DEFAULT_FALLBACK_EXERCISES;
  }

  const plan: LiveSessionPlan = {
    sessionId,
    sessionPlanId: sessionId,
    title: "Workout Session",
    targetRpe: 7,
    estimatedDurationMin: 30,
    warmUps: [],
    mainExercises,
    coolDowns: [],
    playlists: STATIC_PLAYLISTS,
    motionSpecs: {},
    recentAvgVolumeKg: 0,
    personalRecords: {},
    durationWarnMin: 90,
  };

  return { ...plan, estimatedDurationMin: estimatedDurationMin(plan) };
}

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
    const fallbackMedia = getFallbackVideoForExercise(prescribed.exerciseName || prescribed.exerciseId);
    const fallbackGuide = getFallbackInstructionsForExercise(prescribed.exerciseName || prescribed.exerciseId);

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
      instructions: info?.instructions || fallbackGuide.instructions,
      formCues: info?.formCues?.length ? info.formCues : fallbackGuide.formCues,
      commonMistakes: info?.commonMistakes?.length ? info.commonMistakes : fallbackGuide.commonMistakes,
      breathingCue: info?.breathingCue || fallbackGuide.breathingCue,
      videoUrl: info?.videoUrl || fallbackMedia.videoUrl,
      thumbnailUrl: info?.thumbnailUrl || fallbackMedia.thumbnailUrl,
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

async function getRealLiveSession(sessionId: string, accessToken: string, userId: string): Promise<LiveSessionPlan> {
  const transport = createServerTransport(accessToken);
  const coaching = createClient(CoachingService, transport);
  const exercises = createClient(ExerciseService, transport);
  const execution = createClient(WorkoutExecutionService, transport);

  // Initialize or attach to active session in execution service DB
  try {
    await execution.startScheduledWorkoutSession({ sessionId });
  } catch {
    try {
      await execution.startWorkoutSession({ planId: sessionId });
    } catch {
      // Reuse existing active session if one is already in progress
    }
  }

  const sessionRes = await coaching.getSessionPlan({ userId, sessionPlanId: sessionId });
  const prescription = sessionRes.sessionPlan?.prescription;
  if (!sessionRes.sessionPlan || !prescription) {
    throw new Error("Prescription not found for session plan.");
  }

  const ids = [...(prescription.warmUps || []), ...(prescription.mainExercises || []), ...(prescription.coolDowns || [])]
    .map((item) => item.exerciseId);
  const infosRes = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await exercises.getExercise({ id });
        if (res.exercise) {
          return res;
        }
      } catch (err) {
        console.warn(`[getLiveSessionData] exercise.getExercise({ id: "${id}" }) error:`, err);
      }
      const localEx = await exerciseSearchRepository.getById(id);
      if (localEx) {
        return {
          exercise: {
            id: localEx.id,
            name: localEx.name,
            equipmentId: localEx.equipmentId,
            instructions: localEx.instructions,
            videoUrl: localEx.videoUrl,
            thumbnailUrl: localEx.thumbnailUrl,
            hasAiSupported: localEx.hasAiSupported,
            formCues: [],
            commonMistakes: [],
            breathingCue: "",
          },
        };
      }
      const fallbackMedia = getFallbackVideoForExercise(id);
      return {
        exercise: {
          id,
          name: id.replace(/^ex-/, "").replace(/-/g, " "),
          equipmentId: "bodyweight",
          instructions: "Thực hiện đúng tư thế chuẩn.",
          videoUrl: fallbackMedia.videoUrl,
          thumbnailUrl: fallbackMedia.thumbnailUrl,
          hasAiSupported: false,
          formCues: [],
          commonMistakes: [],
          breathingCue: "",
        },
      };
    }),
  );

  const aiIds = infosRes.filter((res: any) => res.exercise?.hasAiSupported).map((res: any) => res.exercise!.id);
  const specsRes = await Promise.all(
    aiIds.map((id: string) =>
      execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" }).catch(() => ({
        motionSpecification: undefined,
      })),
    ),
  );

  const [historyRes, recordsRes] = await Promise.all([
    execution.getWorkoutHistory({ limit: 5, offset: 0 }).catch(() => ({ sessions: [] })),
    execution.getPersonalRecords({ exerciseIds: ids }).catch(() => ({ records: [] })),
  ]);

  const realPlan = adaptLiveSessionPlan({
    sessionId,
    sessionRes: sessionRes.sessionPlan,
    infosRes,
    specsRes,
    historyRes,
    recordsRes,
  });

  if (realPlan.warmUps.length === 0 && realPlan.mainExercises.length === 0 && realPlan.coolDowns.length === 0) {
    return getFallbackLiveSession(sessionId);
  }

  return realPlan;
}

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

  return getFallbackLiveSession(sessionId);
}
