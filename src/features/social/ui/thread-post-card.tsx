"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, MoreHorizontal } from "lucide-react";

import type { FeedItemVM } from "../model/social.types";
import { cacheFeedItem } from "../lib/post-cache";
import { ReactionBar } from "./reaction-bar";
import { WorkoutSummaryCard } from "./workout-summary-card";

interface Props {
  post: FeedItemVM;
  currentUserId?: string;
  sortOrder: "top" | "newest";
  onToggleSort: () => void;
  onCommentClick?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ThreadPostCard({
  post,
  currentUserId,
  sortOrder,
  onToggleSort,
  onCommentClick,
}: Props) {
  const avatarSrc =
    post.authorAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=random`;

  const isSelf = currentUserId === post.userId;

  return (
    <div className="bg-white px-4 sm:px-6 pt-5 pb-3">
      {/* 1. Author row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with Threads '+' badge */}
          <div className="relative flex-shrink-0">
            <Link
              href={`/social/users/${post.userId}`}
              aria-label={`${post.authorName}'s profile`}
              className="block active:scale-95 transition-transform"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
                <Image
                  src={avatarSrc}
                  alt={post.authorName}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized={avatarSrc.includes("ui-avatars.com")}
                />
              </div>
            </Link>
            {!isSelf && (
              <div
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white ring-2 ring-white select-none pointer-events-none"
              >
                +
              </div>
            )}
          </div>

          {/* Name & time */}
          <div className="flex items-center gap-1.5">
            <Link
              href={`/social/users/${post.userId}`}
              className="truncate text-[15px] font-semibold text-neutral-900 hover:underline block leading-tight"
            >
              {post.authorName}
            </Link>
            <span className="text-xs text-neutral-400 font-normal">
              · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {/* More options button */}
        <button
          type="button"
          aria-label="More options"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* 2. Caption */}
      {post.caption && (
        <p className="mt-3 text-[15px] sm:text-[15.5px] text-neutral-900 leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>
      )}

      {/* 3. Workout metrics card if workout activity */}
      {post.itemType === "WORKOUT_ACTIVITY" && post.workoutData && (
        <div className="mt-3">
          <WorkoutSummaryCard data={post.workoutData} />
        </div>
      )}

      {/* 4. Action / Reaction Bar */}
      <div className="mt-2">
        <ReactionBar
          feedItemId={post.id}
          initialReaction={post.userReaction}
          initialCount={post.reactionCount}
          commentCount={post.commentCount}
          onCommentClick={onCommentClick}
          onReactionChange={(reaction, count) => {
            cacheFeedItem({
              ...post,
              userReaction: reaction,
              reactionCount: count,
            });
          }}
        />
      </div>

      {/* 5. Separator line & Sort Bar (Image 1 & 2) */}
      <div className="mt-2 -mx-4 sm:-mx-6 border-t border-neutral-100 px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleSort}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:text-neutral-950 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowUpDown size={14} className="text-neutral-500" />
          <span>{sortOrder === "top" ? "Top" : "Newest"}</span>
          <span className="text-[10px] text-neutral-400">▾</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>View activity</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
