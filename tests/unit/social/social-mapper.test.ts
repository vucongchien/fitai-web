import { describe, expect, it } from "vitest";

import { mapComment, mapFeedItem, mapSocialSummary } from "@/features/social/model/social.mapper";

describe("social mapper", () => {
  describe("mapFeedItem", () => {
    it("maps a basic POST item", () => {
      const protoItem: any = {
        id: "post-1",
        userId: "user-100",
        authorName: "Alice",
        authorAvatarUrl: "https://example.com/alice.jpg",
        itemType: "FEED_ITEM_TYPE_POST",
        caption: "Hello world!",
        reactionCount: 5,
        commentCount: 2,
        userReaction: "LIKE",
        createdAt: { seconds: 1729000000n, nanos: 0 },
      };

      const result = mapFeedItem(protoItem);

      expect(result).toEqual({
        id: "post-1",
        userId: "user-100",
        authorName: "Alice",
        authorAvatarUrl: "https://example.com/alice.jpg",
        itemType: "POST",
        caption: "Hello world!",
        reactionCount: 5,
        commentCount: 2,
        userReaction: "LIKE",
        createdAt: new Date(1729000000 * 1000).toISOString(),
        workoutData: undefined,
      });
    });

    it("maps a WORKOUT_ACTIVITY item with workout metrics summary", () => {
      const protoItem: any = {
        id: "activity-1",
        userId: "user-200",
        authorName: "Bob",
        authorAvatarUrl: "https://example.com/bob.jpg",
        itemType: "FEED_ITEM_TYPE_WORKOUT_ACTIVITY",
        caption: "Crushed Chest Day!",
        reactionCount: 12,
        commentCount: 3,
        userReaction: "FIRE",
        createdAt: { seconds: 1729100000n, nanos: 0 },
        workoutData: {
          sessionId: "sess-99",
          workoutTitle: "Chest Hypertrophy",
          durationSeconds: 3600,
          totalVolumeKg: 4200,
          exerciseCount: 5,
          totalSets: 18,
        },
      };

      const result = mapFeedItem(protoItem);

      expect(result).toEqual({
        id: "activity-1",
        userId: "user-200",
        authorName: "Bob",
        authorAvatarUrl: "https://example.com/bob.jpg",
        itemType: "WORKOUT_ACTIVITY",
        caption: "Crushed Chest Day!",
        reactionCount: 12,
        commentCount: 3,
        userReaction: "FIRE",
        createdAt: new Date(1729100000 * 1000).toISOString(),
        workoutData: {
          sessionId: "sess-99",
          workoutTitle: "Chest Hypertrophy",
          durationSeconds: 3600,
          totalVolumeKg: 4200,
          exerciseCount: 5,
          totalSets: 18,
        },
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
        authorAvatarUrl: "https://example.com/charlie.jpg",
        feedItemId: "post-1",
        parentId: "cmt-root",
        content: "Great lift bro!",
        createdAt: { seconds: 1729200000n, nanos: 0 },
      };

      const result = mapComment(protoComment);

      expect(result).toEqual({
        id: "cmt-1",
        userId: "user-300",
        authorName: "Charlie",
        authorAvatarUrl: "https://example.com/charlie.jpg",
        feedItemId: "post-1",
        parentId: "cmt-root",
        content: "Great lift bro!",
        createdAt: new Date(1729200000 * 1000).toISOString(),
      });
    });
  });
});
