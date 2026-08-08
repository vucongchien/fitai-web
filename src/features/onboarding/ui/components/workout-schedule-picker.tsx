"use client";

import { useMemo } from "react";
import {
  AvailabilityScheduler,
} from "./scheduler/availability-scheduler";
import {
  type WeekAvailability,
  mapToWeekAvailability,
  weekAvailabilityToMap,
} from "./scheduler/types";
import {
  type DayOfWeekKey,
  type PreferredWorkoutTimesMap,
  calculateWeeklyScheduleStats,
} from "../../domain/workout-times-normalizer";

interface WorkoutSchedulePickerProps {
  value: Partial<Record<DayOfWeekKey, string[]>> | string[] | Record<string, string[]> | undefined;
  onChange: (updated: PreferredWorkoutTimesMap) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function WorkoutSchedulePicker({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: WorkoutSchedulePickerProps) {
  // Convert input value to WeekAvailability
  const weekState = useMemo(() => mapToWeekAvailability(value), [value]);

  // Convert map to metrics
  const mapValue = useMemo(() => weekAvailabilityToMap(weekState), [weekState]);
  const stats = useMemo(() => calculateWeeklyScheduleStats(mapValue), [mapValue]);

  const handleSchedulerChange = (nextWeek: WeekAvailability) => {
    if (disabled) return;
    const nextMap = weekAvailabilityToMap(nextWeek);
    onChange(nextMap);
  };

  return (
    <div
      className={`space-y-3 font-body ${className}`}
      data-testid="workout-schedule-picker"
    >
      {/* Row-by-Row Availability Scheduler */}
      <AvailabilityScheduler
        value={weekState}
        onChange={handleSchedulerChange}
        step={30}
      />

      {/* Minimal Single-Line Stats Summary */}
      <div className="px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          {stats.hasSchedule ? (
            <>
              <span className="font-semibold text-neutral-900">
                {stats.activeDaysCount} {stats.activeDaysCount === 1 ? "day" : "days"} / week
              </span>
              <span className="text-neutral-300">•</span>
              <span>{stats.totalSlotsCount} {stats.totalSlotsCount === 1 ? "session" : "sessions"}</span>
              <span className="text-neutral-300">•</span>
              <span>~{stats.avgDurationMinutes}m avg</span>
            </>
          ) : (
            <span className="text-amber-700 font-medium">No workout days selected</span>
          )}
        </div>

        <div className="text-[11px] text-neutral-400 font-medium">
          {stats.restDays.length} rest {stats.restDays.length === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-rose-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { AvailabilityScheduler } from "./scheduler/availability-scheduler";
export type { WeekAvailability, DayAvailability, TimeRange, DayKey } from "./scheduler/types";
