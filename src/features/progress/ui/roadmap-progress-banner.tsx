import { Route } from "lucide-react";

import type { RoadmapAdherence } from "../model/types";

type RoadmapProgressBannerProps = {
  adherence: RoadmapAdherence;
};

export function RoadmapProgressBanner({ adherence }: RoadmapProgressBannerProps) {
  const { adherencePercentage, currentWeek, sessionsCompleted, totalSessionsScheduled, totalWeeks } = adherence;

  return (
    <div className="roadmap-progress-banner p-4 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)] mb-4">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-blue-tint,#EEF0FF)] flex items-center justify-center text-[var(--color-relay-blue,#4B57F2)]">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
              Route Adherence
            </h2>
            <p className="text-xs text-[var(--color-graphite,#50565C)]">
              Week {currentWeek} of {totalWeeks} · <strong className="tabular-nums">{sessionsCompleted}</strong>/
              <span className="tabular-nums">{totalSessionsScheduled}</span> sessions
            </p>
          </div>
        </div>

        <span className="font-mono text-xl font-bold text-[var(--color-relay-blue,#4B57F2)] tabular-nums">
          {adherencePercentage}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-[999px] bg-[var(--color-mist,#ECEEF0)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-relay-blue,#4B57F2)] rounded-[999px] transition-all duration-300"
          style={{ width: `${adherencePercentage}%` }}
        />
      </div>
    </div>
  );
}
