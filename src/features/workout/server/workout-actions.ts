"use server";

import type { AdhocConfig, AiRecommendResult, ExerciseResult } from "@/features/workout/model/workout.types";

import { getMockAdhocConfig, getMockAiRecommendation, mockSearchExercises } from "./get-mock-workout-data";

// ---------------------------------------------------------------------------
// Real gRPC adapters (uncomment khi backend sẵn sàng)
// ---------------------------------------------------------------------------

// async function realSearchExercises(query: string): Promise<ExerciseResult[]> {
//   const [searchRes, metaRes] = await Promise.all([
//     createClient(ExerciseService, createServerTransport()).searchExercises({ keyword: query, limit: 20 }),
//     createClient(ExerciseService, createServerTransport()).getCatalogMetadata({}),
//   ]);
//   const equipmentMap = new Map(metaRes.equipments.map((e) => [e.id, e]));
//   return searchRes.exercises.map((ex) => {
//     const equipment = equipmentMap.get(ex.equipmentId);
//     const isWeighted = equipment ? equipment.name.toLowerCase() !== "bodyweight" : false;
//     return {
//       id: ex.id,
//       name: ex.name,
//       equipmentId: ex.equipmentId,
//       isWeighted,
//       defaultWeightKg: isWeighted ? 10 : undefined,
//       prescription: "3 × 10",
//       rest: `${ex.defaultRestSeconds} sec`,
//       note: ex.instructions,
//     };
//   });
// }

// async function realGetAdhocConfig(): Promise<AdhocConfig> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const client = createClient(CoachingService, createServerTransport(token));
//   const res = await client.getActiveRoadmap({ userId: "TODO" });
//   return { targetRpe: res.roadmap?.weekPlans[0]?.targetRpe ?? 6.5, defaultExercises: [] };
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
  if (!hasBackend) return mockSearchExercises(query);
  // TODO: return realSearchExercises(query);
  return mockSearchExercises(query);
}

/**
 * Fetch config and default exercises for the Adhoc Workout builder.
 * gRPC: CoachingService.getActiveRoadmap → weekPlan.targetRpe
 */
export async function getAdhocConfig(): Promise<AdhocConfig> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockAdhocConfig();
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
  if (!hasBackend) return { sessionId: `adhoc_${Date.now()}` };
  // TODO: implement real flow
  return { sessionId: `adhoc_${Date.now()}` };
}
