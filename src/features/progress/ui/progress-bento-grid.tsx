"use client";

import { AlertCircle, RefreshCw, Trophy } from "lucide-react";

import type { UserProgressStats } from "../model/types";
import { ConsistencyHeatmap } from "./consistency-heatmap";
import { PersonalRecordsCard } from "./personal-records-card";
import { StreakCard } from "./streak-card";

type ProgressBentoGridProps = {
  stats?: UserProgressStats | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function ProgressBentoGrid({ isError = false, isLoading = false, onRetry, stats }: ProgressBentoGridProps) {
  // 1. Loading State
  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Loading progress stats" className="space-y-4 my-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
          Your Progress & Consistency
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-[14px] bg-[var(--color-mist,#ECEEF0)] animate-pulse" />
          <div className="h-32 rounded-[14px] bg-[var(--color-mist,#ECEEF0)] animate-pulse" />
        </div>
      </section>
    );
  }

  // 2. Error State
  if (isError || !stats) {
    return (
      <section aria-label="Progress stats error" className="my-4">
        <div className="p-5 rounded-[14px] bg-[var(--color-coral-tint,#FFF0ED)] border border-[var(--color-sprint-coral,#FF5A47)] flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-6 h-6 text-[var(--color-danger,#C92F42)]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--color-true-ink,#101214)]">Unable to load progress data</h3>
            <p className="text-xs text-[var(--color-graphite,#50565C)] mt-1">
              Check your connection or try refreshing your stats.
            </p>
          </div>
          {onRetry && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[10px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-steel,#C9CDD1)] text-[var(--color-true-ink,#101214)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
              onClick={onRetry}
              type="button"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </button>
          )}
        </div>
      </section>
    );
  }

  // 3. Empty State (0 workouts completed)
  if (stats.totalWorkoutsCompleted === 0) {
    return (
      <section aria-label="Progress stats empty" className="my-4">
        <div className="p-5 rounded-[14px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)] flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-blue-tint,#EEF0FF)] flex items-center justify-center text-[var(--color-relay-blue,#4B57F2)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-true-ink,#101214)]">Start your progress journey</h3>
            <p className="text-xs text-[var(--color-graphite,#50565C)] max-w-xs mt-1">
              Complete your first session on the Roadmap to unlock consistency streak, personal records, and weekly activity.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 4. Success State
  return (
    <section aria-label="User progress and consistency" className="progress-bento-section my-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
          Your Progress & Evidence
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StreakCard stats={stats} />
        <ConsistencyHeatmap days={stats.weeklyActivity} />
      </div>

      <PersonalRecordsCard nutrition={stats.weeklyNutrition} records={stats.personalRecords} />
    </section>
  );
}
