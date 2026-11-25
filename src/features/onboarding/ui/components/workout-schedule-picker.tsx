"use client";

import { useMemo, useState } from "react";

import {
  calculateWeeklyScheduleStats,
  MAX_SESSIONS_PER_WEEK,
  MAX_WEEKLY_SLOTS,
} from "../../domain/workout-times-normalizer";
import type { DayOfWeekKey, PreferredWorkoutTimesMap } from "../../domain/workout-times-normalizer";
import { AvailabilityScheduler } from "./scheduler/availability-scheduler";
import { mapToWeekAvailability, weekAvailabilityToMap } from "./scheduler/types";
import type { WeekAvailability } from "./scheduler/types";

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
  const [limitHit, setLimitHit] = useState(false);

  // Convert input value to WeekAvailability
  const weekState = useMemo(() => mapToWeekAvailability(value), [value]);

  // Convert map to metrics
  const mapValue = useMemo(() => weekAvailabilityToMap(weekState), [weekState]);
  const stats = useMemo(() => calculateWeeklyScheduleStats(mapValue), [mapValue]);

  const trainingSessions = Math.min(stats.totalSlotsCount, MAX_SESSIONS_PER_WEEK);
  const recoverySessions = stats.totalSlotsCount - trainingSessions;

  const handleSchedulerChange = (nextWeek: WeekAvailability) => {
    if (disabled) {
      return;
    }
    const nextMap = weekAvailabilityToMap(nextWeek);
    const nextCount = calculateWeeklyScheduleStats(nextMap).totalSlotsCount;
    // Removing slots is always allowed; adding past the cap is not.
    if (nextCount > MAX_WEEKLY_SLOTS && nextCount > stats.totalSlotsCount) {
      setLimitHit(true);
      return;
    }
    setLimitHit(false);
    onChange(nextMap);
  };

  return (
    <div className={`space-y-3 font-body ${className}`} data-testid="workout-schedule-picker">
      {/* Row-by-Row Availability Scheduler */}
      <AvailabilityScheduler value={weekState} onChange={handleSchedulerChange} step={30} />

      {/* Weekly summary: training vs recovery, total time */}
      <div className="px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex flex-wrap items-center gap-2">
          {stats.hasSchedule ? (
            <>
              <span className="font-semibold text-neutral-900">
                {trainingSessions} training {trainingSessions === 1 ? "session" : "sessions"}
              </span>
              {recoverySessions > 0 && (
                <>
                  <span className="text-neutral-300">+</span>
                  <span className="text-emerald-700">
                    {recoverySessions} recovery {recoverySessions === 1 ? "session" : "sessions"}
                  </span>
                </>
              )}
              <span className="text-neutral-300">•</span>
              <span>~{stats.totalHoursPerWeek}h / week</span>
            </>
          ) : (
            <span className="text-amber-700 font-medium">No workout days selected</span>
          )}
        </div>

        <div className="text-[11px] text-neutral-400 font-medium">
          {stats.restDays.length} rest {stats.restDays.length === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Guidance */}
      <p className="text-[11px] leading-relaxed text-neutral-500" data-testid="schedule-guidance">
        Beginners do best with 3–4 sessions a week. Your coach plans up to{" "}
        {MAX_SESSIONS_PER_WEEK} training sessions; any extra slot becomes a 20–30 min recovery
        session (mobility, stretching, easy cardio) so each muscle group gets about 48 hours to
        recover.
      </p>

      {limitHit && (
        <p className="text-xs font-medium text-amber-700" role="status">
          You can pick at most {MAX_WEEKLY_SLOTS} slots a week. Remove one to add another.
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs font-medium text-[var(--color-effort)] mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { AvailabilityScheduler } from "./scheduler/availability-scheduler";
export type { WeekAvailability, DayAvailability, TimeRange, DayKey } from "./scheduler/types";
