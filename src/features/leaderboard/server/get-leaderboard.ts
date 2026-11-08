import { createClient } from "@connectrpc/connect";
import "server-only";

import { GamificationService } from "@/shared/api/gen/contracts/supporting/gamification/v1/service/gamification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import { mapLeaderboardResponse } from "../model/leaderboard.mapper";
import type { LeaderboardDataVM } from "../model/leaderboard.types";

export async function getLeaderboardData(limit: number = 50): Promise<LeaderboardDataVM> {
  const [accessToken, currentUserId] = await Promise.all([
    getAccessToken(),
    getAuthenticatedUserId(),
  ]);

  const defaultData: LeaderboardDataVM = {
    topEntries: [],
    podium: [],
    rankedList: [],
    myStanding: null,
    totalParticipants: 0,
  };

  if (!process.env.FITAI_RPC_URL) {
    return defaultData;
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(GamificationService, transport);

    const response = await client.getGlobalLeaderboard({ limit });
    return mapLeaderboardResponse(response, currentUserId);
  } catch (error) {
    console.warn("[getLeaderboardData] failed to fetch leaderboard:", error);
    return defaultData;
  }
}
