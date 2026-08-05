import { Check, Moon, Salad } from "lucide-react";

import type { WeeklyActivityDay } from "../model/types";

type ConsistencyHeatmapProps = {
  days: WeeklyActivityDay[];
};

export function ConsistencyHeatmap({ days }: ConsistencyHeatmapProps) {
  return (
    <div className="bento-card bento-card--heatmap p-5 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
            Weekly Activity & Nutrition
          </span>
          <span className="text-xs text-[var(--color-graphite,#50565C)]">This Week</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => {
            const isCompleted = day.status === "completed";
            const isRecovery = day.status === "recovery";
            const nutritionOnTrack = day.nutritionStatus === "completed";

            return (
              <div className="flex flex-col items-center gap-1.5" key={day.date}>
                <span className="text-[11px] font-semibold text-[var(--color-graphite,#50565C)]">
                  {day.dayLabel}
                </span>

                <div className="relative">
                  {/* Nutrition Adherence Badge on Top Right */}
                  {nutritionOnTrack && (
                    <div
                      aria-label="Nutrition goal met"
                      className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-field-green,#25C77A)] text-[var(--color-field-green,#25C77A)] flex items-center justify-center shadow-xs"
                      title="Nutrition goal on track"
                    >
                      <Salad className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Workout Day Circle */}
                  <div
                    aria-label={`${day.dayLabel}: ${day.status}${day.sessionTitle ? ` (${day.sessionTitle})` : ""}${nutritionOnTrack ? " · Nutrition met" : ""}`}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-[var(--color-graphite,#50565C)] pt-3 mt-3 border-t border-[var(--color-mist,#ECEEF0)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-field-green,#25C77A)] inline-block" />
          Workout
        </span>
        <span className="flex items-center gap-1 font-medium text-[var(--color-field-green,#25C77A)]">
          <Salad className="w-3 h-3" />
          Nutrition on track
        </span>
      </div>
    </div>
  );
}
