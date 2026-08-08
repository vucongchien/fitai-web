import "server-only";

import { createClient } from "@connectrpc/connect";

import type { SessionPlanPageData } from "@/features/roadmap/model/roadmap-page.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { adaptSessionPlanPageData } from "../model/roadmap-page.mapper";

const getEmptySessionPlanData = (sessionPlanId: string): SessionPlanPageData => ({
  sessionPlanId,
  title: "Workout Session",
  day: "Mon",
  date: "",
  duration: 45,
  targetRpe: 7,
  sessionDescription: "No details available.",
  exercises: [],
  readinessNote: {
    variant: "safe",
    title: "Ready to train",
    description: "No active injury constraints recorded.",
  },
  featureNotes: [],
  preSessionChecks: [],
  startWorkoutHref: `/workouts/live/${sessionPlanId}`,
});

async function getRealSessionPlanData(
  sessionPlanId: string,
  accessToken: string,
  userId: string,
): Promise<SessionPlanPageData> {
  const transport = createServerTransport(accessToken);
  const coachingClient = createClient(CoachingService, transport);
  const profileClient = createClient(ProfileService, transport);

  const [sessionRes, injuryRes] = await Promise.all([
    coachingClient.getSessionPlan({ userId, sessionPlanId }),
    profileClient.getInjuryHistory({ userId }),
  ]);

  if (!sessionRes.sessionPlan) {
    throw new Error("Session plan not found.");
  }

  return adaptSessionPlanPageData(sessionRes.sessionPlan, injuryRes);
}

/**
 * Fetches all data for the Session Plan preparation page.
 *
 * Calls:
 *   - CoachingService.getSessionPlan({ userId, sessionPlanId }) → exercises, reasoning
 *   - ProfileService.getInjuryHistory({ userId }) → readinessNote
 */
export async function getSessionPlanPageData(sessionPlanId: string): Promise<SessionPlanPageData> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealSessionPlanData(sessionPlanId, accessToken, userId || "");
    } catch (error) {
      console.warn("[getSessionPlanPageData] gRPC error:", error);
    }
  }

  return getEmptySessionPlanData(sessionPlanId);
}
