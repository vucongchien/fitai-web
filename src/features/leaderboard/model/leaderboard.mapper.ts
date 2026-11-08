import type {
  GetGlobalLeaderboardResponse,
  LeaderboardEntry,
} from "@/shared/api/gen/contracts/supporting/gamification/v1/message/gamification_messages_pb";

import type { LeaderboardDataVM, LeaderboardEntryVM } from "./leaderboard.types";

export function safeBigIntToNumber(value?: bigint | number | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, num) : 0;
}

export function mapLeaderboardEntry(
  entry: Partial<LeaderboardEntry>,
  currentUserId?: string | null,
): LeaderboardEntryVM {
  const userId = entry.userId || "";
  const isCurrentUser = Boolean(currentUserId && userId && currentUserId === userId);

  return {
    rank: entry.rank ?? 0,
    userId,
    displayName: entry.displayName?.trim() || "Athlete",
    avatarUrl: entry.avatarUrl || "",
    xp: safeBigIntToNumber(entry.xp),
    level: entry.level && entry.level > 0 ? entry.level : 1,
    isCurrentUser,
  };
}

export function mapLeaderboardResponse(
  response?: GetGlobalLeaderboardResponse | null,
  currentUserId?: string | null,
): LeaderboardDataVM {
  if (!response) {
    return {
      topEntries: [],
      podium: [],
      rankedList: [],
      myStanding: null,
      totalParticipants: 0,
    };
  }

  const rawEntries = response.topEntries || [];
  const topEntries: LeaderboardEntryVM[] = rawEntries
    .map((e) => mapLeaderboardEntry(e, currentUserId))
    .toSorted((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return b.xp - a.xp;
    });

  const podium = topEntries.slice(0, 3);
  const rankedList = topEntries.slice(3);

  let myStanding: LeaderboardEntryVM | null = null;
  if (response.myStanding && response.myStanding.rank > 0) {
    myStanding = mapLeaderboardEntry(response.myStanding, currentUserId);
    myStanding.isCurrentUser = true;
  } else if (currentUserId) {
    const foundInTop = topEntries.find((e) => e.userId === currentUserId);
    if (foundInTop) {
      myStanding = { ...foundInTop, isCurrentUser: true };
    }
  }

  return {
    topEntries,
    podium,
    rankedList,
    myStanding,
    totalParticipants: Math.max(topEntries.length, myStanding?.rank ?? topEntries.length),
  };
}
