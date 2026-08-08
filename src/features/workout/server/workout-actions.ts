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
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";



/**
 * Search exercise library.
 * gRPC: ExerciseService.searchExercises
 */
export async function searchExercises(query: string): Promise<ExerciseResult[]> {
  const accessToken = await getAccessToken();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const exerciseClient = createClient(ExerciseService, transport);

      const [searchRes, metaRes] = await Promise.all([
        exerciseClient.searchExercises({ keyword: query, limit: 20 }),
        exerciseClient.getCatalogMetadata({}),
      ]);

      const equipmentMap = new Map(metaRes.equipments.map((e) => [e.id, e]));

      return searchRes.exercises.map((ex) => {
        const equipment = equipmentMap.get(ex.equipmentId);
        const isWeighted = equipment ? equipment.name.toLowerCase() !== "bodyweight" : false;
        return {
          id: ex.id,
          name: ex.name,
          equipmentId: ex.equipmentId,
          isWeighted,
          defaultWeightKg: isWeighted ? 10 : undefined, //hard code: fallback default weight of 10kg for weighted exercises
          prescription: "3 × 10", //hard code: default prescription format //need to migrate: fetch actual prescription from coaching plan database
          rest: `${ex.defaultRestSeconds || 90} sec`, //hard code: fallback rest duration
          note: ex.instructions,
        };
      });
    } catch (error) {
      console.warn("[searchExercises] gRPC fallback:", error);
    }
  }

  return [];
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
    targetRpe: 7.0, //hard code: fallback default RPE when gRPC is offline
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
          rest: `${ex.restSetSec || 90} sec`, //hard code: fallback rest duration if not specified
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

  return { sessionId: `adhoc_${Date.now()}` }; //hard code: offline fallback session ID generation
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

  return { setLogId: `set_${sessionId}_${set.exerciseId}_${set.setNumber}` }; //hard code: offline fallback set ID generation
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

  return { abortedAt: Date.now() }; //hard code: offline fallback timestamp
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
