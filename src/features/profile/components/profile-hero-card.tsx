import { Dumbbell, Flame, Trophy, Zap } from "lucide-react";
import Image from "next/image";

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
        <Image
          src={user.avatarUrl}
          alt={user.name}
          fill
          priority
          sizes="80px"
          className="rounded-full object-cover ring-2 ring-[var(--color-action)] ring-offset-2 ring-offset-[var(--color-canvas)]"
        />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-action)] text-[11px] font-bold text-white shadow-xs">
          {user.level}
        </span>
      </div>

      {/* User Name */}
      <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)] font-display">
        {user.name}
      </h2>

      {/* Sub-line: Level & Best PR */}
      <div className="mt-1 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-text)]">
          <Trophy className="h-3.5 w-3.5 text-amber-500" /> Level {user.level}
        </span>
        <span className="text-[var(--color-border)]">•</span>
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-action)]">
          {bestPr ? `${bestPr.exerciseName} ${bestPr.weightKg}kg` : "No PR yet"}
        </span>
      </div>

      {/* 3 Quick Stats Row - Flat Blend */}
      <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--color-border)] border-y border-[var(--color-border)] py-3 text-center">
        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-text)] data-value">
            <Dumbbell className="h-4 w-4 text-[var(--color-action)]" />
            {stats.totalWorkouts}
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Workouts</span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-text)] data-value">
            <Zap className="h-4 w-4 text-[var(--color-recovery-strong)]" />
            {stats.activeStreakDays} days
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Streak</span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-text)] data-value">
            <Flame className="h-4 w-4 text-[var(--color-effort)]" />
            {formattedKcal}
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Burned</span>
        </div>
      </div>
    </div>
  );
}
