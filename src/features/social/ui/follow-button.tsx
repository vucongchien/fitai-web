"use client";

import { useState } from "react";

import { followUserAction, unfollowUserAction } from "../server/social-actions";

interface Props {
  targetUserId: string;
  initialIsFollowing: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  className = "",
  onFollowChange,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !isFollowing;
    setIsFollowing(next); // optimistic
    onFollowChange?.(next);
    setPending(true);
    try {
      const res = next
        ? await followUserAction(targetUserId)
        : await unfollowUserAction(targetUserId);
      if (!res.success) {
        setIsFollowing(!next); // rollback
        onFollowChange?.(!next);
      }
    } catch {
      setIsFollowing(!next); // rollback
      onFollowChange?.(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={isFollowing ? "Unfollow" : "Follow"}
      className={[
        "h-9 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-none active:scale-98 flex items-center justify-center",
        isFollowing
          ? "!border !border-solid !border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-50"
          : "bg-neutral-900 text-white hover:bg-neutral-800",
        pending ? "opacity-70 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
