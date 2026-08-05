"use client";

import { Calendar, Clock } from "lucide-react";

export type AvailabilitySchedulerProps = {
  selectedDays: string[];
  sessionDurationMin: number;
  preferredTime: string;
  onChangeDays: (days: string[]) => void;
  onChangeDuration: (minutes: number) => void;
  onChangePreferredTime: (time: string) => void;
  disabled?: boolean;
};

const DAYS = [
  { key: "Mon", label: "Mon" },
  { key: "Tue", label: "Tue" },
  { key: "Wed", label: "Wed" },
  { key: "Thu", label: "Thu" },
  { key: "Fri", label: "Fri" },
  { key: "Sat", label: "Sat" },
  { key: "Sun", label: "Sun" },
] as const;

const DURATIONS = [30, 45, 60, 75] as const;
const PRESET_TIMES = ["06:00", "12:00", "18:30", "20:00"] as const;

export function AvailabilityScheduler({
  disabled = false,
  onChangeDays,
  onChangeDuration,
  onChangePreferredTime,
  preferredTime,
  selectedDays,
  sessionDurationMin,
}: AvailabilitySchedulerProps) {
  function toggleDay(dayKey: string) {
    if (disabled) return;
    if (selectedDays.includes(dayKey)) {
      onChangeDays(selectedDays.filter((d) => d !== dayKey));
    } else {
      // Product rule: Maximum 6 training days per week
      if (selectedDays.length >= 6) {
        return;
      }
      onChangeDays([...selectedDays, dayKey]);
    }
  }

  return (
    <div className="availability-scheduler space-y-4 p-4 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)]">
      {/* 1. Training Days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-relay-blue,#4B57F2)]" />
            Training Days ({selectedDays.length}/6 max)
          </label>
          {selectedDays.length >= 6 && (
            <span className="text-[11px] font-semibold text-[var(--color-danger,#C92F42)]">
              Max 6 days per week limit reached
            </span>
          )}
        </div>

        <div aria-label="Select training days" className="grid grid-cols-7 gap-1.5" role="group">
          {DAYS.map((day) => {
            const active = selectedDays.includes(day.key);
            const isLimit = !active && selectedDays.length >= 6;

            return (
              <button
                aria-pressed={active}
                className={`h-11 rounded-[10px] text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                  active
                    ? "bg-[var(--color-relay-blue,#4B57F2)] text-[var(--color-clear-white,#FFFFFF)] border-[var(--color-relay-blue,#4B57F2)] shadow-sm"
                    : isLimit
                      ? "bg-[var(--color-soft-paper,#F7F8F6)] text-[var(--color-steel,#C9CDD1)] border-[var(--color-mist,#ECEEF0)] opacity-60 cursor-not-allowed"
                      : "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-true-ink,#101214)] border-[var(--color-mist,#ECEEF0)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
                }`}
                disabled={disabled || isLimit}
                key={day.key}
                onClick={() => toggleDay(day.key)}
                type="button"
              >
                <span>{day.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Session Duration */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-mist,#ECEEF0)]">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)] block">
          Session Duration
        </label>
        <div aria-label="Select session duration" className="flex flex-wrap gap-2" role="group">
          {DURATIONS.map((dur) => {
            const active = sessionDurationMin === dur;
            return (
              <button
                aria-pressed={active}
                className={`px-3.5 py-2 rounded-[10px] text-xs font-semibold border transition-all ${
                  active
                    ? "bg-[var(--color-blue-tint,#EEF0FF)] text-[var(--color-relay-blue,#4B57F2)] border-[var(--color-relay-blue,#4B57F2)] font-bold"
                    : "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-graphite,#50565C)] border-[var(--color-mist,#ECEEF0)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
                }`}
                disabled={disabled}
                key={dur}
                onClick={() => onChangeDuration(dur)}
                type="button"
              >
                {dur} min
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferred Time */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-mist,#ECEEF0)]">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--color-relay-blue,#4B57F2)]" />
          Preferred Time Slot
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_TIMES.map((time) => {
            const active = preferredTime === time;
            return (
              <button
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-all ${
                  active
                    ? "bg-[var(--color-blue-tint,#EEF0FF)] text-[var(--color-relay-blue,#4B57F2)] border-[var(--color-relay-blue,#4B57F2)] font-bold"
                    : "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-graphite,#50565C)] border-[var(--color-mist,#ECEEF0)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
                }`}
                disabled={disabled}
                key={time}
                onClick={() => onChangePreferredTime(time)}
                type="button"
              >
                {time}
              </button>
            );
          })}

          <input
            aria-label="Custom preferred time"
            className="px-2.5 py-1.5 rounded-[10px] text-xs font-mono border border-[var(--color-mist,#ECEEF0)] bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-true-ink,#101214)] focus:outline-none focus:border-[var(--color-relay-blue,#4B57F2)]"
            disabled={disabled}
            onChange={(e) => onChangePreferredTime(e.target.value)}
            type="time"
            value={preferredTime}
          />
        </div>
      </div>
    </div>
  );
}
