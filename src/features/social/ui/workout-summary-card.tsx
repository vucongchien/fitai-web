import { Dumbbell, Flame, Timer } from "lucide-react";

import type { WorkoutMetricsVM } from "../model/social.types";

interface Props {
  data: WorkoutMetricsVM;
}

export function WorkoutSummaryCard({ data }: Props) {
  const minutes = Math.floor(data.durationSeconds / 60);
  const volumeStr =
    data.totalVolumeKg >= 1000
      ? `${(data.totalVolumeKg / 1000).toFixed(1)}t`
      : `${data.totalVolumeKg.toFixed(0)}kg`;

  return (
    <div className="mt-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3 transition-colors hover:bg-neutral-50">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
          Workout
        </span>
        <span className="text-xs font-medium text-neutral-400">{minutes}m session</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-neutral-900 leading-snug">{data.workoutTitle}</p>
      <div className="mt-2.5 flex items-center gap-4 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1 font-medium">
          <Timer size={13} className="text-neutral-400" />
          {minutes}m
        </span>
        <span className="inline-flex items-center gap-1 font-medium">
          <Dumbbell size={13} className="text-neutral-400" />
          {data.totalSets} sets
        </span>
        <span className="inline-flex items-center gap-1 font-medium">
          <Flame size={13} className="text-amber-500" />
          {volumeStr}
        </span>
      </div>
    </div>
  );
}
