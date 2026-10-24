import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicProfile } from "@/features/social/server/get-public-profile";

const mockGetSocialSummary = vi.fn();
const mockGetUserProfileFeed = vi.fn();

vi.mock("@connectrpc/connect", () => ({
  createClient: () => ({
    getSocialSummary: mockGetSocialSummary,
    getUserProfileFeed: mockGetUserProfileFeed,
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn().mockReturnValue({}),
}));

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

describe("getPublicProfile", () => {
  const originalEnv = process.env.FITAI_RPC_URL;

  beforeEach(() => {
    process.env.FITAI_RPC_URL = "http://localhost:8080";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.FITAI_RPC_URL = originalEnv;
  });

  it("extracts identity directly from summary even when user has 0 posts", async () => {
    mockGetSocialSummary.mockResolvedValue({
      userId: "user-1234",
      followerCount: 50,
      followingCount: 20,
      postCount: 0,
      isFollowing: false,
      fullName: "Nguyễn Văn A",
      avatarUrl: "https://example.com/avatar.jpg",
      role: "user",
    });

    mockGetUserProfileFeed.mockResolvedValue({
      items: [],
      nextCursor: "",
    });

    const result = await getPublicProfile("user-1234");

    expect(result.userId).toBe("user-1234");
    expect(result.authorName).toBe("Nguyễn Văn A");
    expect(result.authorAvatarUrl).toBe("https://example.com/avatar.jpg");
    expect(result.feedItems).toEqual([]);
    expect(result.summary.followerCount).toBe(50);
  });

  it("falls back to first feed item when summary fullName is empty", async () => {
    mockGetSocialSummary.mockResolvedValue({
      userId: "user-5678",
      followerCount: 5,
      followingCount: 2,
      postCount: 1,
      isFollowing: true,
      fullName: "",
      avatarUrl: "",
      role: "user",
    });

    mockGetUserProfileFeed.mockResolvedValue({
      items: [
        {
          id: "feed-1",
          userId: "user-5678",
          authorName: "Legacy Name",
          authorAvatarUrl: "https://example.com/legacy.jpg",
          itemType: "FEED_ITEM_TYPE_POST",
          caption: "Hello world",
          reactionCount: 1,
          commentCount: 0,
          userReaction: "",
          createdAt: { seconds: 1776500000 },
        },
      ],
      nextCursor: "",
    });

    const result = await getPublicProfile("user-5678");

    expect(result.authorName).toBe("Legacy Name");
    expect(result.authorAvatarUrl).toBe("https://example.com/legacy.jpg");
    expect(result.feedItems.length).toBe(1);
  });

  it("throws error if getSocialSummary fails", async () => {
    mockGetSocialSummary.mockRejectedValue(new Error("RPC unavailable"));
    mockGetUserProfileFeed.mockResolvedValue({ items: [], nextCursor: "" });

    await expect(getPublicProfile("user-err")).rejects.toThrow("Failed to load profile");
  });
});
