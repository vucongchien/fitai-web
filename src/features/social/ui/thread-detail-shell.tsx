"use client";

import { MoreHorizontal } from "lucide-react";
import { use, useState } from "react";

import { BackButton } from "@/shared/ui/back-button";

import { getCachedFeedItem } from "../lib/post-cache";
import type { CommentVM, FeedItemVM } from "../model/social.types";
import { SocialContainer } from "./social-container";
import { ThreadView } from "./thread-view";

interface Props {
  postId: string;
  serverPost: FeedItemVM | null;
  commentsPromise: Promise<{ comments: CommentVM[]; nextCursor: string }>;
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

export function ThreadDetailShell({
  postId,
  serverPost,
  commentsPromise,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: Props) {
  const [post] = useState<FeedItemVM | null>(() => serverPost ?? getCachedFeedItem(postId));
  const { comments } = use(commentsPromise);

  if (!post) {
    return (
      <div className="max-w-[620px] w-full mx-auto p-8 text-center bg-white rounded-2xl border border-neutral-200">
        <p className="text-base font-semibold text-neutral-800">Thread not found</p>
        <p className="text-sm text-neutral-400 mt-1">
          This post may have been deleted or is unavailable.
        </p>
        <BackButton
          fallbackHref="/community"
          className="mt-4 inline-block px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-full cursor-pointer hover:bg-neutral-800 transition-colors w-auto h-auto"
        >
          Back to Community
        </BackButton>
      </div>
    );
  }

  const viewsCount = Math.max(post.reactionCount * 18 + 124, 270);
  const formattedViews =
    viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}K views` : `${viewsCount} views`;

  return (
    <div className="max-w-[640px] w-full mx-auto">
      <div className="flex items-center justify-between px-4 sm:px-0 mb-3">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/community" ariaLabel="Back" />
          <div>
            <h1 className="text-[17px] font-bold text-neutral-900 leading-tight">Thread</h1>
            <span className="text-[11px] text-neutral-400 font-normal select-none">
              {formattedViews}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Thread options"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer"
        >
          <MoreHorizontal size={17} />
        </button>
      </div>

      <SocialContainer hasDividers={false}>
        <ThreadView
          post={post}
          initialComments={comments}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
        />
      </SocialContainer>
    </div>
  );
}
