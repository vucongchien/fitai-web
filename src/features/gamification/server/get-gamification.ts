import { createClient } from "@connectrpc/connect";
import "server-only";

import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { GamificationService } from "@/shared/api/gen/contracts/supporting/gamification/v1/service/gamification_service_pb";
import { SocialService } from "@/shared/api/gen/contracts/supporting/social/v1/service/social_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import {
  mapBadgeItem,
  mapHomeGamification,
  mapProfileStats,
  mapUserSocialSummary,
  safeBigIntToNumber,
} from "../model/gamification.mapper";
import type {
  HomeGamificationVM,
  ProfileGamificationOverviewVM,
} from "../model/gamification.types";

export async function getHomeGamificationData(): Promise<HomeGamificationVM> {
  const accessToken = await getAccessToken();

  if (!process.env.FITAI_RPC_URL || !accessToken) {
    return {
      streakDays: 0,
      isActiveToday: false,
      coins: 0,
    };
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(GamificationService, transport);

    const [streakResult, walletResult] = await Promise.allSettled([
      client.getStreak({}),
      client.getWallet({}),
    ]);

    const streakRes = streakResult.status === "fulfilled" ? streakResult.value : null;
    const walletRes = walletResult.status === "fulfilled" ? walletResult.value : null;

    return mapHomeGamification(streakRes, walletRes);
  } catch (error) {
    console.warn("[getHomeGamificationData] failed to load gamification data:", error);
    return {
      streakDays: 0,
      isActiveToday: false,
      coins: 0,
    };
  }
}

export async function getUserGamificationOverview(
  userId: string,
  isOwnProfile?: boolean,
): Promise<ProfileGamificationOverviewVM> {
  const [accessToken, currentUserId] = await Promise.all([
    getAccessToken(),
    getAuthenticatedUserId(),
  ]);

  const isOwner = isOwnProfile ?? (Boolean(currentUserId) && currentUserId === userId);

  const defaultOverview: ProfileGamificationOverviewVM = {
    stats: {
      streakDays: 0,
      totalXp: 0,
      completedWorkouts: 0,
      leaderboardRank: null,
    },
    badges: [],
    totalUnlockedBadges: 0,
    totalAvailableBadges: 0,
    followers: [],
    following: [],
    followerCount: 0,
    followingCount: 0,
  };

  if (!process.env.FITAI_RPC_URL || !accessToken) {
    return defaultOverview;
  }

  try {
    const transport = createServerTransport(accessToken);
    const gamificationClient = createClient(GamificationService, transport);
    const socialClient = createClient(SocialService, transport);
    const workoutClient = createClient(WorkoutExecutionService, transport);

    if (isOwner) {
      const [
        streakRes,
        xpRes,
        badgesRes,
        leaderboardRes,
        historyRes,
        followersRes,
        followingRes,
      ] = await Promise.allSettled([
        gamificationClient.getStreak({}),
        gamificationClient.getMyXp({}),
        gamificationClient.getMyBadges({}),
        gamificationClient.getGlobalLeaderboard({ limit: 50 }),
        workoutClient.getWorkoutHistory({ limit: 100, offset: 0 }),
        socialClient.getFollowers({ userId }),
        socialClient.getFollowing({ userId }),
      ]);

      const streakSummary =
        streakRes.status === "fulfilled" ? streakRes.value.streakSummary : null;
      const xpSummary = xpRes.status === "fulfilled" ? xpRes.value.xpSummary : null;
      const myStanding =
        leaderboardRes.status === "fulfilled" ? leaderboardRes.value.myStanding : null;
      const totalWorkouts =
        historyRes.status === "fulfilled" ? historyRes.value.sessions.length : 0;

      const rawBadges =
        badgesRes.status === "fulfilled" ? badgesRes.value.badges || [] : [];
      const badges = rawBadges.map((b) =>
        mapBadgeItem(b, {
          streakDays: streakSummary?.currentStreak,
          totalXp: safeBigIntToNumber(xpSummary?.xp),
          totalWorkouts,
        }),
      );
      const totalUnlockedBadges =
        badgesRes.status === "fulfilled"
          ? badgesRes.value.totalUnlocked
          : badges.filter((b) => b.isUnlocked).length;
      const totalAvailableBadges =
        badgesRes.status === "fulfilled" ? badgesRes.value.totalAvailable : badges.length;

      const rawFollowers =
        followersRes.status === "fulfilled" ? followersRes.value.followers || [] : [];
      const rawFollowing =
        followingRes.status === "fulfilled" ? followingRes.value.following || [] : [];

      const followers = rawFollowers.map(mapUserSocialSummary);
      const following = rawFollowing.map(mapUserSocialSummary);

      const stats = mapProfileStats({
        streakSummary,
        xpSummary,
        totalWorkouts,
        rank: myStanding?.rank || null,
      });

      return {
        stats,
        badges,
        totalUnlockedBadges,
        totalAvailableBadges,
        followers,
        following,
        followerCount:
          followersRes.status === "fulfilled" ? followersRes.value.totalCount : followers.length,
        followingCount:
          followingRes.status === "fulfilled" ? followingRes.value.totalCount : following.length,
      };
    }

    const [followersRes, followingRes, leaderboardRes] = await Promise.allSettled([
      socialClient.getFollowers({ userId }),
      socialClient.getFollowing({ userId }),
      gamificationClient.getGlobalLeaderboard({ limit: 50 }),
    ]);

    const rawFollowers =
      followersRes.status === "fulfilled" ? followersRes.value.followers || [] : [];
    const rawFollowing =
      followingRes.status === "fulfilled" ? followingRes.value.following || [] : [];

    const followers = rawFollowers.map(mapUserSocialSummary);
    const following = rawFollowing.map(mapUserSocialSummary);

    let rank: number | null = null;
    let peerXp = 0;
    if (leaderboardRes.status === "fulfilled" && leaderboardRes.value.topEntries) {
      const match = leaderboardRes.value.topEntries.find((e) => e.userId === userId);
      if (match) {
        rank = match.rank;
        peerXp = Number(match.xp ?? 0n);
      }
    }

    const stats = mapProfileStats({
      streakSummary: null,
      xpSummary: peerXp > 0 ? ({ xp: BigInt(peerXp), level: 1 } as any) : null,
      totalWorkouts: 0,
      rank,
    });

    return {
      stats,
      badges: [],
      totalUnlockedBadges: 0,
      totalAvailableBadges: 0,
      followers,
      following,
      followerCount:
        followersRes.status === "fulfilled" ? followersRes.value.totalCount : followers.length,
      followingCount:
        followingRes.status === "fulfilled" ? followingRes.value.totalCount : following.length,
    };
  } catch (error) {
    console.warn("[getUserGamificationOverview] error fetching gamification:", error);
    return defaultOverview;
  }
}
