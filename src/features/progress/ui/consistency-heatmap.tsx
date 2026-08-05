import { Check, Moon } from "lucide-react";

import type { WeeklyActivityDay } from "../model/types";

type ConsistencyHeatmapProps = {
  days: WeeklyActivityDay[];
};

export function ConsistencyHeatmap({ days }: ConsistencyHeatmapProps) {
  return (
    <div className="bento-card bento-card--heatmap p-5 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
          Weekly Activity
        </span>
        <span className="text-xs text-[var(--color-graphite,#50565C)]">This Week</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const isCompleted = day.status === "completed";
          const isRecovery = day.status === "recovery";

          return (
            <div className="flex flex-col items-center gap-1.5" key={day.date}>
              <span className="text-[11px] font-semibold text-[var(--color-graphite,#50565C)]">{day.dayLabel}</span>
              <div
                aria-label={`${day.dayLabel}: ${day.status}${day.sessionTitle ? ` (${day.sessionTitle})` : ""}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-[var(--color-green-tint,#EAFBF2)] text-[var(--color-field-green,#25C77A)] border border-[var(--color-field-green,#25C77A)]"
                    : isRecovery
                      ? "bg-[var(--color-mist,#ECEEF0)] text-[var(--color-graphite,#50565C)] border border-[var(--color-steel,#C9CDD1)]"
                      : "bg-[var(--color-soft-paper,#F7F8F6)] text-[var(--color-steel,#C9CDD1)] border border-[var(--color-mist,#ECEEF0)]"
                }`}
                title={day.sessionTitle ?? day.status}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isRecovery ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-steel,#C9CDD1)]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
