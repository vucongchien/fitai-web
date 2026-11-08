import { ArrowUp, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

import type { LeaderboardEntryVM } from "../model/leaderboard.types";

interface LeaderboardMyStandingProps {
  standing: LeaderboardEntryVM | null;
  hidden?: boolean;
  isWeekly?: boolean;
}

export function LeaderboardMyStanding({
  standing,
  hidden = false,
  isWeekly = false,
}: LeaderboardMyStandingProps) {
  // Common transition and styling classes ensuring hardware acceleration and smooth transitions
  const floatingContainerClasses = cn(
    "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-6 left-0 md:left-[4.5rem] lg:left-[16rem] right-0 z-30 pointer-events-none px-4",
    "transition-[transform,opacity,visibility] [transition-behavior:allow-discrete] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-[transform,opacity]",
    hidden
      ? "opacity-0 translate-y-6 invisible pointer-events-none"
      : "opacity-100 translate-y-0 visible pointer-events-none",
  );

  if (!standing || standing.rank <= 0) {
    return (
      <div aria-hidden={hidden} className={floatingContainerClasses}>
        <div className="max-w-[580px] mx-auto pointer-events-auto">
          <div className="flex items-center gap-3 sm:gap-3.5 p-3 rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md shadow-float hover:shadow-md transition-all">
            {/* Rank column matching LeaderboardRow */}
            <div className="w-8 sm:w-9 text-center shrink-0">
              <span className="text-[14px] sm:text-[15px] font-data font-bold text-neutral-400 leading-none">
                --
              </span>
            </div>

            {/* Flame Icon as Avatar Replacement */}
            <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
              <Flame className="size-5 fill-amber-500" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] sm:text-[15px] font-bold text-neutral-900 truncate leading-snug">
                Unranked yet
              </p>
              <p className="text-[11px] font-medium text-neutral-500 truncate mt-0.5">
                Complete your next workout to enter rankings
              </p>
            </div>

            {/* Action */}
            <Link
              href="/roadmap"
              className="px-3.5 py-1.5 rounded-xl bg-action text-white text-[12px] font-bold tracking-tight shrink-0 shadow-2xs hover:bg-action/90 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
            >
              Train Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc =
    standing.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(standing.displayName)}&background=random`;

  const isPromotionZone = isWeekly && standing.rank <= 10;

  return (
    <div aria-hidden={hidden} className={floatingContainerClasses}>
      <div className="max-w-[580px] mx-auto pointer-events-auto">
        <Link
          href="/profile"
          aria-label={`View your profile: ${standing.displayName}, rank ${standing.rank}`}
          className="group block p-3 rounded-2xl border border-action/30 bg-white/95 backdrop-blur-md shadow-float ring-1 ring-action/20 hover:border-action/50 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 w-full">
            {/* Rank Number - EXACT match to LeaderboardRow */}
            <div className="w-8 sm:w-9 text-center shrink-0">
              <span className="text-[14px] sm:text-[15px] font-data font-black text-action leading-none">
                #{standing.rank}
              </span>
            </div>

            {/* Avatar - EXACT match to LeaderboardRow */}
            <div className="relative size-10 sm:size-11 rounded-full overflow-hidden shrink-0 bg-neutral-100 ring-2 ring-action group-hover:scale-105 transition-transform">
              <Image
                src={avatarSrc}
                alt={standing.displayName}
                fill
                sizes="44px"
                className="object-cover"
                unoptimized
              />
            </div>

            {/* User Info - EXACT match to LeaderboardRow */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900 group-hover:text-action truncate leading-snug transition-colors">
                  {standing.displayName}
                </span>
                <span className="px-1.5 py-0.2 bg-action text-white text-[9px] font-bold tracking-wider rounded-full shrink-0">
                  YOU
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md leading-none">
                  Lv.{standing.level}
                </span>
                {isPromotionZone && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full leading-none">
                    <ArrowUp className="size-2.5 text-emerald-600" />
                    Promotion
                  </span>
                )}
              </div>
            </div>

            {/* XP Points - EXACT match to LeaderboardRow */}
            <div className="text-right shrink-0">
              <span className="text-[13px] sm:text-[14px] font-data font-bold text-neutral-900 leading-none">
                {standing.xp.toLocaleString()}
              </span>
              <span className="block text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-0.5">
                XP
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
