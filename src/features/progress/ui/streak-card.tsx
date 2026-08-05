import { Flame } from "lucide-react";

import { formatVolumeKg } from "../model/progress-aggregator";
import type { UserProgressStats } from "../model/types";

type StreakCardProps = {
  stats: UserProgressStats;
};

export function StreakCard({ stats }: StreakCardProps) {
  return (
    <div className="bento-card bento-card--streak p-5 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[var(--color-green-tint,#EAFBF2)] flex items-center justify-center text-[var(--color-field-green,#25C77A)]">
            <Flame className="w-5 h-5 fill-current text-[var(--color-field-green,#25C77A)]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
              Consistency Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[var(--color-true-ink,#101214)] tabular-nums">
                {stats.currentStreakDays} days
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-[var(--color-graphite,#50565C)] bg-[var(--color-soft-paper,#F7F8F6)] px-2.5 py-1 rounded-[10px] border border-[var(--color-mist,#ECEEF0)]">
          Best: <strong className="tabular-nums">{stats.bestStreakDays}d</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-mist,#ECEEF0)]">
        <div>
          <span className="text-[11px] font-semibold text-[var(--color-graphite,#50565C)] block">
            Workouts Done
          </span>
          <span className="font-mono text-lg font-bold text-[var(--color-true-ink,#101214)] tabular-nums">
            {stats.totalWorkoutsCompleted}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[var(--color-graphite,#50565C)] block">
            Total Volume
          </span>
          <span className="font-mono text-lg font-bold text-[var(--color-true-ink,#101214)] tabular-nums">
            {formatVolumeKg(stats.totalVolumeKg)}
          </span>
        </div>
      </div>
    </div>
  );
}
