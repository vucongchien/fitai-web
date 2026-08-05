import "server-only";
import type { SessionPlanPageData } from "@/features/roadmap/model/roadmap-page.types";

import { getMockSessionPlanData } from "./get-mock-roadmap-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// async function getRealSessionPlanData(sessionPlanId: string): Promise<SessionPlanPageData> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const transport = createServerTransport(token);
//   const [sessionRes, injuryRes] = await Promise.all([
//     createClient(CoachingService, transport).getSessionPlan({ userId: "TODO", sessionPlanId }),
//     createClient(ProfileService, transport).getInjuryHistory({ userId: "TODO" }),
//   ]);
//   return adaptSessionPlanPageData(sessionRes, injuryRes);
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data for the Session Plan preparation page.
 *
 * Calls:
 *   - CoachingService.getSessionPlan({ userId, sessionPlanId }) → exercises, reasoning
 *   - ProfileService.getInjuryHistory({ userId }) → readinessNote
 */
export async function getSessionPlanPageData(sessionPlanId: string): Promise<SessionPlanPageData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockSessionPlanData(sessionPlanId);
  // TODO: return getRealSessionPlanData(sessionPlanId);
  return getMockSessionPlanData(sessionPlanId);
}
