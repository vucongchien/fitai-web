import "server-only";
import type { SessionPlanPageData } from "@/features/roadmap/model/roadmap-page.types";

import { getMockSessionPlanData } from "./get-mock-roadmap-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// Async function getRealSessionPlanData(sessionPlanId: string): Promise<SessionPlanPageData> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const transport = createServerTransport(token);
//   Const [sessionRes, injuryRes] = await Promise.all([
//     CreateClient(CoachingService, transport).getSessionPlan({ userId: "TODO", sessionPlanId }),
//     CreateClient(ProfileService, transport).getInjuryHistory({ userId: "TODO" }),
//   ]);
//   Return adaptSessionPlanPageData(sessionRes, injuryRes);
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
  if (!hasBackend) {return getMockSessionPlanData(sessionPlanId);}
  // TODO: return getRealSessionPlanData(sessionPlanId);
  return getMockSessionPlanData(sessionPlanId);
}
