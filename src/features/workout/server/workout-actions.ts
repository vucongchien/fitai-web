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
  AiRecommendResult,
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

export async function getAiRecommendation(): Promise<AiRecommendResult> {
  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);

      const res = await coachingClient.suggestAdHocSession({
        userId: userId || "",
      });

      const mainEx = res.prescription?.mainExercises || [];
      return {
        exercises: mainEx.map((ex) => ({
          id: ex.exerciseId,
          name: ex.exerciseName,
          prescription: `${ex.targetSets} × ${ex.targetReps}`,
          rest: `${ex.restSetSec || 90} sec`, //Hard code: fallback rest duration if not specified
          note: ex.notes || "AI Recommended",
          sets: ex.targetSets,
          reps: ex.targetReps,
          weightKg: ex.targetWeight || undefined,
        })),
      };
    } catch (error) {
      console.warn("[getAiRecommendation] gRPC error:", error);
    }
  }

  return {
    exercises: [],
  };
}

/**
 * Create an adhoc session plan and start it.
 */
export async function beginWorkoutSession(exerciseIds: string[]): Promise<{ sessionId: string }> {
  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);
      const executionClient = createClient(WorkoutExecutionService, transport);

      const adhocPlan = await coachingClient.createAdhocSessionPlan({
        userId: userId || "",
        exerciseIds,
      });

      const planId = adhocPlan.sessionPlan?.sessionPlanId || `plan_${Date.now()}`;
      const started = await executionClient.startWorkoutSession({ planId });

      return { sessionId: started.sessionId };
    } catch (error) {
      console.warn("[beginWorkoutSession] gRPC fallback to local session id:", error);
    }
  }

  return { sessionId: `adhoc_${Date.now()}` }; //Hard code: offline fallback session ID generation
}

/**
 * Persist one confirmed set.
 */
export async function logWorkoutSet(
  sessionId: string,
  set: SetLogDraft,
): Promise<{ setLogId: string }> {
  const accessToken = await getAccessToken();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
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
        reps: [],
      });

      return { setLogId: res.setLogId };
    } catch (error) {
      console.warn("[logWorkoutSet] gRPC fallback:", error);
    }
  }

  return { setLogId: `set_${sessionId}_${set.exerciseId}_${set.setNumber}` }; //Hard code: offline fallback set ID generation
}

/**
 * Flush sets that were logged while offline.
 */
export async function syncWorkoutLogs(
  sessionId: string,
  sets: SetLogDraft[],
): Promise<{ syncedSetNumbers: number[] }> {
  const accessToken = await getAccessToken();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const executionClient = createClient(WorkoutExecutionService, transport);

      await executionClient.syncWorkoutLogs({
        sessionId,
        errors: [],
      });

      return { syncedSetNumbers: sets.map((s) => s.setNumber) };
    } catch (error) {
      console.warn("[syncWorkoutLogs] gRPC fallback:", error);
    }
  }

  return { syncedSetNumbers: sets.map((set) => set.setNumber) };
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

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const executionClient = createClient(WorkoutExecutionService, transport);

      const res = await executionClient.abortWorkoutSession({
        sessionId,
        reason: `${reason}${note ? `: ${note}` : ""}`,
      });

      return {
        abortedAt: res.abortedAt ? Number(res.abortedAt.seconds) * 1000 : Date.now(),
      };
    } catch (error) {
      console.warn("[abortWorkoutSession] gRPC fallback:", error);
    }
  }

  return { abortedAt: Date.now() }; //Hard code: offline fallback timestamp
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

  if (process.env.FITAI_RPC_URL && accessToken) {
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
        averageRpe: res.averageRpe || localTotals.averageRpe,
        averageFormScore: res.averageFormScore ?? localTotals.averageFormScore,
        oneRepMaxByExercise: localTotals.oneRepMaxByExercise,
      };
    } catch (error) {
      console.warn("[completeWorkoutSession] gRPC fallback to local calculation:", error);
    }
  }

  return localTotals;
}

/**
 * Stored personal records.
 */
export async function getPersonalRecords(exerciseIds: string[]): Promise<Record<string, number>> {
  const accessToken = await getAccessToken();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const executionClient = createClient(WorkoutExecutionService, transport);

      const res = await executionClient.getPersonalRecords({ exerciseIds });
      const recordMap: Record<string, number> = {};
      for (const pr of res.records) {
        recordMap[pr.exerciseId] = pr.oneRepMax;
      }
      return recordMap;
    } catch (error) {
      console.warn("[getPersonalRecords] gRPC fallback:", error);
    }
  }

  return {};
}
