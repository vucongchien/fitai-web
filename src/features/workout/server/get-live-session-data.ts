import "server-only";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";

import { getMockLiveSession } from "./get-mock-live-session";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
//
// async function getRealLiveSession(sessionId: string): Promise<LiveSessionPlan> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const transport = createServerTransport(token);
//
//   const coaching = createClient(CoachingService, transport);
//   const exercises = createClient(ExerciseService, transport);
//   const execution = createClient(WorkoutExecutionService, transport);
//
//   // 1. Prescription: warm_ups / main_exercises / cool_downs (FR-AC-07).
//   const session = await coaching.getSessionPlan({ userId: "TODO", sessionPlanId: sessionId });
//   const prescription = session.prescription;
//
//   // 2. Exercise library data for guidance: instructions, video_url, has_ai_supported.
//   const ids = [...prescription.warmUps, ...prescription.mainExercises, ...prescription.coolDowns]
//     .map((item) => item.exerciseId);
//   const infos = await Promise.all(ids.map((id) => exercises.getExercise({ id })));
//
//   // 3. Motion specification per AI-supported exercise (ONNX URLs on S3, rules,
//   //    dialogue engine config). Only for has_ai_supported exercises.
//   const aiIds = infos.filter((res) => res.exercise?.hasAiSupported).map((res) => res.exercise!.id);
//   const specs = await Promise.all(
//     aiIds.map((id) => execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" })),
//   );
//   // localRulesUrl / dialogueEngineUrl are fetched client-side by the motion engine.
//
//   // 4. Baselines: BR-WL-02 needs the mean volume of the last 5 sessions,
//   //    FR-WL-04 needs the current personal records.
//   const [history, records] = await Promise.all([
//     execution.getWorkoutHistory({ limit: 5, offset: 0 }),
//     execution.getPersonalRecords({ exerciseIds: ids }),
//   ]);
//
//   return adaptLiveSessionPlan({ sessionId, session, infos, specs, history, records });
// }
// ---------------------------------------------------------------------------

/**
 * Everything the live workout screen needs, in one payload.
 *
 * Calls (see the adapter above):
 *   - CoachingService.getSessionPlan            → warm-up / main / cooldown prescription
 *   - ExerciseService.getExercise               → instructions, video, hasAiSupported
 *   - WorkoutExecutionService.getMotionSpecification → ONNX model URLs + form rules
 *   - WorkoutExecutionService.getWorkoutHistory  → recentAvgVolumeKg (BR-WL-02)
 *   - WorkoutExecutionService.getPersonalRecords → PR baseline (FR-WL-04)
 */
export async function getLiveSessionData(sessionId: string): Promise<LiveSessionPlan> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockLiveSession(sessionId);
  // TODO: return getRealLiveSession(sessionId);
  return getMockLiveSession(sessionId);
}
