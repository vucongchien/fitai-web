import { describe, expect, it } from "vitest";

import {
  mapBadgeItem,
  mapHomeGamification,
  mapProfileStats,
  mapUserSocialSummary,
  safeBigIntToNumber,
} from "@/features/gamification/model/gamification.mapper";

describe("gamification.mapper", () => {
  describe("safeBigIntToNumber", () => {
    it("converts bigint to number accurately", () => {
      expect(safeBigIntToNumber(120n)).toBe(120);
      expect(safeBigIntToNumber(0n)).toBe(0);
      expect(safeBigIntToNumber(BigInt(4927))).toBe(4927);
    });

    it("handles undefined and null gracefully", () => {
      expect(safeBigIntToNumber(undefined)).toBe(0);
      expect(safeBigIntToNumber(null)).toBe(0);
    });
  });

  describe("mapHomeGamification", () => {
    it("maps streak and wallet responses with BigInt balance safely", () => {
      const mockStreak: any = {
        streakSummary: {
          currentStreak: 7,
          longestStreak: 14,
          isActiveToday: true,
          userId: "usr-1",
        },
      };
      const mockWallet: any = {
        balance: 120n,
        userId: "usr-1",
      };

      const result = mapHomeGamification(mockStreak, mockWallet);
      expect(result).toEqual({
        streakDays: 7,
        isActiveToday: true,
        coins: 120,
      });
      expect(typeof result.coins).toBe("number");
    });

    it("falls back to safe defaults when responses are empty or null", () => {
      const result = mapHomeGamification(null, null);
      expect(result).toEqual({
        streakDays: 0,
        isActiveToday: false,
        coins: 0,
      });
    });
  });

  describe("mapProfileStats", () => {
    it("maps 4 stats correctly with safe BigInt XP conversion", () => {
      const mockStreakSummary: any = { currentStreak: 7 };
      const mockXpSummary: any = { xp: 4927n, level: 12 };

      const stats = mapProfileStats({
        streakSummary: mockStreakSummary,
        xpSummary: mockXpSummary,
        totalWorkouts: 24,
        rank: 12,
      });

      expect(stats).toEqual({
        streakDays: 7,
        totalXp: 4927,
        completedWorkouts: 24,
        leaderboardRank: 12,
      });
      expect(typeof stats.totalXp).toBe("number");
    });

    it("handles unranked and empty summaries", () => {
      const stats = mapProfileStats({
        streakSummary: null,
        xpSummary: null,
        totalWorkouts: 0,
        rank: null,
      });

      expect(stats).toEqual({
        streakDays: 0,
        totalXp: 0,
        completedWorkouts: 0,
        leaderboardRank: null,
      });
    });
  });

  describe("mapBadgeItem", () => {
    it("maps badge item with progress and status", () => {
      const badge: any = {
        badgeCode: "STREAK_7",
        name: "Chiến Binh 7 Ngày",
        description: "Hoàn thành 7 ngày liên tiếp",
        category: "STREAK",
        iconUrl: "",
        isUnlocked: true,
      };

      const result = mapBadgeItem(badge);
      expect(result.name).toBe("Chiến Binh 7 Ngày");
      expect(result.isUnlocked).toBe(true);
      expect(result.progressCurrent).toBe(7);
      expect(result.progressTarget).toBe(7);
    });
  });

  describe("mapUserSocialSummary", () => {
    it("maps social summary to UserFriendVM", () => {
      const summary: any = {
        userId: "usr-2",
        fullName: "Lani",
        avatarUrl: "https://example.com/avatar.jpg",
        isFollowing: true,
      };

      const friend = mapUserSocialSummary(summary);
      expect(friend).toEqual({
        userId: "usr-2",
        fullName: "Lani",
        avatarUrl: "https://example.com/avatar.jpg",
        isFollowing: true,
        level: 1,
        xp: 0,
      });
    });
  });
});
