import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ReactionBar } from "@/features/social/ui/reaction-bar";
import * as socialActions from "@/features/social/server/social-actions";

vi.mock("@/shared/lib/haptic-feedback", () => ({
  hapticFeedback: {
    repSuccess: vi.fn(),
  },
}));

describe("ReactionBar UI and Reaction Count", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("increments like count optimistically and keeps count when backend returns reactionCount 0", async () => {
    const reactSpy = vi.spyOn(socialActions, "reactTargetAction").mockResolvedValueOnce({
      success: true,
      currentReaction: "LIKE",
      reactionCount: 0, // Backend omitted reaction_count
    });

    render(
      <ReactionBar
        feedItemId="post-1"
        initialReaction=""
        initialCount={41}
        commentCount={5}
      />,
    );

    expect(screen.getByText("41")).toBeInTheDocument();

    const likeButton = screen.getByRole("button", { name: /^like$/i });

    await act(async () => {
      fireEvent.click(likeButton);
    });

    expect(reactSpy).toHaveBeenCalledWith("post-1", "LIKE");
    // Count should be 42 and NOT disappeared/reset to 0
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^unlike$/i })).toBeInTheDocument();
  });

  it("decrements like count when unliking and retains the correct count", async () => {
    const reactSpy = vi.spyOn(socialActions, "reactTargetAction").mockResolvedValueOnce({
      success: true,
      currentReaction: "",
      reactionCount: 0,
    });

    render(
      <ReactionBar
        feedItemId="post-1"
        initialReaction="LIKE"
        initialCount={42}
        commentCount={5}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();

    const unlikeButton = screen.getByRole("button", { name: /^unlike$/i });

    await act(async () => {
      fireEvent.click(unlikeButton);
    });

    expect(reactSpy).toHaveBeenCalledWith("post-1", "LIKE");
    // Count should be 41 and NOT disappeared/reset to 0
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^like$/i })).toBeInTheDocument();
  });

  it("shows count 1 when liking a post with initial count 0", async () => {
    vi.spyOn(socialActions, "reactTargetAction").mockResolvedValueOnce({
      success: true,
      currentReaction: "LIKE",
      reactionCount: 0,
    });

    render(
      <ReactionBar
        feedItemId="post-empty"
        initialReaction=""
        initialCount={0}
        commentCount={0}
      />,
    );

    // With 0 likes, no count number is shown
    const likeButton = screen.getByRole("button", { name: /^like$/i });
    expect(likeButton.textContent?.trim()).toBe("");

    await act(async () => {
      fireEvent.click(likeButton);
    });

    // Count 1 must appear and stay visible
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides count when unliking a post that reaches 0 likes", async () => {
    vi.spyOn(socialActions, "reactTargetAction").mockResolvedValueOnce({
      success: true,
      currentReaction: "",
      reactionCount: 0,
    });

    render(
      <ReactionBar
        feedItemId="post-single"
        initialReaction="LIKE"
        initialCount={1}
        commentCount={0}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();

    const unlikeButton = screen.getByRole("button", { name: /^unlike$/i });

    await act(async () => {
      fireEvent.click(unlikeButton);
    });

    // After unliking 1 -> 0, number should disappear cleanly
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("rolls back optimistic count and reaction when server action fails", async () => {
    vi.spyOn(socialActions, "reactTargetAction").mockResolvedValueOnce({
      success: false,
      currentReaction: "",
      reactionCount: 0,
    });

    render(
      <ReactionBar
        feedItemId="post-1"
        initialReaction=""
        initialCount={41}
        commentCount={0}
      />,
    );

    expect(screen.getByText("41")).toBeInTheDocument();

    const likeButton = screen.getByRole("button", { name: /^like$/i });

    await act(async () => {
      fireEvent.click(likeButton);
    });

    // Should rollback to original count 41 and Like label
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^like$/i })).toBeInTheDocument();
  });

  it("toggles repost count and emerald status without stale closure", () => {
    render(
      <ReactionBar
        feedItemId="post-1"
        initialReaction=""
        initialCount={10}
        commentCount={0}
      />,
    );

    const repostButton = screen.getByRole("button", { name: /^repost$/i });
    expect(repostButton.textContent?.trim()).toBe("");

    fireEvent.click(repostButton);
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(repostButton);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
