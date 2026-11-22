import "server-only";
import { createClient } from "@connectrpc/connect";

import { getCatalogMetadataServerAction } from "@/features/exercise/server/catalog-actions";
import type { SchedulePageData } from "@/features/roadmap/model/roadmap-page.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { adaptSchedulePageData } from "../model/roadmap-page.mapper";

const EMPTY_SCHEDULE_DATA: SchedulePageData = {
  activeWeek: 1,
  weeks: [],
};

async function getRealSchedulePageData(
  accessToken: string,
  _userId: string,
): Promise<SchedulePageData> {
  const client = createClient(CoachingService, createServerTransport(accessToken));
  const [res, catalog] = await Promise.all([
    client.getActiveRoadmap({}),
    getCatalogMetadataServerAction().catch(() => ({ muscles: [], equipment: [] })),
  ]);
  if (!res.roadmap) {
    throw new Error("Active roadmap not found.");
  }
  const muscleLookup = new Map(catalog.muscles.map((m) => [m.id.toLowerCase(), m.name]));
  return adaptSchedulePageData(res.roadmap, muscleLookup);
}

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
