"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { cacheFeedItem } from "../lib/post-cache";
import type { FeedItemVM, ReactionType } from "../model/social.types";
import { ReactionBar } from "./reaction-bar";
import { WorkoutSummaryCard } from "./workout-summary-card";

interface Props {
  item: FeedItemVM;
  currentUserId?: string;
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

export function FeedCard({ item, currentUserId }: Props) {
  const router = useRouter();
  const [userReaction, setUserReaction] = useState<ReactionType>(item.userReaction);
  const [reactionCount, setReactionCount] = useState<number>(item.reactionCount);

  const avatarSrc =
    item.authorAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.authorName)}&background=random`;

  const isSelf = currentUserId === item.userId;

  function handleNavigateToThread() {
    cacheFeedItem({
      ...item,
      userReaction,
      reactionCount,
    });
    router.push(`/community/posts/${item.id}`);
  }

  return (
    <article className="flex gap-3.5 px-4 sm:px-6 py-4 bg-white transition-colors">
      {/* 1. Avatar column (Exact 40x40 with Threads '+' badge) */}
      <div className="relative flex-shrink-0 self-start">
        <Link
          href={`/community/users/${item.userId}`}
          aria-label={`${item.authorName}'s profile`}
          className="block active:scale-95 transition-transform"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
            <Image
              src={avatarSrc}
              alt={item.authorName}
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

      {/* 2. Content column */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Header row: Author Name, time, more options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/community/users/${item.userId}`}
              className="truncate text-[14.5px] font-semibold text-neutral-900 hover:underline block leading-tight"
            >
              {item.authorName}
            </Link>
            <span className="text-xs text-neutral-400 font-normal select-none">
              {timeAgo(item.createdAt)}
            </span>
          </div>

          <button
            type="button"
            aria-label="More options"
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all -mr-1 cursor-pointer"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Caption — clicking takes you to thread */}
        {item.caption && (
          <p
            onClick={handleNavigateToThread}
            className="mt-1 text-[14.5px] text-neutral-900 leading-relaxed whitespace-pre-line cursor-pointer"
          >
            {item.caption}
          </p>
        )}

        {/* Workout metrics card (if WORKOUT_ACTIVITY) */}
        {item.itemType === "WORKOUT_ACTIVITY" && item.workoutData && (
          <div onClick={handleNavigateToThread} className="cursor-pointer">
            <WorkoutSummaryCard data={item.workoutData} />
          </div>
        )}

        {/* Reaction Bar (Heart, Message, Send) */}
        <ReactionBar
          feedItemId={item.id}
          initialReaction={userReaction}
          initialCount={reactionCount}
          commentCount={item.commentCount}
          onCommentClick={handleNavigateToThread}
          onReactionChange={(nextReaction, nextCount) => {
            setUserReaction(nextReaction);
            setReactionCount(nextCount);
          }}
        />
      </div>
    </article>
  );
}
