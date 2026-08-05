import "server-only";

import type { HomePageData } from "@/features/home/model/home-page.types";

import { getMockHomePageData } from "./get-mock-home-page-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// async function getRealHomePageData(): Promise<HomePageData> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const transport = createServerTransport(token);
//
//   const [roadmapRes, nutritionRes] = await Promise.all([
//     createClient(CoachingService, transport).getActiveRoadmap({ userId: "TODO: from session" }),
//     createClient(NutritionService, transport).getNutritionSummary({ userId: "TODO: from session" }),
//   ]);
//
//   return adaptHomePageData(roadmapRes, nutritionRes);
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
  if (!hasBackend) return getMockHomePageData();
  // TODO: return getRealHomePageData();
  return getMockHomePageData();
}
