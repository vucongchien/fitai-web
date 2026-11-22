import "server-only";
import { Code, ConnectError, createClient } from "@connectrpc/connect";

import { getCatalogMetadataServerAction } from "@/features/exercise/server/catalog-actions";
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

async function getRealRoadmapPageData(
  accessToken: string,
  _userId?: string,
): Promise<RoadmapPageData> {
  const client = createClient(CoachingService, createServerTransport(accessToken));
  try {
    const [res, catalog] = await Promise.all([
      client.getActiveRoadmap({}),
      getCatalogMetadataServerAction().catch(() => ({ muscles: [], equipment: [] })),
    ]);
    if (!res.roadmap) {
      return {
        ...EMPTY_ROADMAP_DATA,
        error: {
          type: "NO_ROADMAP",
          message: "Active roadmap not found.",
        },
      };
    }
    const muscleLookup = new Map(catalog.muscles.map((m) => [m.id.toLowerCase(), m.name]));
    return adaptRoadmapPageData(res.roadmap, muscleLookup);
  } catch (error) {
    if (error instanceof ConnectError && error.code === Code.NotFound) {
      return {
        ...EMPTY_ROADMAP_DATA,
        error: {
          type: "NO_ROADMAP",
          message: "Active roadmap not found.",
        },
      };
    }
    throw error;
  }
}

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
