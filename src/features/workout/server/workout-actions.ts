"use server";

import { createClient } from "@connectrpc/connect";

import {
  averageFormScore,
  averageRpe,
  bestOneRepMaxByExercise,
  sessionVolumeKg,
} from "@/features/workout/domain/training-load";
import type { AbortReason, SetLogDraft } from "@/features/workout/model/live-session.types";
import type {
  AdhocConfig,
  ExerciseResult,
} from "@/features/workout/model/workout.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";

/**
 * Search exercise library.
 * gRPC: ExerciseService.searchExercises with repository fallback
 */
export async function searchExercises(query: string): Promise<ExerciseResult[]> {
  const results = await exerciseSearchRepository.search({
    q: query,
    bodyPartIds: [],
    targetMuscleIds: [],
    equipmentIds: [],
    difficulty: [],
    tagIds: [],
    aiOnly: false,
  });

  return results.map((ex) => ({
    id: ex.id,
    name: ex.name,
    equipmentId: ex.equipmentId || "eq-standard",
    isWeighted: ex.equipmentId !== "bodyweight",
    defaultWeightKg: ex.equipmentId === "bodyweight" ? undefined : 10,
    prescription: "3 × 10",
    rest: `${ex.defaultRestSeconds || 90} sec`,
    note: ex.instructions || "",
  }));
}

/**
 * Fetch config for Adhoc Workout builder.
 */
export async function getAdhocConfig(): Promise<AdhocConfig> {
  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);

      const res = await coachingClient.getActiveRoadmap({ userId: userId || "" });
      const currentWeek = res.roadmap?.weekPlans[0];
      return {
        targetRpe: currentWeek?.targetRpe ?? 6.5,
        defaultExercises: [],
      };
    } catch (error) {
      console.warn("[getAdhocConfig] gRPC fallback:", error);
    }
  }

  return {
    targetRpe: 7, //Hard code: fallback default RPE when gRPC is offline
    defaultExercises: [],
  };
}

import { create } from "@bufbuild/protobuf";
import {
  AdHocHintSchema,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";

export interface AdhocAiRecommendationOutput {
  muscleGroups: string[];
  reasoning: string;
  estimatedRpe: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
    durationSeconds?: number;
    notes: string;
    restSetSec: number;
    restExerciseSec: number;
  }[];
  warmUps?: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    notes: string;
    restSetSec: number;
  }[];
  coolDowns?: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    notes: string;
    restSetSec: number;
  }[];
}

export type AdhocHintInput = {
  freeText?: string;
  durationMinutes?: number;
  muscleGroups?: string[];
  availableEquipment?: string[];
  intensityHint?: string;
};

export async function getAiRecommendation(
  hint?: AdhocHintInput,
): Promise<AdhocAiRecommendationOutput> {
  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (!accessToken || !userId) {
    throw new Error("Please log in to use AI Coach recommendations.");
  }

  const transport = createServerTransport(accessToken);
  const coachingClient = createClient(CoachingService, transport);

  const protoHint = hint
    ? create(AdHocHintSchema, {
        freeText: hint.freeText || "",
        durationMinutes: hint.durationMinutes || 0,
        muscleGroups: hint.muscleGroups || [],
        availableEquipment: hint.availableEquipment || [],
        intensityHint: hint.intensityHint || "",
      })
    : undefined;

  const res = await coachingClient.suggestAdHocSession({
    userId,
    hint: protoHint,
  });

  const mainEx = res.prescription?.mainExercises || [];
  const warmUps = res.prescription?.warmUps || [];
  const coolDowns = res.prescription?.coolDowns || [];

  return {
    muscleGroups: res.muscleGroups || [],
    reasoning: res.reasoning || "AI Coach tailored this workout based on your goals.",
    estimatedRpe: res.estimatedRpe || 7.0,
    exercises: mainEx.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets || 3,
      targetReps: ex.targetReps || 10,
      targetWeight: ex.targetWeight > 0 ? ex.targetWeight : undefined,
      durationSeconds: ex.durationSeconds || 0,
      notes: ex.notes || "",
      restSetSec: ex.restSetSec || 90,
      restExerciseSec: ex.restExerciseSec || 120,
    })),
    warmUps: warmUps.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets || 2,
      targetReps: ex.targetReps || 15,
      notes: ex.notes || "Warm-up",
      restSetSec: ex.restSetSec || 45,
    })),
    coolDowns: coolDowns.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets || 2,
      targetReps: ex.targetReps || 12,
      notes: ex.notes || "Cool-down",
      restSetSec: ex.restSetSec || 30,
    })),
  };
}

/**
 * Start an ad-hoc session built from selected exercise IDs.
 */
export async function beginWorkoutSession(exerciseIds: string[]): Promise<{ sessionId: string }> {
  if (!exerciseIds || exerciseIds.length === 0) {
    throw new Error("Cannot begin session without at least one exercise.");
  }

  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (!accessToken || !userId) {
    throw new Error("Please log in to start a workout session.");
  }

  const transport = createServerTransport(accessToken);
  const coachingClient = createClient(CoachingService, transport);

  const adhocPlan = await coachingClient.createAdhocSessionPlan({
    userId,
    exerciseIds,
  });

  const planId = adhocPlan.sessionPlan?.sessionPlanId;
  if (!planId) {
    throw new Error("Failed to create adhoc session plan on server.");
  }

  return { sessionId: planId };
}

export async function logWorkoutSet(
  sessionId: string,
  set: SetLogDraft,
): Promise<{ setLogId: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Unauthenticated");
  }

  const transport = createServerTransport(accessToken);
  const executionClient = createClient(WorkoutExecutionService, transport);

  const res = await executionClient.logWorkoutSet({
    sessionId,
    setNumber: set.setNumber,
    exerciseId: set.exerciseId,
    targetReps: set.targetReps,
    actualReps: set.actualReps,
    weight: set.weightKg,
    formScore: set.formScore ?? undefined,
    rpe: set.rpe ?? 0,
    cameraAngle: set.cameraAngle || "front",
    reps: (set.reps || []).map((r) => ({
      errorCodes: r.errorCodes || [],
      jointAngles: r.jointAngles || {},
      repNumber: r.repNumber,
      romPercentage: r.romPercentage,
    })),
  });

  return { setLogId: res.setLogId };
}

export interface SyncErrorItem {
  errorCode: string;
  severity: string;
  timestamp?: string;
  setNumber?: number;
  repNumber?: number;
  exerciseId?: string;
}

/**
 * Flush real-time posture errors up to backend.
 */
export async function syncWorkoutLogs(
  sessionId: string,
  errors: SyncErrorItem[] = [],
): Promise<{ success: boolean }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: true };
  }

  const transport = createServerTransport(accessToken);
  const executionClient = createClient(WorkoutExecutionService, transport);

  try {
    const errorLogs = errors.map((e) => {
      const date = e.timestamp ? new Date(e.timestamp) : new Date();
      return {
        errorCode: e.errorCode,
        exerciseId: e.exerciseId ?? "",
        repNumber: e.repNumber ?? 0,
        setNumber: e.setNumber ?? 1,
        severity: e.severity,
        timestamp: {
          nanos: (date.getTime() % 1000) * 1000000,
          seconds: BigInt(Math.floor(date.getTime() / 1000)),
        },
      };
    });

    await executionClient.syncWorkoutLogs({
      errors: errorLogs,
      sessionId,
    });
    return { success: true };
  } catch (error) {
    console.warn("[syncWorkoutLogs] gRPC call failed:", error);
    return { success: false };
  }
}

/**
 * Stop a session early.
 */
export async function abortWorkoutSession(
  sessionId: string,
  reason: AbortReason,
  note?: string,
): Promise<{ abortedAt: number }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { abortedAt: Date.now() };
  }

  const transport = createServerTransport(accessToken);
  const executionClient = createClient(WorkoutExecutionService, transport);

  const res = await executionClient.abortWorkoutSession({
    sessionId,
    reason: `${reason}${note ? `: ${note}` : ""}`,
  });

  return {
    abortedAt: res.abortedAt ? Number(res.abortedAt.seconds) * 1000 : Date.now(),
  };
}

export interface CompleteSessionResult {
  sessionId: string;
  totalSets: number;
  totalVolumeKg: number;
  averageRpe: number | null;
  averageFormScore: number | null;
  oneRepMaxByExercise: Record<string, number>;
}

/**
 * Close the session and get totals.
 */
export async function completeWorkoutSession(
  sessionId: string,
  sets: SetLogDraft[],
  confirmOverload: boolean,
): Promise<CompleteSessionResult> {
  const accessToken = await getAccessToken();

  const localTotals: CompleteSessionResult = {
    sessionId,
    totalSets: sets.length,
    totalVolumeKg: sessionVolumeKg(sets),
    averageRpe: averageRpe(sets),
    averageFormScore: averageFormScore(sets),
    oneRepMaxByExercise: bestOneRepMaxByExercise(sets),
  };

  if (!accessToken) {
    return localTotals;
  }

  // Ensure all sets (Set 1, Set 2, Set 3, etc.) are logged and saved to DB before completing
  for (const set of sets) {
    try {
      await logWorkoutSet(sessionId, set);
    } catch (err) {
      console.warn(`[completeWorkoutSession] Logging set ${set.setNumber} before completion:`, err);
    }
  }

  try {
    const transport = createServerTransport(accessToken);
    const executionClient = createClient(WorkoutExecutionService, transport);

    const res = await executionClient.completeWorkoutSession({
      sessionId,
      confirmOverload,
      weightUpdateKg: localTotals.totalVolumeKg,
    });

    return {
      sessionId: res.sessionId,
      totalSets: res.totalSets || localTotals.totalSets,
      totalVolumeKg: res.totalVolume || localTotals.totalVolumeKg,
      averageRpe: res.averageRpe ?? localTotals.averageRpe,
      averageFormScore: res.averageFormScore ?? localTotals.averageFormScore,
      oneRepMaxByExercise: localTotals.oneRepMaxByExercise,
    };
  } catch (error) {
    console.warn("completeWorkoutSession RPC failed or session already finished, using local totals:", error);
    return localTotals;
  }
}

/**
 * Stored personal records.
 */
export async function getPersonalRecords(exerciseIds: string[]): Promise<Record<string, number>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {};
  }

  const transport = createServerTransport(accessToken);
  const executionClient = createClient(WorkoutExecutionService, transport);

  const res = await executionClient.getPersonalRecords({ exerciseIds });
  const recordMap: Record<string, number> = {};
  for (const pr of res.records) {
    recordMap[pr.exerciseId] = pr.oneRepMax;
  }
  return recordMap;
}
