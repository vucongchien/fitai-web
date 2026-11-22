"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useParams } from "next/navigation";

import { BackButton } from "@/shared/ui/back-button";

import {
  cacheCurrentSocialUser,
  cacheFeedItem,
  getCachedComments,
  getCachedCurrentSocialUser,
  getCachedFeedItem,
  getMemoryCachedFeedItem,
  preloadThreadComments,
  setCachedComments,
  socialQueryKeys,
} from "../lib/post-cache";
import type { CommentVM } from "../model/social.types";
import { getThreadBootstrapAction, listCommentsAction } from "../server/social-actions";
import { SocialContainer } from "./social-container";
import { ThreadPageSkeleton } from "./thread-skeleton";
import { ThreadView } from "./thread-view";

export function ThreadDetailShell() {
  const queryClient = useQueryClient();
  const params = useParams<{ postId: string }>();
  const postId = typeof params?.postId === "string" ? params.postId : "";

  const memoryPost = postId ? getMemoryCachedFeedItem(postId) : null;
  const cachedUser = getCachedCurrentSocialUser();
  const cachedComments = postId ? getCachedComments(postId) : null;

  const bootstrapQuery = useQuery({
    queryKey: socialQueryKeys.threadBootstrap(postId),
    queryFn: async () => {
      const storedPost = getCachedFeedItem(postId);
      const data = await getThreadBootstrapAction(postId);
      const resolvedPost = data.post ?? storedPost;
      if (resolvedPost) {
        cacheFeedItem(resolvedPost);
      }
      if (data.currentUserId) {
        cacheCurrentSocialUser({
          userId: data.currentUserId,
          name: data.currentUserName,
          avatarUrl: data.currentUserAvatar,
        });
      }
      return {
        ...data,
        post: resolvedPost,
      };
    },
    enabled: Boolean(postId) && (!memoryPost || !cachedUser?.userId),
    staleTime: 60_000,
  });

  const commentsQuery = useQuery({
    queryKey: socialQueryKeys.comments(postId),
    queryFn: () => preloadThreadComments(postId, () => listCommentsAction(postId)),
    initialData: cachedComments ?? undefined,
    enabled: Boolean(postId),
    staleTime: 30_000,
  });

  const post = memoryPost ?? bootstrapQuery.data?.post ?? null;
  const currentUserId = cachedUser?.userId ?? bootstrapQuery.data?.currentUserId;
  const currentUserAvatar = cachedUser?.avatarUrl ?? bootstrapQuery.data?.currentUserAvatar;
  const currentUserName = cachedUser?.name ?? bootstrapQuery.data?.currentUserName;

  function handleCommentsMutated(nextComments: CommentVM[]) {
    if (!postId) return;
    const nextData = {
      comments: nextComments,
      nextCursor: commentsQuery.data?.nextCursor ?? "",
    };
    setCachedComments(postId, nextData);
    queryClient.setQueryData(socialQueryKeys.comments(postId), nextData);
  }

  if (!post && bootstrapQuery.isPending) {
    return <ThreadPageSkeleton />;
  }

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
          initialComments={commentsQuery.data?.comments ?? []}
          isLoadingComments={commentsQuery.isPending}
          commentsError={commentsQuery.isError}
          onRetryComments={() => void commentsQuery.refetch()}
          onCommentsMutated={handleCommentsMutated}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
        />
      </SocialContainer>
    </div>
  );
}
