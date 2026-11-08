import { ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

import type { LeaderboardEntryVM } from "../model/leaderboard.types";

interface LeaderboardRowProps {
  entry: LeaderboardEntryVM;
  isWeekly?: boolean;
  currentUserRef?: (node: HTMLElement | null) => void;
}

export function LeaderboardRow({ entry, isWeekly = false, currentUserRef }: LeaderboardRowProps) {
  const avatarSrc =
    entry.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.displayName)}&background=random`;

  const href = entry.userId
    ? entry.isCurrentUser
      ? "/profile"
      : `/community/users/${entry.userId}`
    : undefined;

  const isPromotionZone = isWeekly && entry.rank <= 10;

  const innerContent = (
    <>
      {/* Rank Number */}
      <div className="w-8 sm:w-9 text-center shrink-0">
        <span
          className={cn(
            "text-[14px] sm:text-[15px] font-data font-bold leading-none",
            entry.isCurrentUser
              ? "text-action font-black"
              : entry.rank <= 10
                ? "text-neutral-900"
                : "text-neutral-400",
          )}
        >
          #{entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className={cn(
          "relative size-10 sm:size-11 rounded-full overflow-hidden shrink-0 bg-neutral-100 ring-1 ring-neutral-200",
          entry.isCurrentUser && "ring-2 ring-action",
        )}
      >
        <Image
          src={avatarSrc}
          alt={entry.displayName}
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 truncate leading-snug group-hover:text-action transition-colors">
            {entry.displayName}
          </span>
          {entry.isCurrentUser && (
            <span className="px-1.5 py-0.2 bg-action text-white text-[9px] font-bold tracking-wider rounded-full shrink-0">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md leading-none">
            Lv.{entry.level}
          </span>
          {isPromotionZone && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full leading-none">
              <ArrowUp className="size-2.5 text-emerald-600" />
              Promotion
            </span>
          )}
        </div>
      </div>

      {/* XP Points */}
      <div className="text-right shrink-0">
        <span className="text-[13px] sm:text-[14px] font-data font-bold text-neutral-900 leading-none">
          {entry.xp.toLocaleString()}
        </span>
        <span className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-0.5">
          XP
        </span>
      </div>
    </>
  );

  const containerClasses = cn(
    "flex items-center gap-3 sm:gap-3.5 p-3 rounded-2xl border transition-all group",
    entry.isCurrentUser
      ? "border-action/30 bg-action-soft/40 ring-1 ring-action/20 shadow-2xs"
      : "border-neutral-200/70 bg-white hover:border-neutral-300 hover:shadow-xs shadow-2xs active:scale-[0.99]",
  );

  return (
    <div
      id={entry.isCurrentUser ? "current-user-leaderboard-entry" : undefined}
      ref={entry.isCurrentUser ? currentUserRef : undefined}
      role="listitem"
      className="w-full"
    >
      {href ? (
        <Link
          href={href}
          aria-label={`View profile of ${entry.displayName}, rank ${entry.rank}`}
          className={cn(
            containerClasses,
            "w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-action",
          )}
        >
          <div className="flex items-center gap-3 sm:gap-3.5 w-full">{innerContent}</div>
        </Link>
      ) : (
        <div
          aria-label={`Rank ${entry.rank}: ${entry.displayName}, ${entry.xp.toLocaleString()} XP`}
          className={containerClasses}
        >
          {innerContent}
        </div>
      )}
    </div>
  );
}
