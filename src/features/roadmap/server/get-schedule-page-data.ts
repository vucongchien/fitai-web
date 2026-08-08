import "server-only";

import { createClient } from "@connectrpc/connect";

import type { SchedulePageData } from "@/features/roadmap/model/roadmap-page.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { adaptSchedulePageData } from "../model/roadmap-page.mapper";

const EMPTY_SCHEDULE_DATA: SchedulePageData = {
  activeWeek: 1,
  weeks: [],
};

async function getRealSchedulePageData(accessToken: string, userId: string): Promise<SchedulePageData> {
  const client = createClient(CoachingService, createServerTransport(accessToken));
  const res = await client.getActiveRoadmap({ userId });
  if (!res.roadmap) {
    throw new Error("Active roadmap not found.");
  }
  return adaptSchedulePageData(res.roadmap);
}

/**
 * Fetches the full four-week schedule.
 *
 * Calls: CoachingService.getActiveRoadmap({ userId }) → every week, day and session plan.
 * `GetActiveRoadmapResponse.roadmap` already carries all four weeks, so the real adapter
 * walks `week_plans → day_plans → session_plans` rather than fetching per week.
 */
export async function getSchedulePageData(): Promise<SchedulePageData> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealSchedulePageData(accessToken, userId || "");
    } catch (error) {
      console.warn("[getSchedulePageData] gRPC error:", error);
    }
  }

  return EMPTY_SCHEDULE_DATA;
}
