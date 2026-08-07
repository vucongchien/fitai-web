"use server";

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

import {
  getMockAdhocConfig,
  getMockAiRecommendation,
  mockSearchExercises,
} from "./get-mock-workout-data";

// ---------------------------------------------------------------------------
// Real gRPC adapters (uncomment khi backend sẵn sàng)
// ---------------------------------------------------------------------------

// Async function realSearchExercises(query: string): Promise<ExerciseResult[]> {
//   Const [searchRes, metaRes] = await Promise.all([
//     CreateClient(ExerciseService, createServerTransport()).searchExercises({ keyword: query, limit: 20 }),
//     CreateClient(ExerciseService, createServerTransport()).getCatalogMetadata({}),
//   ]);
//   Const equipmentMap = new Map(metaRes.equipments.map((e) => [e.id, e]));
//   Return searchRes.exercises.map((ex) => {
//     Const equipment = equipmentMap.get(ex.equipmentId);
//     Const isWeighted = equipment ? equipment.name.toLowerCase() !== "bodyweight" : false;
//     Return {
//       Id: ex.id,
//       Name: ex.name,
//       EquipmentId: ex.equipmentId,
//       IsWeighted,
//       DefaultWeightKg: isWeighted ? 10 : undefined,
//       Prescription: "3 × 10",
//       Rest: `${ex.defaultRestSeconds} sec`,
//       Note: ex.instructions,
//     };
//   });
// }

// Async function realGetAdhocConfig(): Promise<AdhocConfig> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const client = createClient(CoachingService, createServerTransport(token));
//   Const res = await client.getActiveRoadmap({ userId: "TODO" });
//   Return { targetRpe: res.roadmap?.weekPlans[0]?.targetRpe ?? 6.5, defaultExercises: [] };
// }

// ---------------------------------------------------------------------------
// Public Server Actions
// ---------------------------------------------------------------------------

/**
 * Search exercise library.
 * gRPC: ExerciseService.searchExercises({ keyword: query, limit: 20 })
 */
export async function searchExercises(query: string): Promise<ExerciseResult[]> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return mockSearchExercises(query);}
  // TODO: return realSearchExercises(query);
  return mockSearchExercises(query);
}

/**
 * Fetch config and default exercises for the Adhoc Workout builder.
 * gRPC: CoachingService.getActiveRoadmap → weekPlan.targetRpe
 */
export async function getAdhocConfig(): Promise<AdhocConfig> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return getMockAdhocConfig();}
  // TODO: return realGetAdhocConfig();
  return getMockAdhocConfig();
}

/**
 * AI-generated workout recommendation.
 * gRPC: AI/coaching service — not yet available.
 */
export async function getAiRecommendation(): Promise<AiRecommendResult> {
  return getMockAiRecommendation();
}

/**
 * Create an adhoc session plan and start it immediately.
 *
 * Real flow:
 *   1. CoachingService.createAdhocSessionPlan({ exercise_ids }) → session_plan_id
 *   2. WorkoutExecutionService.startWorkoutSession({ session_plan_id }) → session_id
 */
export async function beginWorkoutSession(_exerciseIds: string[]): Promise<{ sessionId: string }> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return { sessionId: `adhoc_${Date.now()}` };}
  // TODO: implement real flow
  return { sessionId: `adhoc_${Date.now()}` };
}

// ---------------------------------------------------------------------------
// Live session — UC-03 Workout Execution
// ---------------------------------------------------------------------------

/**
 * Persist one confirmed set.
 * gRPC: WorkoutExecutionService.logWorkoutSet({ sessionId, setNumber, exerciseId,
 *       targetReps, actualReps, weight, formScore, rpe, reps, cameraAngle })
 *
 * formScore stays undefined for manual sets — BR-WL-03 records N/A rather than a
 * made-up number.
 */
export async function logWorkoutSet(
  sessionId: string,
  set: SetLogDraft,
): Promise<{ setLogId: string }> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return { setLogId: `set_${sessionId}_${set.exerciseId}_${set.setNumber}` };}
  // TODO: return createClient(WorkoutExecutionService, ...).logWorkoutSet({ ... });
  return { setLogId: `set_${sessionId}_${set.exerciseId}_${set.setNumber}` };
}

/**
 * Flush sets that were logged while offline.
 * gRPC: WorkoutExecutionService.syncWorkoutLogs({ sessionId, errors })
 */
export async function syncWorkoutLogs(
  sessionId: string,
  sets: SetLogDraft[],
): Promise<{ syncedSetNumbers: number[] }> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return { syncedSetNumbers: sets.map((set) => set.setNumber) };}
  // TODO: log each pending set, then syncWorkoutLogs for the error stream.
  void sessionId;
  return { syncedSetNumbers: sets.map((set) => set.setNumber) };
}

/**
 * Stop a session early — pain, out of time, or simply uncomfortable
 * (ux-flow-spec §5.6). The session is dropped, not saved as a partial win.
 *
 * gRPC: WorkoutExecutionService.abortWorkoutSession({ sessionId, reason })
 */
export async function abortWorkoutSession(
  sessionId: string,
  reason: AbortReason,
  /** The user's own words about what happened. Optional by design — someone in
   *  pain must never be blocked on typing an explanation. */
  note?: string,
): Promise<{ abortedAt: number }> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  void reason;
  void note;
  if (!hasBackend) {return { abortedAt: Date.now() };}
  // TODO: return createClient(WorkoutExecutionService, ...).abortWorkoutSession({ sessionId, reason, note });
  void sessionId;
  return { abortedAt: Date.now() };
}

export interface CompleteSessionResult {
  sessionId: string;
  totalSets: number;
  totalVolumeKg: number;
  averageRpe: number | null;
  averageFormScore: number | null;
  /** Estimated 1RM per exercise for this session — compared against stored PRs. */
  oneRepMaxByExercise: Record<string, number>;
}

/**
 * Close the session and get its totals.
 *
 * `confirmOverload` carries the user's answer to the BR-WL-02 confirmation dialog
 * (load above 250% of the recent average).
 *
 * gRPC: WorkoutExecutionService.completeWorkoutSession({ sessionId, confirmOverload })
 */
export async function completeWorkoutSession(
  sessionId: string,
  sets: SetLogDraft[],
  confirmOverload: boolean,
): Promise<CompleteSessionResult> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  void confirmOverload;

  const totals: CompleteSessionResult = {
    sessionId,
    totalSets: sets.length,
    totalVolumeKg: sessionVolumeKg(sets),
    averageRpe: averageRpe(sets),
    averageFormScore: averageFormScore(sets),
    oneRepMaxByExercise: bestOneRepMaxByExercise(sets),
  };

  if (!hasBackend) {return totals;}
  // TODO: use the server response instead of the locally computed totals.
  return totals;
}

/**
 * Stored personal records, used to decide whether today earned a PR celebration.
 * gRPC: WorkoutExecutionService.getPersonalRecords({ exerciseIds })
 */
export async function getPersonalRecords(exerciseIds: string[]): Promise<Record<string, number>> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return {};}
  // TODO: map records[] → { [exerciseId]: oneRepMax }
  void exerciseIds;
  return {};
}
