import "server-only";
import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";

import { getMockRoadmapPageData } from "./get-mock-roadmap-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// Async function getRealRoadmapPageData(): Promise<RoadmapPageData> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const client = createClient(CoachingService, createServerTransport(token));
//   Const res = await client.getActiveRoadmap({ userId: "TODO: from session" });
//   Return adaptRoadmapPageData(res);
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data for the Roadmap page.
 *
 * Calls: CoachingService.getActiveRoadmap({ userId }) → weeks, sessions, context
 */
export async function getRoadmapPageData(): Promise<RoadmapPageData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {return getMockRoadmapPageData();}
  // TODO: return getRealRoadmapPageData();
  return getMockRoadmapPageData();
}
