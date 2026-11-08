import { describe, expect, it } from "vitest";

import {
  mapLeaderboardEntry,
  mapLeaderboardResponse,
  safeBigIntToNumber,
} from "@/features/leaderboard/model/leaderboard.mapper";

describe("leaderboard.mapper", () => {
  describe("safeBigIntToNumber", () => {
    it("converts bigint and number safely", () => {
      expect(safeBigIntToNumber(15400n)).toBe(15400);
      expect(safeBigIntToNumber(0n)).toBe(0);
      expect(safeBigIntToNumber(BigInt(999))).toBe(999);
      expect(safeBigIntToNumber(500)).toBe(500);
    });

    it("handles undefined and null gracefully", () => {
      expect(safeBigIntToNumber(undefined)).toBe(0);
      expect(safeBigIntToNumber(null)).toBe(0);
    });

    it("clamps negative numbers to 0", () => {
      expect(safeBigIntToNumber(-500)).toBe(0);
      expect(safeBigIntToNumber(-100n)).toBe(0);
    });
  });

  describe("mapLeaderboardEntry", () => {
    it("maps an entry with valid fields and flags current user", () => {
      const entry = {
        rank: 1,
        userId: "usr-1",
        displayName: "Minh Quang",
        avatarUrl: "https://example.com/avatar.jpg",
        xp: 15400n,
        level: 12,
      };

      const result = mapLeaderboardEntry(entry as any, "usr-1");
      expect(result).toEqual({
        rank: 1,
        userId: "usr-1",
        displayName: "Minh Quang",
        avatarUrl: "https://example.com/avatar.jpg",
        xp: 15400,
        level: 12,
        isCurrentUser: true,
      });
    });

    it("applies safe fallbacks for missing name and level", () => {
      const entry = {
        rank: 5,
        userId: "usr-anon",
        displayName: "   ",
        xp: 250n,
        level: 0,
      };

      const result = mapLeaderboardEntry(entry as any, "usr-other");
      expect(result).toEqual({
        rank: 5,
        userId: "usr-anon",
        displayName: "Athlete",
        avatarUrl: "",
        xp: 250,
        level: 1,
        isCurrentUser: false,
      });
    });
  });

  describe("mapLeaderboardResponse", () => {
    it("returns empty default structure when response is null or undefined", () => {
      const res = mapLeaderboardResponse(null, "usr-1");
      expect(res).toEqual({
        topEntries: [],
        podium: [],
        rankedList: [],
        myStanding: null,
        totalParticipants: 0,
      });
    });

    it("separates top 3 into podium and remaining into rankedList", () => {
      const mockResponse: any = {
        topEntries: [
          { rank: 3, userId: "u3", displayName: "Bronze Player", xp: 3000n, level: 5 },
          { rank: 1, userId: "u1", displayName: "Gold Player", xp: 10000n, level: 10 },
          { rank: 2, userId: "u2", displayName: "Silver Player", xp: 7500n, level: 8 },
          { rank: 4, userId: "u4", displayName: "Fourth Player", xp: 2000n, level: 3 },
          { rank: 5, userId: "u5", displayName: "Fifth Player", xp: 1000n, level: 2 },
        ],
        myStanding: {
          rank: 4,
          userId: "u4",
          displayName: "Fourth Player",
          xp: 2000n,
          level: 3,
        },
      };

      const result = mapLeaderboardResponse(mockResponse, "u4");

      // Sorted by rank
      expect(result.topEntries.map((e) => e.rank)).toEqual([1, 2, 3, 4, 5]);

      // Podium has exactly 3
      expect(result.podium.map((e) => e.displayName)).toEqual([
        "Gold Player",
        "Silver Player",
        "Bronze Player",
      ]);

      // Ranked list has remaining entries (rank 4 and 5)
      expect(result.rankedList.map((e) => e.rank)).toEqual([4, 5]);

      // User u4 is flagged as current user
      expect(result.rankedList[0].isCurrentUser).toBe(true);
      expect(result.myStanding).toBeDefined();
      expect(result.myStanding?.rank).toBe(4);
      expect(result.myStanding?.isCurrentUser).toBe(true);
    });

    it("breaks rank ties by higher XP descending", () => {
      const mockResponse: any = {
        topEntries: [
          { rank: 1, userId: "u-a", displayName: "Athlete A", xp: 12000n, level: 8 },
          { rank: 1, userId: "u-b", displayName: "Athlete B", xp: 15000n, level: 9 },
          { rank: 3, userId: "u-c", displayName: "Athlete C", xp: 9000n, level: 6 },
        ],
      };

      const result = mapLeaderboardResponse(mockResponse);
      expect(result.podium.map((e) => e.displayName)).toEqual([
        "Athlete B",
        "Athlete A",
        "Athlete C",
      ]);
      expect(result.podium[0].xp).toBe(15000);
      expect(result.podium[1].xp).toBe(12000);
    });

    it("handles partial podium when fewer than 3 entries exist", () => {
      const mockResponse: any = {
        topEntries: [{ rank: 1, userId: "u1", displayName: "Solo Athlete", xp: 5000n, level: 5 }],
      };

      const result = mapLeaderboardResponse(mockResponse);
      expect(result.podium).toHaveLength(1);
      expect(result.rankedList).toHaveLength(0);
      expect(result.podium[0].displayName).toBe("Solo Athlete");
    });

    it("handles user ranked outside top 50 via myStanding", () => {
      const mockResponse: any = {
        topEntries: [{ rank: 1, userId: "u1", displayName: "Top Gymer", xp: 9000n, level: 9 }],
        myStanding: {
          rank: 142,
          userId: "u-current",
          displayName: "Growing Athlete",
          xp: 450n,
          level: 2,
        },
      };

      const result = mapLeaderboardResponse(mockResponse, "u-current");
      expect(result.myStanding).toEqual({
        rank: 142,
        userId: "u-current",
        displayName: "Growing Athlete",
        avatarUrl: "",
        xp: 450,
        level: 2,
        isCurrentUser: true,
      });
      expect(result.totalParticipants).toBe(142);
    });
  });
});
