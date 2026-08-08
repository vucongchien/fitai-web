import "server-only";

import { createClient } from "@connectrpc/connect";

import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { adaptRoadmapPageData } from "../model/roadmap-page.mapper";

const EMPTY_ROADMAP_DATA: RoadmapPageData = {
  activeWeek: 1,
  weeks: [],
  currentWeekSessions: [],
  currentWeekLabel: "No schedule available",
  currentWeekDateRange: "",
  contextItems: [],
};

async function getRealRoadmapPageData(accessToken: string, userId: string): Promise<RoadmapPageData> {
  const client = createClient(CoachingService, createServerTransport(accessToken));
  const res = await client.getActiveRoadmap({ userId });
  if (!res.roadmap) {
    return {
      ...EMPTY_ROADMAP_DATA,
      error: {
        type: "NO_ROADMAP",
        message: "Active roadmap not found.",
      },
    };
  }
  return adaptRoadmapPageData(res.roadmap);
}

/**
 * Fetches all data for the Roadmap page.
 *
 * Calls: CoachingService.getActiveRoadmap({ userId }) → weeks, sessions, context
 */
export async function getRoadmapPageData(): Promise<RoadmapPageData> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealRoadmapPageData(accessToken, userId || "");
    } catch (error) {
      console.warn("[getRoadmapPageData] gRPC error:", error);
      return {
        ...EMPTY_ROADMAP_DATA,
        error: {
          type: "CONNECTION_ERROR",
          message: error instanceof Error ? error.message : "Connection reset",
        },
      };
    }
  }

  return {
    ...EMPTY_ROADMAP_DATA,
    error: {
      type: "CONNECTION_ERROR",
      message: "gRPC backend address not configured.",
    },
  };
}
