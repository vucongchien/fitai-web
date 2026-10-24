import { describe, expect, it } from "vitest";

import { mapComment, mapFeedItem, mapSocialSummary } from "@/features/social/model/social.mapper";

describe("social mapper", () => {
  describe("mapFeedItem", () => {
    it("maps a basic POST item", () => {
      const protoItem: any = {
        id: "feed-1",
        userId: "user-100",
        authorName: "Alice Gym",
        authorAvatarUrl: "https://example.com/avatar.jpg",
        itemType: "FEED_ITEM_TYPE_POST",
        caption: "Great leg day!",
        reactionCount: 5,
        commentCount: 2,
        userReaction: "LIKE",
        createdAt: { seconds: 1776500000n },
      };

      const result = mapFeedItem(protoItem);

      expect(result).toEqual({
        id: "feed-1",
        userId: "user-100",
        authorName: "Alice Gym",
        authorAvatarUrl: "https://example.com/avatar.jpg",
        itemType: "POST",
        caption: "Great leg day!",
        reactionCount: 5,
        commentCount: 2,
        userReaction: "LIKE",
        createdAt: new Date(1776500000 * 1000).toISOString(),
        workoutData: undefined,
      });
    });

    it("maps a WORKOUT_ACTIVITY item with workout metrics summary", () => {
      const protoItem: any = {
        id: "feed-2",
        userId: "user-200",
        authorName: "Bob Fit",
        authorAvatarUrl: "",
        itemType: "FEED_ITEM_TYPE_WORKOUT_ACTIVITY",
        caption: "Finished full body workout",
        reactionCount: 12,
        commentCount: 4,
        userReaction: "FIRE",
        createdAt: { seconds: 1776501000 },
        workoutData: {
          sessionId: "sess-99",
          workoutTitle: "Chest & Triceps Hypertrophy",
          durationSeconds: 2700,
          totalVolumeKg: 3500.5,
          exerciseCount: 5,
          totalSets: 16,
        },
      };

      const result = mapFeedItem(protoItem);

      expect(result.itemType).toBe("WORKOUT_ACTIVITY");
      expect(result.workoutData).toEqual({
        sessionId: "sess-99",
        workoutTitle: "Chest & Triceps Hypertrophy",
        durationSeconds: 2700,
        totalVolumeKg: 3500.5,
        exerciseCount: 5,
        totalSets: 16,
      });
    });
  });

  describe("mapSocialSummary", () => {
    it("converts social summary proto response into ViewModel with identity fields", () => {
      const protoRes: any = {
        userId: "user-xyz",
        followerCount: 42,
        followingCount: 15,
        postCount: 8,
        isFollowing: true,
        fullName: "Hoàng Nam",
        avatarUrl: "https://example.com/nam.jpg",
        role: "coach",
      };

      const result = mapSocialSummary(protoRes);

      expect(result).toEqual({
        userId: "user-xyz",
        followerCount: 42,
        followingCount: 15,
        postCount: 8,
        isFollowing: true,
        fullName: "Hoàng Nam",
        avatarUrl: "https://example.com/nam.jpg",
        role: "coach",
      });
    });

    it("falls back gracefully when optional identity fields are missing", () => {
      const protoRes: any = {
        userId: "user-empty",
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        isFollowing: false,
      };

      const result = mapSocialSummary(protoRes);

      expect(result).toEqual({
        userId: "user-empty",
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        isFollowing: false,
        fullName: "",
        avatarUrl: "",
        role: "user",
      });
    });
  });

  describe("mapComment", () => {
    it("converts comment proto into CommentVM", () => {
      const protoComment: any = {
        id: "cmt-1",
        userId: "user-300",
        authorName: "Charlie",
        authorAvatarUrl: "https://example.com/c.jpg",
        feedItemId: "feed-1",
        parentId: "cmt-0",
        content: "Awesome progress!",
        createdAt: { seconds: 1776502000n },
      };

      const result = mapComment(protoComment);

      expect(result).toEqual({
        id: "cmt-1",
        userId: "user-300",
        authorName: "Charlie",
        authorAvatarUrl: "https://example.com/c.jpg",
        feedItemId: "feed-1",
        parentId: "cmt-0",
        content: "Awesome progress!",
        createdAt: new Date(1776502000 * 1000).toISOString(),
      });
    });
  });
});
