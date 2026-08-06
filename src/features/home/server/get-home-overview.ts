import "server-only";
import { adaptHomeOverview } from "@/features/home/model/home-overview.mapper";
import type { HomeOverview } from "@/features/home/model/home-overview.types";
import {
  getMockMealRows,
  getMockNutritionSummary,
  MOCK_TODAY,
} from "@/features/nutrition/server/get-mock-nutrition-data";
import { getMockWorkoutStatsData } from "@/features/workout-stats/server/get-mock-workout-stats";

/**
 * Fetches the Home overview card and metric grid.
 *
 * Calls:
 *   - NutritionService.getNutritionSummary → calories and protein against target
 *   - NutritionService.getNutritionHistory → meals logged, 7-day calorie trend
 *   - CoachingService.getActiveRoadmap + WorkoutExecutionService.getWorkoutHistory
 *     → workout completion, training volume, sets
 */
export async function getHomeOverview(): Promise<HomeOverview> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);

  if (!hasBackend) {
    return adaptHomeOverview(
      getMockNutritionSummary(),
      getMockMealRows(),
      getMockWorkoutStatsData(),
      MOCK_TODAY,
    );
  }

  // TODO: fetch the three services in parallel and pass the live payloads through
  // adaptHomeOverview, exactly as the mock branch above does.
  return adaptHomeOverview(
    getMockNutritionSummary(),
    getMockMealRows(),
    getMockWorkoutStatsData(),
    MOCK_TODAY,
  );
}
