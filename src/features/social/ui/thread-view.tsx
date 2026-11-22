"use client";

import { Loader2, Send, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { hapticFeedback } from "@/shared/lib/haptic-feedback";

import { cacheFeedItem } from "../lib/post-cache";
import type { CommentVM, FeedItemVM } from "../model/social.types";
import { addCommentAction, deleteCommentAction } from "../server/social-actions";
import {
  countDescendantReplies,
  ThreadCommentItem,
  type ThreadCommentWithReplies,
} from "./thread-comment-item";
import { ThreadPostCard } from "./thread-post-card";

interface Props {
  post: FeedItemVM;
  initialComments: CommentVM[];
  isLoadingComments?: boolean;
  commentsError?: boolean;
  onRetryComments?: () => void;
  onCommentsMutated?: (nextComments: CommentVM[]) => void;
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

interface ReplyContext {
  commentId: string;
  authorName: string;
}

function collectDeletedBranchIds(allComments: CommentVM[], seedIds: Set<string>): Set<string> {
  if (seedIds.size === 0) return seedIds;
  const removed = new Set(seedIds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of allComments) {
      if (c.parentId && removed.has(c.parentId) && !removed.has(c.id)) {
        removed.add(c.id);
        grew = true;
      }
    }
  }
  return removed;
}

function sortRepliesChronologically(nodes: ThreadCommentWithReplies[]) {
  nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const node of nodes) {
    if (node.replies && node.replies.length > 0) {
      sortRepliesChronologically(node.replies);
    }
  }
}

export function ThreadView({
  post,
  initialComments,
  isLoadingComments = false,
  commentsError = false,
  onRetryComments,
  onCommentsMutated,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: Props) {
  const [addedComments, setAddedComments] = useState<CommentVM[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"top" | "newest">("top");
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const myAvatar =
    currentUserAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName ?? "Me")}&background=random`;

  const comments = useMemo(() => {
    const rawList = [...addedComments, ...initialComments];
    const deletedSet = collectDeletedBranchIds(rawList, new Set(deletedIds));
    const seen = new Set<string>();
    const merged: CommentVM[] = [];
    for (const c of rawList) {
      if (seen.has(c.id) || deletedSet.has(c.id)) {
        continue;
      }
      seen.add(c.id);
      merged.push(c);
    }
    return merged;
  }, [addedComments, initialComments, deletedIds]);

  const postWithUpdatedCommentCount = useMemo(() => {
    const delta = comments.length - initialComments.length;
    return {
      ...post,
      commentCount: Math.max(0, post.commentCount + delta),
    };
  }, [post, comments.length, initialComments.length]);

  // Build recursive tree of comments (supports nested replies at any depth)
  const threadComments = useMemo(() => {
    const nodeMap = new Map<string, ThreadCommentWithReplies>();
    for (const c of comments) {
      nodeMap.set(c.id, { ...c, replies: [] });
    }

    const rootComments: ThreadCommentWithReplies[] = [];
    for (const c of comments) {
      const node = nodeMap.get(c.id)!;
      const parent = c.parentId ? nodeMap.get(c.parentId) : undefined;
      if (parent && parent.id !== node.id) {
        parent.replies!.push(node);
      } else {
        rootComments.push(node);
      }
    }

    for (const root of rootComments) {
      if (root.replies && root.replies.length > 0) {
        sortRepliesChronologically(root.replies);
      }
    }

    if (sortOrder === "newest") {
      return [...rootComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    // "top" sorting: prioritize items with more total descendant replies
    return [...rootComments].sort((a, b) => countDescendantReplies(b) - countDescendantReplies(a));
  }, [comments, sortOrder]);

  // Reply trigger — FB style: prefill @Name and focus input
  function handleReplyClick(targetComment: CommentVM) {
    hapticFeedback.repSuccess();
    const mentionTag = `@${targetComment.authorName} `;
    setReplyingTo({
      commentId: targetComment.id,
      authorName: targetComment.authorName,
    });
    setInputText((prev) => (prev.startsWith(mentionTag) ? prev : `${mentionTag}${prev}`));

    // Focus input directly in event handler (No useEffect needed)
    setTimeout(() => {
      if (window.innerWidth < 640) {
        mobileInputRef.current?.focus();
      } else {
        desktopInputRef.current?.focus();
      }
    }, 50);
  }

  function handleCancelReply() {
    setReplyingTo(null);
  }

  function handleToggleSort() {
    setSortOrder((prev) => (prev === "top" ? "newest" : "top"));
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || submitting) return;

    hapticFeedback.repSuccess();
    setSubmitting(true);
    const textToSend = trimmed;
    const parentIdToSend = replyingTo?.commentId;

    setInputText("");
    setReplyingTo(null);

    const res = await addCommentAction(post.id, textToSend, parentIdToSend);
    if (res.comment) {
      const createdComment = res.comment;
      const nextComments = [createdComment, ...comments];
      setAddedComments((prev) => [createdComment, ...prev]);
      onCommentsMutated?.(nextComments);
      cacheFeedItem({
        ...post,
        commentCount: Math.max(0, postWithUpdatedCommentCount.commentCount + 1),
      });
    } else {
      // Revert if failed
      setInputText(textToSend);
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    const res = await deleteCommentAction(commentId);
    if (res.success) {
      const removedIds = collectDeletedBranchIds(comments, new Set([commentId]));
      const nextComments = comments.filter((c) => !removedIds.has(c.id));
      const removedCount = Math.max(1, comments.length - nextComments.length);
      setDeletedIds((prev) => [...prev, commentId]);
      onCommentsMutated?.(nextComments);
      cacheFeedItem({
        ...post,
        commentCount: Math.max(0, postWithUpdatedCommentCount.commentCount - removedCount),
      });
    }
  }

  return (
    <div className="relative pb-24 sm:pb-8">
      {/* 1. Main Post Card */}
      <ThreadPostCard
        post={postWithUpdatedCommentCount}
        currentUserId={currentUserId}
        sortOrder={sortOrder}
        onToggleSort={handleToggleSort}
        onCommentClick={() => {
          if (window.innerWidth < 640) {
            mobileInputRef.current?.focus();
          } else {
            desktopInputRef.current?.focus();
          }
        }}
      />

      {/* 2. Desktop Inline Reply Bar (Image 2) */}
      <div className="hidden sm:block px-4 sm:px-6 pt-2 pb-3 border-b border-neutral-100 bg-white">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/60">
            <span>
              Replying to{" "}
              <strong className="text-neutral-900 font-semibold">@{replyingTo.authorName}</strong>
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              aria-label="Cancel reply"
              className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
            <Image
              src={myAvatar}
              alt="You"
              fill
              sizes="32px"
              className="object-cover"
              unoptimized={!myAvatar.startsWith("/")}
            />
          </div>

          {/* Capsule wrapping input AND icons with active focus-within border */}
          <div className="flex-1 flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200/80 px-4 py-2 text-sm transition-all duration-150 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 focus-within:bg-white">
            <input
              ref={desktopInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                replyingTo ? `Reply to @${replyingTo.authorName}…` : `Reply to ${post.authorName}…`
              }
              disabled={submitting}
              style={{ outline: "none" }}
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none border-none p-0 focus:outline-none focus-visible:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || submitting}
            aria-label="Send reply"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 active:scale-90 transition-all cursor-pointer flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* 3. Thread Comments List (Image 2) */}
      <div className="px-4 sm:px-6 divide-y divide-neutral-100 bg-white">
        {isLoadingComments ? (
          <div className="flex items-center justify-center gap-2 py-10 text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-sm">Loading replies…</span>
          </div>
        ) : commentsError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-neutral-500">Could not load replies.</p>
            {onRetryComments && (
              <button
                type="button"
                onClick={onRetryComments}
                className="mt-2 text-xs font-semibold text-neutral-900 underline cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        ) : threadComments.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-10">
            No replies yet. Be the first to start the conversation!
          </p>
        ) : (
          threadComments.map((rootComment) => (
            <ThreadCommentItem
              key={rootComment.id}
              comment={rootComment}
              postAuthorId={post.userId}
              currentUserId={currentUserId}
              onReply={handleReplyClick}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>

      {/* 4. Mobile Sticky Bottom Chat Bar (Requirement: sticky bên dưới đáy cho mobile) */}
      <div className="block sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-3 py-2 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {replyingTo && (
          <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>
              Đang trả lời{" "}
              <strong className="text-neutral-900 font-semibold">@{replyingTo.authorName}</strong>
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              aria-label="Cancel reply"
              className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
            <Image
              src={myAvatar}
              alt="You"
              fill
              sizes="32px"
              className="object-cover"
              unoptimized={!myAvatar.startsWith("/")}
            />
          </div>

          {/* Capsule wrapping input AND icons with active focus-within border */}
          <div className="flex-1 flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200/80 px-3.5 py-1.5 text-[14px] transition-all duration-150 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 focus-within:bg-white">
            <input
              ref={mobileInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                replyingTo ? `Trả lời @${replyingTo.authorName}…` : `Trả lời ${post.authorName}…`
              }
              disabled={submitting}
              style={{ outline: "none" }}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-900 outline-none border-none p-0 focus:outline-none focus-visible:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || submitting}
            aria-label="Gửi bình luận"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
