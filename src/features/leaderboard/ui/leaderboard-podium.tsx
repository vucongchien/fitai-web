import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

import type { LeaderboardEntryVM } from "../model/leaderboard.types";

interface LeaderboardPodiumProps {
  podium: LeaderboardEntryVM[];
  currentUserRef?: (node: HTMLElement | null) => void;
}

export function LeaderboardPodium({ podium, currentUserRef }: LeaderboardPodiumProps) {
  if (!podium || podium.length === 0) {
    return null;
  }

  // Positional assignment: Top 1 (Gold) in center, Top 2 (Silver) on left, Top 3 (Bronze) on right
  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  const getAvatar = (entry: LeaderboardEntryVM) =>
    entry.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.displayName)}&background=random`;

  const getProfileHref = (entry: LeaderboardEntryVM) =>
    entry.userId ? (entry.isCurrentUser ? "/profile" : `/community/users/${entry.userId}`) : "#";

  return (
    <div aria-label="Top 3 podium" className="w-full max-w-[440px] mx-auto px-4 pt-4 pb-2">
      <div className="flex items-end justify-center gap-2 sm:gap-3.5">
        {/* Rank 2 (Silver) */}
        {second ? (
          <div
            id={second.isCurrentUser ? "current-user-leaderboard-entry" : undefined}
            ref={second.isCurrentUser ? currentUserRef : undefined}
            className="flex-1 flex flex-col items-center min-w-0"
          >
            <Link
              href={getProfileHref(second)}
              className="group flex flex-col items-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-xl p-1"
              aria-label={`View profile of ${second.displayName}, rank ${second.rank}`}
            >
              <div className="relative mb-2 flex flex-col items-center">
                <span
                  aria-label="Silver Medal"
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm z-10"
                >
                  🥈
                </span>
                <div
                  className={cn(
                    "relative size-13 sm:size-15 rounded-full overflow-hidden bg-neutral-100 ring-2 ring-slate-300 shadow-2xs group-hover:scale-105 transition-transform",
                    second.isCurrentUser && "ring-3 ring-action",
                  )}
                >
                  <Image
                    src={getAvatar(second)}
                    alt={second.displayName}
                    fill
                    sizes="60px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {second.isCurrentUser && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-action text-white text-[9px] font-bold tracking-wider rounded-full shadow-2xs">
                    YOU
                  </span>
                )}
              </div>

              <div className="w-full text-center mb-2 px-1">
                <p className="text-[13px] font-bold text-neutral-900 group-hover:text-action truncate leading-snug transition-colors">
                  {second.displayName}
                </p>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight">
                  Lv.{second.level}
                </p>
                <p className="text-[12px] font-bold text-slate-700 font-data leading-tight mt-0.5">
                  {second.xp.toLocaleString()} <span className="text-[10px]">XP</span>
                </p>
              </div>
            </Link>

            <div className="w-full h-22 sm:h-24 bg-gradient-to-b from-slate-200/60 via-slate-100/40 to-slate-50/20 border-t-2 border-slate-300 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-2xs">
              <span className="text-[18px] sm:text-[20px] font-black text-slate-500 font-data leading-none">
                #{second.rank}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                SILVER
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 opacity-0 pointer-events-none" />
        )}

        {/* Rank 1 (Gold - Highest) */}
        {first ? (
          <div
            id={first.isCurrentUser ? "current-user-leaderboard-entry" : undefined}
            ref={first.isCurrentUser ? currentUserRef : undefined}
            className="flex-1 flex flex-col items-center min-w-0 z-10"
          >
            <Link
              href={getProfileHref(first)}
              className="group flex flex-col items-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-xl p-1"
              aria-label={`View profile of champion ${first.displayName}, rank ${first.rank}`}
            >
              <div className="relative mb-2 flex flex-col items-center">
                <span
                  aria-label="Champion Crown"
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl drop-shadow-xs animate-bounce"
                >
                  👑
                </span>
                <div
                  className={cn(
                    "relative size-16 sm:size-19 rounded-full overflow-hidden bg-neutral-100 ring-3 ring-amber-400 shadow-sm group-hover:scale-105 transition-transform",
                    first.isCurrentUser && "ring-4 ring-action",
                  )}
                >
                  <Image
                    src={getAvatar(first)}
                    alt={first.displayName}
                    fill
                    sizes="76px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {first.isCurrentUser && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-action text-white text-[9px] font-bold tracking-wider rounded-full shadow-2xs">
                    YOU
                  </span>
                )}
              </div>

              <div className="w-full text-center mb-2 px-1">
                <p className="text-[14px] sm:text-[15px] font-bold text-neutral-900 group-hover:text-action truncate leading-snug transition-colors">
                  {first.displayName}
                </p>
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-tight">
                  Lv.{first.level}
                </p>
                <p className="text-[13px] sm:text-[14px] font-bold text-amber-600 font-data leading-tight mt-0.5">
                  {first.xp.toLocaleString()} <span className="text-[10px]">XP</span>
                </p>
              </div>
            </Link>

            <div className="w-full h-28 sm:h-32 bg-gradient-to-b from-amber-200/70 via-amber-100/40 to-amber-50/20 border-t-2 border-amber-400 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-xs">
              <span className="text-[22px] sm:text-[24px] font-black text-amber-600 font-data leading-none">
                #{first.rank}
              </span>
              <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest mt-1">
                GOLD
              </span>
            </div>
          </div>
        ) : null}

        {/* Rank 3 (Bronze) */}
        {third ? (
          <div
            id={third.isCurrentUser ? "current-user-leaderboard-entry" : undefined}
            ref={third.isCurrentUser ? currentUserRef : undefined}
            className="flex-1 flex flex-col items-center min-w-0"
          >
            <Link
              href={getProfileHref(third)}
              className="group flex flex-col items-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-xl p-1"
              aria-label={`View profile of ${third.displayName}, rank ${third.rank}`}
            >
              <div className="relative mb-2 flex flex-col items-center">
                <span
                  aria-label="Bronze Medal"
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm z-10"
                >
                  🥉
                </span>
                <div
                  className={cn(
                    "relative size-12 sm:size-14 rounded-full overflow-hidden bg-neutral-100 ring-2 ring-amber-700/40 shadow-2xs group-hover:scale-105 transition-transform",
                    third.isCurrentUser && "ring-3 ring-action",
                  )}
                >
                  <Image
                    src={getAvatar(third)}
                    alt={third.displayName}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {third.isCurrentUser && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-action text-white text-[9px] font-bold tracking-wider rounded-full shadow-2xs">
                    YOU
                  </span>
                )}
              </div>

              <div className="w-full text-center mb-2 px-1">
                <p className="text-[13px] font-bold text-neutral-900 group-hover:text-action truncate leading-snug transition-colors">
                  {third.displayName}
                </p>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight">
                  Lv.{third.level}
                </p>
                <p className="text-[12px] font-bold text-amber-800 font-data leading-tight mt-0.5">
                  {third.xp.toLocaleString()} <span className="text-[10px]">XP</span>
                </p>
              </div>
            </Link>

            <div className="w-full h-18 sm:h-20 bg-gradient-to-b from-amber-700/20 via-amber-700/10 to-amber-900/5 border-t-2 border-amber-600/70 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-2xs">
              <span className="text-[17px] sm:text-[19px] font-black text-amber-800 font-data leading-none">
                #{third.rank}
              </span>
              <span className="text-[9px] font-bold text-amber-700/80 uppercase tracking-widest mt-1">
                BRONZE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
