import "server-only";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";

import { getMockWorkoutStatsData } from "./get-mock-workout-stats";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// async function getRealWorkoutStatsData(): Promise<WorkoutStatsData> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const transport = createServerTransport(token);
//   const today = toDayKey(new Date());
//
//   const [roadmap, history, nutrition] = await Promise.all([
//     createClient(CoachingService, transport).getActiveRoadmap({ userId: "TODO: from session" }),
//     // GetWorkoutHistory paginates by limit/offset only — it has no date filter — so the
//     // window is applied client-side after over-fetching.
//     createClient(WorkoutExecutionService, transport).getWorkoutHistory({ limit: 60, offset: 0 }),
//     createClient(NutritionService, transport).getNutritionHistory({
//       endDate: today,
//       startDate: dayKeyRange(today, 7)[0],
//       userId: "TODO: from session",
//     }),
//   ]);
//
//   return adaptWorkoutStatsData(
//     flattenSessionPlans(roadmap.roadmap ?? {}),
//     history.sessions,
//     nutrition.meals,
//     today,
//   );
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches the stats shared by the Workout and Weekly Progress views.
 *
 * Calls:
 *   - CoachingService.getActiveRoadmap → session plans, statuses, scheduled dates
 *   - WorkoutExecutionService.getWorkoutHistory → volume and set totals
 *   - NutritionService.getNutritionHistory → meals logged, average protein
 *
 * One fetch serves all three ranges, so switching tabs costs no round trip.
 */
export async function getWorkoutStatsData(): Promise<WorkoutStatsData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockWorkoutStatsData();
  // TODO: return getRealWorkoutStatsData();
  return getMockWorkoutStatsData();
}
