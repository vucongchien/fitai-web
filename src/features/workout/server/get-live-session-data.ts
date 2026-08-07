import "server-only";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";

import { getMockLiveSession } from "./get-mock-live-session";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
//
// Async function getRealLiveSession(sessionId: string): Promise<LiveSessionPlan> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const transport = createServerTransport(token);
//
//   Const coaching = createClient(CoachingService, transport);
//   Const exercises = createClient(ExerciseService, transport);
//   Const execution = createClient(WorkoutExecutionService, transport);
//
//   // 1. Prescription: warm_ups / main_exercises / cool_downs (FR-AC-07).
//   Const session = await coaching.getSessionPlan({ userId: "TODO", sessionPlanId: sessionId });
//   Const prescription = session.prescription;
//
//   // 2. Exercise library data for guidance: instructions, video_url, has_ai_supported.
//   Const ids = [...prescription.warmUps, ...prescription.mainExercises, ...prescription.coolDowns]
//     .map((item) => item.exerciseId);
//   Const infos = await Promise.all(ids.map((id) => exercises.getExercise({ id })));
//
//   // 3. Motion specification per AI-supported exercise (ONNX URLs on S3, rules,
//   //    dialogue engine config). Only for has_ai_supported exercises.
//   Const aiIds = infos.filter((res) => res.exercise?.hasAiSupported).map((res) => res.exercise!.id);
//   Const specs = await Promise.all(
//     AiIds.map((id) => execution.getMotionSpecification({ exerciseId: id, coachPersonality: "friendly" })),
//   );
//   // localRulesUrl / dialogueEngineUrl are fetched client-side by the motion engine.
//
//   // 4. Baselines: BR-WL-02 needs the mean volume of the last 5 sessions,
//   //    FR-WL-04 needs the current personal records.
//   Const [history, records] = await Promise.all([
//     Execution.getWorkoutHistory({ limit: 5, offset: 0 }),
//     Execution.getPersonalRecords({ exerciseIds: ids }),
//   ]);
//
//   Return adaptLiveSessionPlan({ sessionId, session, infos, specs, history, records });
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
  if (!hasBackend) {return getMockLiveSession(sessionId);}
  // TODO: return getRealLiveSession(sessionId);
  return getMockLiveSession(sessionId);
}
