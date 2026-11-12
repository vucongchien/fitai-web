import { describe, expect, it, vi } from "vitest";

import { shareWorkoutSessionAction } from "@/features/workout/server/workout-actions";
import { createPostAction } from "@/features/social/server/social-actions";

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: vi.fn(),
}));

vi.mock("@connectrpc/connect", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(),
}));

describe("Workout & Social Sharing Actions (Issue #26)", () => {
  it("shareWorkoutSessionAction returns failure if not authenticated", async () => {
    const { getAccessToken } = await import("@/shared/auth/session");
    vi.mocked(getAccessToken).mockResolvedValueOnce(undefined);

    const res = await shareWorkoutSessionAction({
      sessionId: "sess-123",
      caption: "Great leg day!",
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe("Authentication required");
  });

  it("shareWorkoutSessionAction calls WorkoutExecutionService and returns success", async () => {
    const { getAccessToken } = await import("@/shared/auth/session");
    const { createClient } = await import("@connectrpc/connect");

    vi.mocked(getAccessToken).mockResolvedValueOnce("valid-jwt-token");
    const mockShareRpc = vi.fn().mockResolvedValueOnce({
      sessionId: "sess-123",
      isShared: true,
      sharedAt: {},
    });
    vi.mocked(createClient).mockReturnValueOnce({
      shareWorkoutSession: mockShareRpc,
    } as any);

    const res = await shareWorkoutSessionAction({
      sessionId: "sess-123",
      caption: "Leg day finished!",
      visibility: "PUBLIC",
    });

    expect(res.success).toBe(true);
    expect(res.isShared).toBe(true);
    expect(mockShareRpc).toHaveBeenCalledWith({
      sessionId: "sess-123",
      caption: "Leg day finished!",
      mediaUrls: [],
      visibility: "PUBLIC",
    });
  });

  it("createPostAction returns failure if no accessToken", async () => {
    const { getAccessToken } = await import("@/shared/auth/session");
    vi.mocked(getAccessToken).mockResolvedValueOnce(undefined);

    const res = await createPostAction({
      caption: "Hello community!",
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain("Authentication required");
  });

  it("createPostAction calls SocialService.CreatePost and returns mapped FeedItemVM", async () => {
    const { getAccessToken } = await import("@/shared/auth/session");
    const { createClient } = await import("@connectrpc/connect");

    vi.mocked(getAccessToken).mockResolvedValueOnce("valid-jwt-token");
    const mockCreatePostRpc = vi.fn().mockResolvedValueOnce({
      item: {
        id: "post-999",
        userId: "user-123",
        authorName: "Coach Alex",
        authorAvatarUrl: "https://example.com/avatar.jpg",
        itemType: "POST",
        caption: "Let's hit a new PR today!",
        reactionCount: 0,
        commentCount: 0,
        userReaction: "",
        createdAt: { seconds: BigInt(1710000000), nanos: 0 },
      },
    });
    vi.mocked(createClient).mockReturnValueOnce({
      createPost: mockCreatePostRpc,
    } as any);

    const res = await createPostAction({
      caption: "Let's hit a new PR today!",
      visibility: "PUBLIC",
    });

    expect(res.success).toBe(true);
    expect(res.item).toBeDefined();
    expect(res.item?.id).toBe("post-999");
    expect(res.item?.caption).toBe("Let's hit a new PR today!");
    expect(res.item?.authorName).toBe("Coach Alex");
  });
});
