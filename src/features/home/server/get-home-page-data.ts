import "server-only";
import type { HomePageData } from "@/features/home/model/home-page.types";

import { getMockHomePageData } from "./get-mock-home-page-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// Async function getRealHomePageData(): Promise<HomePageData> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const transport = createServerTransport(token);
//
//   Const [roadmapRes, nutritionRes] = await Promise.all([
//     CreateClient(CoachingService, transport).getActiveRoadmap({ userId: "TODO: from session" }),
//     CreateClient(NutritionService, transport).getNutritionSummary({ userId: "TODO: from session" }),
//   ]);
//
//   Return adaptHomePageData(roadmapRes, nutritionRes);
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data needed for the Home page.
 *
 * Calls:
 *   - CoachingService.getActiveRoadmap → streak, todayTimeline, evidenceItems, coachNote
 *   - NutritionService.getNutritionSummary → nutritionSummary
 */
export async function getHomePageData(): Promise<HomePageData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {
    return getMockHomePageData();
  }
  // TODO: return getRealHomePageData();
  return getMockHomePageData();
}
