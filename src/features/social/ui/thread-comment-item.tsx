"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal, Send, Trash2 } from "lucide-react";

import { hapticFeedback } from "@/shared/lib/haptic-feedback";
import { CommentVM } from "../model/social.types";

export interface ThreadCommentWithReplies extends CommentVM {
  replies?: CommentVM[];
}

type Props = {
  comment: ThreadCommentWithReplies;
  postAuthorId: string;
  currentUserId?: string;
  onReply: (targetComment: CommentVM) => void;
  onDelete?: (commentId: string) => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ThreadCommentItem({
  comment,
  postAuthorId,
  currentUserId,
  onReply,
  onDelete,
}: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPostAuthor = comment.userId === postAuthorId;
  const isSelf = currentUserId === comment.userId;
  const hasReplies = Boolean(comment.replies && comment.replies.length > 0);

  const avatarSrc =
    comment.authorAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=random`;

  function handleLike() {
    hapticFeedback.repSuccess();
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
  }

  return (
    <div className="relative pt-3 pb-2 border-t border-neutral-100 first:border-t-0">
      {/* Vertical connector line connecting parent to replies (Threads style) */}
      {hasReplies && (
        <div
          aria-hidden="true"
          className="absolute left-[18px] top-12 bottom-6 w-[2px] bg-neutral-200 pointer-events-none"
        />
      )}

      {/* Root comment row */}
      <div className="flex gap-3 relative z-10">
        {/* Avatar */}
        <Link
          href={`/community/users/${comment.userId}`}
          aria-label={`${comment.authorName}'s profile`}
          className="flex-shrink-0 self-start active:scale-95 transition-transform"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
            <Image
              src={avatarSrc}
              alt={comment.authorName}
              fill
              sizes="36px"
              className="object-cover"
              unoptimized={avatarSrc.includes("ui-avatars.com")}
            />
          </div>
        </Link>

        {/* Comment body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/community/users/${comment.userId}`}
                className="text-[13.5px] font-semibold text-neutral-900 hover:underline leading-tight"
              >
                {comment.authorName}
              </Link>
              {isPostAuthor && (
                <span className="text-[11px] font-medium text-neutral-400">· Author</span>
              )}
              <span className="text-[11px] text-neutral-400">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Actions dropdown / Delete */}
            <div className="relative">
              <button
                type="button"
                aria-label="Comment options"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
              >
                <MoreHorizontal size={14} />
              </button>

              {menuOpen && isSelf && onDelete && (
                <div className="absolute right-0 top-7 z-20 w-32 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(comment.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comment text */}
          <p className="mt-1 text-[13.5px] sm:text-[14px] text-neutral-800 leading-relaxed whitespace-pre-line">
            {comment.content}
          </p>

          {/* Action row (Heart, Reply, Share) */}
          <div className="mt-2 -ml-2 flex items-center gap-4 text-neutral-800">
            <button
              type="button"
              aria-label="Like reply"
              onClick={handleLike}
              className="flex items-center gap-1 p-1.5 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer"
            >
              <Heart
                size={16}
                strokeWidth={1.8}
                className={liked ? "fill-red-500 text-red-500" : "text-neutral-700"}
              />
              {likeCount > 0 && (
                <span className={`text-xs ${liked ? "text-red-500 font-semibold" : "text-neutral-500"}`}>
                  {likeCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Reply to comment"
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 p-1.5 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900"
            >
              <MessageCircle size={16} strokeWidth={1.8} />
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-neutral-500">{comment.replies.length}</span>
              )}
            </button>

            <button
              type="button"
              aria-label="Share reply"
              className="p-1.5 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900"
            >
              <Send size={15} strokeWidth={1.8} className="-rotate-12" />
            </button>
          </div>
        </div>
      </div>

      {/* Child replies (Threads nested list) */}
      {hasReplies && (
        <div className="mt-3 space-y-3 pl-8 sm:pl-10">
          {comment.replies!.map((reply) => (
            <ThreadReplyItem
              key={reply.id}
              reply={reply}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadReplyItem({
  reply,
  postAuthorId,
  currentUserId,
  onReply,
  onDelete,
}: {
  reply: CommentVM;
  postAuthorId: string;
  currentUserId?: string;
  onReply: (targetComment: CommentVM) => void;
  onDelete?: (commentId: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPostAuthor = reply.userId === postAuthorId;
  const isSelf = currentUserId === reply.userId;

  const avatarSrc =
    reply.authorAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorName)}&background=random`;

  function handleLike() {
    hapticFeedback.repSuccess();
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
  }

  return (
    <div className="flex gap-2.5 relative">
      {/* Elbow connector curve (Threads style) */}
      <div
        aria-hidden="true"
        className="absolute -left-[22px] -top-2 w-4 h-6 rounded-bl-xl border-l-2 border-b-2 border-neutral-200 pointer-events-none"
      />

      {/* Child Avatar */}
      <Link
        href={`/community/users/${reply.userId}`}
        aria-label={`${reply.authorName}'s profile`}
        className="flex-shrink-0 self-start active:scale-95 transition-transform"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
          <Image
            src={avatarSrc}
            alt={reply.authorName}
            fill
            sizes="32px"
            className="object-cover"
            unoptimized={avatarSrc.includes("ui-avatars.com")}
          />
        </div>
      </Link>

      {/* Reply body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/community/users/${reply.userId}`}
              className="text-[13px] font-semibold text-neutral-900 hover:underline leading-tight"
            >
              {reply.authorName}
            </Link>
            {isPostAuthor && (
              <span className="text-[11px] font-medium text-neutral-400">· Author</span>
            )}
            <span className="text-[11px] text-neutral-400">
              {timeAgo(reply.createdAt)}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Reply options"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
            >
              <MoreHorizontal size={13} />
            </button>

            {menuOpen && isSelf && onDelete && (
              <div className="absolute right-0 top-6 z-20 w-32 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(reply.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-0.5 text-[13px] sm:text-[13.5px] text-neutral-800 leading-relaxed whitespace-pre-line">
          {reply.content}
        </p>

        {/* Action row */}
        <div className="mt-1.5 -ml-2 flex items-center gap-3 text-neutral-800">
          <button
            type="button"
            aria-label="Like reply"
            onClick={handleLike}
            className="flex items-center gap-1 p-1 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer"
          >
            <Heart
              size={15}
              strokeWidth={1.8}
              className={liked ? "fill-red-500 text-red-500" : "text-neutral-700"}
            />
            {likeCount > 0 && (
              <span className={`text-[11px] ${liked ? "text-red-500 font-semibold" : "text-neutral-500"}`}>
                {likeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Reply to comment"
            onClick={() => onReply(reply)}
            className="flex items-center gap-1 p-1 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900"
          >
            <MessageCircle size={15} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Share reply"
            className="p-1 rounded-full hover:bg-neutral-50 active:scale-90 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900"
          >
            <Send size={14} strokeWidth={1.8} className="-rotate-12" />
          </button>
        </div>
      </div>
    </div>
  );
}
