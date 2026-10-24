import { Award, ChevronRight, Flame, Shield, Target, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { BadgeItemVM } from "../model/gamification.types";

interface ProfileAchievementsCardProps {
  badges: BadgeItemVM[];
  totalUnlocked?: number;
  totalAvailable?: number;
}

function renderBadgeVisual(badge: BadgeItemVM, index: number) {
  if (badge.iconUrl) {
    return (
      <div className="relative h-16 w-16 min-w-16 shrink-0 rounded-2xl overflow-hidden shadow-xs border border-neutral-100 flex items-center justify-center bg-neutral-50">
        <Image
          src={badge.iconUrl}
          alt={badge.name}
          width={48}
          height={48}
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  const code = (badge.badgeCode || "").toUpperCase();
  const cat = (badge.category || "").toUpperCase();

  let bg = "bg-emerald-500";
  let icon = <Target className="h-7 w-7 text-white mt-0.5" />;
  let level = "LEVEL 1";

  if (code.includes("STREAK") || cat.includes("STREAK") || index === 0) {
    bg = "bg-red-500";
    icon = <Flame className="h-7 w-7 text-amber-300 fill-amber-300 mt-0.5" />;
    level = "LEVEL 5";
  } else if (code.includes("XP") || code.includes("LEVEL") || cat.includes("LEVEL") || index === 1) {
    bg = "bg-emerald-500";
    icon = <Zap className="h-7 w-7 text-white mt-0.5 fill-white" />;
    level = "LEVEL 7";
  } else if (code.includes("LEAGUE") || code.includes("LEADERBOARD") || cat.includes("LEADERBOARD") || index === 2) {
    bg = "bg-purple-500";
    icon = <Shield className="h-7 w-7 text-amber-300 fill-amber-300 mt-0.5" />;
    level = "LEVEL 7";
  } else if (code.includes("WORKOUT") || cat.includes("WORKOUT")) {
    bg = "bg-emerald-500";
    icon = <Trophy className="h-7 w-7 text-amber-200 fill-amber-200 mt-0.5" />;
    level = "LEVEL 4";
  }

  return (
    <div
      className={`relative h-16 w-16 min-w-16 shrink-0 rounded-2xl ${bg} flex flex-col items-center justify-between p-2 shadow-xs`}
    >
      {icon}
      <span className="text-[10px] font-black text-white uppercase tracking-wider">
        {level}
      </span>
    </div>
  );
}

export function ProfileAchievementsCard({
  badges,
}: ProfileAchievementsCardProps) {
  return (
    <div className="w-full">
      <h2 className="text-[20px] font-extrabold text-neutral-800 mb-3 px-1">
        Achievements
      </h2>

      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs divide-y divide-neutral-100 overflow-hidden">
        {badges.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Award className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
            <p className="text-[14px] font-semibold text-neutral-700">No achievements yet</p>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Train consistently and keep your streak alive to unlock badges.
            </p>
          </div>
        ) : (
          badges.slice(0, 3).map((badge, idx) => {
            const target = badge.progressTarget > 0 ? badge.progressTarget : 1;
            const current = Math.min(target, badge.progressCurrent);
            const percent = Math.min(100, Math.round((current / target) * 100));

            return (
              <div key={badge.badgeCode} className="flex items-center gap-4 p-4">
                {renderBadgeVisual(badge, idx)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[16px] font-bold text-neutral-800 truncate">
                      {badge.name}
                    </h4>
                    <span className="text-[14px] font-semibold text-neutral-400 shrink-0">
                      {badge.progressCurrent}/{badge.progressTarget}
                    </span>
                  </div>

                  {/* Refined golden progress bar matching Image 1 */}
                  <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-neutral-200/80">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="text-[13px] font-medium text-neutral-500 mt-1.5 truncate">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <Link
          href="/profile/badges"
          className="flex items-center justify-between px-5 py-4 text-left font-bold text-neutral-800 hover:bg-neutral-50 transition-colors group cursor-pointer"
        >
          <span className="text-[15px] group-hover:text-neutral-900">View all</span>
          <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 stroke-[2.5]" />
        </Link>
      </div>
    </div>
  );
}
