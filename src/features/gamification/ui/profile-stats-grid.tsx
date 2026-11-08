import { Award, Dumbbell, Flame, Zap } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

import type { ProfileStatsVM } from "../model/gamification.types";

interface ProfileStatsGridProps {
  stats: ProfileStatsVM;
}

export function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  const items = [
    {
      id: "streak",
      label: "Day streak",
      value: stats.streakDays.toString(),
      icon: <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />,
      bg: "bg-amber-500/10",
      href: undefined,
    },
    {
      id: "xp",
      label: "Total XP",
      value: stats.totalXp.toLocaleString(),
      icon: <Zap className="h-5 w-5 text-indigo-500 fill-indigo-500" />,
      bg: "bg-indigo-500/10",
      href: undefined,
    },
    {
      id: "workouts",
      label: "Workouts completed",
      value: stats.completedWorkouts.toString(),
      icon: <Dumbbell className="h-5 w-5 text-emerald-500" />,
      bg: "bg-emerald-500/10",
      href: undefined,
    },
    {
      id: "rank",
      label: "League rank",
      value: stats.leaderboardRank ? `#${stats.leaderboardRank}` : "--",
      icon: <Award className="h-5 w-5 text-amber-500" />,
      bg: "bg-amber-500/10",
      href: "/leaderboard",
    },
  ];

  return (
    <div className="w-full">
      <div className="text-[13px] font-bold tracking-wider text-neutral-400 uppercase mb-3 px-1">
        STATISTICS
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const content = (
            <div
              className={cn(
                "flex items-center gap-3.5 p-3.5 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs transition-all",
                item.href
                  ? "hover:border-action/40 hover:shadow-xs group cursor-pointer"
                  : "hover:shadow-xs",
              )}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg}`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <div className="text-[17px] font-bold text-neutral-900 leading-tight truncate">
                    {item.value}
                  </div>
                  {item.href && (
                    <span className="text-[11px] text-action font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  )}
                </div>
                <div className="text-[12px] font-medium text-neutral-500 leading-tight mt-0.5 truncate">
                  {item.label}
                </div>
              </div>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-2xl"
                aria-label={`View ${item.label}: ${item.value}`}
              >
                {content}
              </Link>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
