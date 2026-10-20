"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Send, X } from "lucide-react";

import { hapticFeedback } from "@/shared/lib/haptic-feedback";
import type { CommentVM, FeedItemVM } from "../model/social.types";
import { addCommentAction, deleteCommentAction } from "../server/social-actions";
import { ThreadCommentItem, type ThreadCommentWithReplies } from "./thread-comment-item";
import { ThreadPostCard } from "./thread-post-card";

interface Props {
  post: FeedItemVM;
  initialComments: CommentVM[];
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUserName?: string;
}

interface ReplyContext {
  commentId: string;
  authorName: string;
}

export function ThreadView({
  post,
  initialComments,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: Props) {
  const [comments, setComments] = useState<CommentVM[]>(initialComments);
  const [sortOrder, setSortOrder] = useState<"top" | "newest">("top");
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const myAvatar =
    currentUserAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName ?? "Me")}&background=random`;

  const postWithUpdatedCommentCount = useMemo(() => {
    const delta = comments.length - initialComments.length;
    return {
      ...post,
      commentCount: Math.max(0, post.commentCount + delta),
    };
  }, [post, comments.length, initialComments.length]);

  // Build tree of comments (Threads hierarchy)
  const threadComments = useMemo(() => {
    const rootComments: ThreadCommentWithReplies[] = [];
    const replyMap = new Map<string, CommentVM[]>();

    for (const c of comments) {
      if (c.parentId) {
        const arr = replyMap.get(c.parentId) ?? [];
        arr.push(c);
        replyMap.set(c.parentId, arr);
      } else {
        rootComments.push({ ...c, replies: [] });
      }
    }

    for (const root of rootComments) {
      root.replies = replyMap.get(root.id) ?? [];
    }

    if (sortOrder === "newest") {
      return [...rootComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    // "top" sorting: prioritize items with more replies
    return [...rootComments].sort(
      (a, b) => (b.replies?.length ?? 0) - (a.replies?.length ?? 0),
    );
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
      setComments((prev) => [res.comment!, ...prev]);
    } else {
      // Revert if failed
      setInputText(textToSend);
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    const res = await deleteCommentAction(commentId);
    if (res.success) {
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && c.parentId !== commentId),
      );
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
              Replying to <strong className="text-neutral-900 font-semibold">@{replyingTo.authorName}</strong>
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
              placeholder={replyingTo ? `Reply to @${replyingTo.authorName}…` : `Reply to ${post.authorName}…`}
              disabled={submitting}
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none border-none p-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
            <button
              type="button"
              aria-label="Add image"
              className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5 transition-colors"
            >
              <ImageIcon size={17} />
            </button>
            <span
              aria-hidden="true"
              className="text-[10px] font-bold text-neutral-400 border border-neutral-300 rounded px-1 select-none"
            >
              GIF
            </span>
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
        {threadComments.length === 0 ? (
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
              Đang trả lời <strong className="text-neutral-900 font-semibold">@{replyingTo.authorName}</strong>
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
              placeholder={replyingTo ? `Trả lời @${replyingTo.authorName}…` : `Trả lời ${post.authorName}…`}
              disabled={submitting}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-900 outline-none border-none p-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
            <button
              type="button"
              aria-label="Add image"
              className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5 transition-colors"
            >
              <ImageIcon size={16} />
            </button>
            <span
              aria-hidden="true"
              className="text-[9px] font-bold text-neutral-400 border border-neutral-300 rounded px-1 select-none"
            >
              GIF
            </span>
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
