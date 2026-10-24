import type {
  BadgeItem,
  GetStreakResponse,
  GetWalletResponse,
  StreakSummary,
  UserXpSummary,
} from "@/shared/api/gen/contracts/supporting/gamification/v1/message/gamification_messages_pb";
import type { UserSocialSummary } from "@/shared/api/gen/contracts/supporting/social/v1/message/social_messages_pb";

import type {
  BadgeItemVM,
  HomeGamificationVM,
  ProfileStatsVM,
  UserFriendVM,
} from "./gamification.types";

export function safeBigIntToNumber(value?: bigint | number | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  return Number(value);
}

export function protoTimestampToISO(ts?: { seconds?: bigint | number }): string | undefined {
  if (!ts?.seconds) {
    return undefined;
  }
  return new Date(Number(ts.seconds) * 1000).toISOString();
}

export function mapHomeGamification(
  streakRes?: GetStreakResponse | null,
  walletRes?: GetWalletResponse | null,
): HomeGamificationVM {
  return {
    streakDays: streakRes?.streakSummary?.currentStreak ?? 0,
    isActiveToday: streakRes?.streakSummary?.isActiveToday ?? false,
    coins: safeBigIntToNumber(walletRes?.balance),
  };
}

export function mapBadgeItem(
  item: BadgeItem,
  context?: {
    streakDays?: number;
    totalXp?: number;
    totalWorkouts?: number;
  },
): BadgeItemVM {
  const isUnlocked = item.isUnlocked ?? false;
  const match = item.badgeCode.match(/(\d+)/);
  const target = match ? parseInt(match[1], 10) : 10;

  let current = 0;
  if (isUnlocked) {
    current = target;
  } else if (context) {
    const cat = (item.category || "").toUpperCase();
    const code = (item.badgeCode || "").toUpperCase();
    if (cat.includes("STREAK") || code.includes("STREAK")) {
      current = Math.min(target, context.streakDays ?? 0);
    } else if (cat.includes("XP") || code.includes("XP") || cat.includes("LEVEL")) {
      current = Math.min(target, context.totalXp ?? 0);
    } else if (cat.includes("WORKOUT") || code.includes("WORKOUT")) {
      current = Math.min(target, context.totalWorkouts ?? 0);
    }
  }

  return {
    badgeCode: item.badgeCode || "BADGE",
    name: item.name || "Achievement",
    description: item.description || "",
    category: item.category || "GENERAL",
    iconUrl: item.iconUrl || "",
    isUnlocked,
    unlockedAt: protoTimestampToISO(item.unlockedAt as any),
    progressCurrent: current,
    progressTarget: target,
  };
}

export function mapUserSocialSummary(item: UserSocialSummary): UserFriendVM {
  return {
    userId: item.userId || "",
    fullName: item.fullName || "Athlete",
    avatarUrl: item.avatarUrl || "",
    isFollowing: item.isFollowing ?? false,
    level: 1,
    xp: 0,
  };
}

export function mapProfileStats(options: {
  streakSummary?: StreakSummary | null;
  xpSummary?: UserXpSummary | null;
  totalWorkouts: number;
  rank?: number | null;
}): ProfileStatsVM {
  return {
    streakDays: options.streakSummary?.currentStreak ?? 0,
    totalXp: safeBigIntToNumber(options.xpSummary?.xp),
    completedWorkouts: options.totalWorkouts ?? 0,
    leaderboardRank: options.rank ?? null,
  };
}
