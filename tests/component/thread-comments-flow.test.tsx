import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { FeedCard } from "@/features/social/ui/feed-card";
import { ThreadView } from "@/features/social/ui/thread-view";
import type { CommentVM, FeedItemVM } from "@/features/social/model/social.types";
import * as socialActions from "@/features/social/server/social-actions";

vi.mock<typeof import("next/navigation")>(import("next/navigation"), () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock<typeof import("next/link")>(import("next/link"), () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/shared/lib/haptic-feedback", () => ({
  hapticFeedback: {
    repSuccess: vi.fn(),
  },
}));

const mockPost: FeedItemVM = {
  id: "post-101",
  userId: "author-1",
  authorName: "microsoftsecurity",
  authorAvatarUrl: "",
  itemType: "POST",
  caption: "Spicing things up with multi-factor authentication.",
  reactionCount: 41,
  commentCount: 8,
  userReaction: "",
  createdAt: new Date().toISOString(),
};

const mockComments: CommentVM[] = [
  {
    id: "comm-1",
    userId: "user-2",
    authorName: "arhitekta haosa",
    authorAvatarUrl: "",
    feedItemId: "post-101",
    content: "Me asking my partner if they locked the front door.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "comm-2",
    userId: "author-1",
    authorName: "microsoftsecurity",
    authorAvatarUrl: "",
    feedItemId: "post-101",
    parentId: "comm-1",
    content: "Love is blind but security isn't",
    createdAt: new Date().toISOString(),
  },
];

describe("Thread Comments Flow (Threads-style)", () => {
  it("FeedCard comment button navigates to /social/posts/[postId]", () => {
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);

    render(<FeedCard item={mockPost} currentUserId="author-1" />);

    const commentButton = screen.getByRole("button", { name: /comments/i });
    fireEvent.click(commentButton);

    expect(pushMock).toHaveBeenCalledWith("/social/posts/post-101");
  });

  it("renders post card and nested threaded replies with Author badge", () => {
    render(
      <ThreadView
        post={mockPost}
        initialComments={mockComments}
        currentUserId="user-viewer"
        currentUserName="Viewer"
      />,
    );

    expect(screen.getByText("Spicing things up with multi-factor authentication.")).toBeInTheDocument();
    expect(screen.getByText("arhitekta haosa")).toBeInTheDocument();
    expect(screen.getByText("Me asking my partner if they locked the front door.")).toBeInTheDocument();

    // Check nested child reply
    expect(screen.getByText("Love is blind but security isn't")).toBeInTheDocument();
    // Author badge rendered for post author
    expect(screen.getByText("· Author")).toBeInTheDocument();
    // Verified blue badge is removed
    expect(screen.queryByLabelText("Verified")).not.toBeInTheDocument();
  });

  it("renders user's own avatar in chat box and active focus border on capsule", () => {
    const customAvatar = "https://images.unsplash.com/photo-my-avatar";
    render(
      <ThreadView
        post={mockPost}
        initialComments={mockComments}
        currentUserId="user-viewer"
        currentUserAvatar={customAvatar}
        currentUserName="Viewer"
      />,
    );

    const avatarImages = screen.getAllByAltText("You");
    expect(avatarImages[0]).toBeInTheDocument();

    const desktopInput = screen.getByPlaceholderText(/reply to microsoftsecurity/i);
    const capsule = desktopInput.parentElement;
    expect(capsule).toHaveClass("focus-within:border-neutral-900");
  });

  it("pre-fills @authorName in FB style when clicking reply on a comment", () => {
    render(
      <ThreadView
        post={mockPost}
        initialComments={mockComments}
        currentUserId="user-viewer"
        currentUserName="Viewer"
      />,
    );

    const replyButtons = screen.getAllByRole("button", { name: /reply to comment/i });
    fireEvent.click(replyButtons[0]);

    // Check desktop input value contains @arhitekta haosa
    const desktopInput = screen.getByPlaceholderText(/reply to @arhitekta haosa/i);
    expect(desktopInput).toHaveValue("@arhitekta haosa ");

    // Check reply context banner is displayed
    expect(screen.getByText(/replying to/i)).toBeInTheDocument();
  });

  it("submits comment with parentId when replying", async () => {
    const addCommentSpy = vi
      .spyOn(socialActions, "addCommentAction")
      .mockResolvedValueOnce({
        comment: {
          id: "comm-3",
          userId: "user-viewer",
          authorName: "Viewer",
          authorAvatarUrl: "",
          feedItemId: "post-101",
          parentId: "comm-1",
          content: "@arhitekta haosa Exactly my point!",
          createdAt: new Date().toISOString(),
        },
      });

    render(
      <ThreadView
        post={mockPost}
        initialComments={mockComments}
        currentUserId="user-viewer"
        currentUserName="Viewer"
      />,
    );

    const replyButtons = screen.getAllByRole("button", { name: /reply to comment/i });
    fireEvent.click(replyButtons[0]);

    const desktopInput = screen.getByPlaceholderText(/reply to @arhitekta haosa/i);
    fireEvent.change(desktopInput, {
      target: { value: "@arhitekta haosa Exactly my point!" },
    });

    const submitButton = screen.getByRole("button", { name: /send reply/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(addCommentSpy).toHaveBeenCalledWith(
      "post-101",
      "@arhitekta haosa Exactly my point!",
      "comm-1",
    );
  });
});
