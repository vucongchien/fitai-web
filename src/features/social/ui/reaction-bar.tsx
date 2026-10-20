"use client";

import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";

import { hapticFeedback } from "@/shared/lib/haptic-feedback";
import { reactTargetAction } from "../server/social-actions";
import type { ReactionType } from "../model/social.types";

interface Props {
  feedItemId: string;
  initialReaction: ReactionType;
  initialCount: number;
  commentCount: number;
  onCommentClick?: () => void;
  onReactionChange?: (reaction: ReactionType, count: number) => void;
}

function formatSocialCount(num: number): string {
  if (!num || typeof num !== "number" || num <= 0) return "";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(".", ",") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(".", ",") + "K";
  }
  return num.toString();
}

export function ReactionBar({
  feedItemId,
  initialReaction = "",
  initialCount = 0,
  commentCount = 0,
  onCommentClick,
  onReactionChange,
}: Props) {
  const [current, setCurrent] = useState<ReactionType>(initialReaction);
  const [count, setCount] = useState(initialCount ?? 0);
  const [repostCount, setRepostCount] = useState(0);
  const [isReposted, setIsReposted] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLiked = current === "LIKE" || current === "FIRE" || current === "MUSCLE" || current === "CLAP";

  async function handleToggleLike() {
    if (pending) return;

    hapticFeedback.repSuccess();

    const nextLiked = !isLiked;
    const prevCurrent = current;
    const prevCount = count;
    const nextCurrent: ReactionType = nextLiked ? "LIKE" : "";
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setCurrent(nextCurrent);
    setCount(nextCount);
    onReactionChange?.(nextCurrent, nextCount);

    setPending(true);
    try {
      const res = await reactTargetAction(feedItemId, "LIKE");
      if (!res.success) {
        setCurrent(prevCurrent);
        setCount(prevCount);
        onReactionChange?.(prevCurrent, prevCount);
        return;
      }
      const authoritativeReaction = (res.currentReaction ?? "") as ReactionType;
      setCurrent(authoritativeReaction);
      if (typeof res.reactionCount === "number" && res.reactionCount > 0) {
        setCount(res.reactionCount);
        onReactionChange?.(authoritativeReaction, res.reactionCount);
      }
    } catch {
      setCurrent(prevCurrent);
      setCount(prevCount);
      onReactionChange?.(prevCurrent, prevCount);
    } finally {
      setPending(false);
    }
  }

  function handleToggleRepost() {
    hapticFeedback.repSuccess();
    const next = !isReposted;
    setIsReposted(next);
    setRepostCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
  }

  function handleShare() {
    hapticFeedback.repSuccess();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/social/posts/${feedItemId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mt-2.5 -ml-2 flex items-center gap-5 text-neutral-800">
      {/* 1. Like / Heart */}
      <button
        type="button"
        aria-label={isLiked ? "Unlike" : "Like"}
        disabled={pending}
        onClick={handleToggleLike}
        className="group flex items-center gap-1.5 p-2 rounded-full hover:bg-neutral-50 active:scale-80 transition-all duration-150"
      >
        <Heart
          size={19}
          strokeWidth={1.9}
          className={[
            "transition-colors duration-150",
            isLiked ? "fill-red-500 text-red-500 scale-105" : "text-neutral-900 group-hover:text-red-500",
          ].join(" ")}
        />
        {count > 0 && (
          <span
            className={[
              "text-xs font-medium tracking-tight",
              isLiked ? "text-red-500 font-semibold" : "text-neutral-600",
            ].join(" ")}
          >
            {formatSocialCount(count)}
          </span>
        )}
      </button>

      {/* 2. Comment */}
      <button
        type="button"
        aria-label="Comments"
        onClick={() => {
          hapticFeedback.repSuccess();
          onCommentClick?.();
        }}
        className="group flex items-center gap-1.5 p-2 rounded-full hover:bg-neutral-50 active:scale-80 transition-all duration-150"
      >
        <MessageCircle
          size={19}
          strokeWidth={1.9}
          className="text-neutral-900 group-hover:text-neutral-600"
        />
        {commentCount > 0 && (
          <span className="text-xs font-medium text-neutral-600 tracking-tight">
            {formatSocialCount(commentCount)}
          </span>
        )}
      </button>

      {/* 3. Repost */}
      <button
        type="button"
        aria-label="Repost"
        onClick={handleToggleRepost}
        className="group flex items-center gap-1.5 p-2 rounded-full hover:bg-neutral-50 active:scale-80 transition-all duration-150"
      >
        <Repeat2
          size={19}
          strokeWidth={1.9}
          className={[
            "transition-colors duration-150",
            isReposted ? "text-emerald-500" : "text-neutral-900 group-hover:text-emerald-600",
          ].join(" ")}
        />
        {repostCount > 0 && (
          <span
            className={[
              "text-xs font-medium tracking-tight",
              isReposted ? "text-emerald-500 font-semibold" : "text-neutral-600",
            ].join(" ")}
          >
            {formatSocialCount(repostCount)}
          </span>
        )}
      </button>

      {/* 4. Share / Send */}
      <button
        type="button"
        aria-label="Share"
        onClick={handleShare}
        className="group relative flex items-center gap-1.5 p-2 rounded-full hover:bg-neutral-50 active:scale-80 transition-all duration-150"
      >
        <Send
          size={18}
          strokeWidth={1.9}
          className="text-neutral-900 -rotate-12 group-hover:text-neutral-600"
        />
        {copied && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-md">
            Link copied!
          </span>
        )}
      </button>
    </div>
  );
}
