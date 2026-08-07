import { Dumbbell, Flame, Trophy, Zap } from "lucide-react";
import type { BestPersonalRecord, ProfileQuickStats, ProfileUser } from "../model/profile.types";

interface ProfileHeroCardProps {
  user: ProfileUser;
  bestPr: BestPersonalRecord | null;
  stats: ProfileQuickStats;
}

export function ProfileHeroCard({ user, bestPr, stats }: ProfileHeroCardProps) {
  const formattedKcal =
    stats.totalCaloriesKcal >= 1000
      ? `${(stats.totalCaloriesKcal / 1000).toFixed(1)}k`
      : `${stats.totalCaloriesKcal}`;

  return (
    <div className="py-2 text-center">
      {/* Avatar Container */}
      <div className="relative mx-auto mb-3 h-20 w-20">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full rounded-full object-cover ring-2 ring-[#4B57F2] ring-offset-2 ring-offset-[#F7F8F6]"
        />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4B57F2] text-[11px] font-bold text-white shadow-xs">
          {user.level}
        </span>
      </div>

      {/* User Name */}
      <h2 className="text-xl font-bold tracking-tight text-[#101214] font-display">
        {user.name}
      </h2>

      {/* Sub-line: Level & Best PR */}
      <div className="mt-1 flex items-center justify-center gap-2 text-xs text-[#50565C]">
        <span className="inline-flex items-center gap-1 font-medium text-[#101214]">
          <Trophy className="h-3.5 w-3.5 text-amber-500" /> Level {user.level}
        </span>
        <span className="text-neutral-300">•</span>
        <span className="inline-flex items-center gap-1 font-medium text-[#4B57F2]">
          {bestPr ? `${bestPr.exerciseName} ${bestPr.weightKg}kg` : "No PR yet"}
        </span>
      </div>

      {/* 3 Quick Stats Row - Flat Blend */}
      <div className="mt-5 grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200/80 py-3 text-center">
        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[#101214] font-mono">
            <Dumbbell className="h-4 w-4 text-[#4B57F2]" />
            {stats.totalWorkouts}
          </span>
          <span className="mt-0.5 text-[11px] text-[#50565C]">Workouts</span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[#101214] font-mono">
            <Zap className="h-4 w-4 text-[#25C77A]" />
            {stats.activeStreakDays} days
          </span>
          <span className="mt-0.5 text-[11px] text-[#50565C]">Streak</span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[#101214] font-mono">
            <Flame className="h-4 w-4 text-[#FF5A47]" />
            {formattedKcal}
          </span>
          <span className="mt-0.5 text-[11px] text-[#50565C]">Burned</span>
        </div>
      </div>
    </div>
  );
}
