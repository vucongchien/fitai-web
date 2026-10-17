"use client";

import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import type { DayAvailability, DayKey, TimeOption, TimeRange } from "./types";

interface DayRowProps {
  day: DayKey;
  label: string; // 3 letters: "Mon", "Tue", etc.
  state: DayAvailability;
  options: TimeOption[];
  reduce?: boolean;
  depth?: number;
  onChange: (next: DayAvailability) => void;
}

export function DayRow({ day, label, state, options, onChange }: DayRowProps) {
  const handleToggle = () => {
    if (state.enabled) {
      onChange({ enabled: false, ranges: [] });
    } else {
      onChange({
        enabled: true,
        ranges: [{ id: `${day}-${Date.now()}`, start: "17:30", end: "19:00" }],
      });
    }
  };

  const handleAddRange = () => {
    const lastRange = state.ranges.at(-1);
    let nextStart = "19:30";
    let nextEnd = "21:00";

    if (lastRange) {
      const [h, m] = lastRange.end.split(":");
      const nextHour = (parseInt(h || "19", 10) + 1) % 24;
      const endHour = (nextHour + 1) % 24;
      nextStart = `${String(nextHour).padStart(2, "0")}:${m || "00"}`;
      nextEnd = `${String(endHour).padStart(2, "0")}:${m || "30"}`;
    }

    const newRange: TimeRange = {
      id: `${day}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      start: nextStart,
      end: nextEnd,
    };

    onChange({
      ...state,
      ranges: [...state.ranges, newRange],
    });
  };

  const handleUpdateRange = (id: string, field: "start" | "end", value: string) => {
    const updated = state.ranges.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });

    onChange({
      ...state,
      ranges: updated,
    });
  };

  const handleRemoveRange = (id: string) => {
    const updated = state.ranges.filter((r) => r.id !== id);
    if (updated.length === 0) {
      onChange({ enabled: false, ranges: [] });
    } else {
      onChange({ ...state, ranges: updated });
    }
  };

  return (
    <div className="py-2.5 px-3 sm:px-4 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-[var(--color-surface-subtle)]">
      {/* Day Label (3 letters) & iOS Toggle Switch */}
      <div className="flex items-center gap-2.5 w-20 sm:w-24 shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={state.enabled}
          className={cn(
            "w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-action)]",
            state.enabled ? "bg-[var(--color-action)]" : "bg-[var(--color-border)]",
          )}
          aria-label={`Toggle availability for ${label}`}
        >
          <div
            className={cn(
              "w-3.5 h-3.5 rounded-full bg-[var(--color-surface)] shadow-xs transition-transform duration-200 ease-in-out",
              state.enabled ? "translate-x-3.5" : "translate-x-0",
            )}
          />
        </button>

        <span
          className={cn(
            "font-semibold tracking-wide select-none",
            state.enabled ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]",
          )}
        >
          {label}
        </span>
      </div>

      {/* Time Ranges (Inline row) or Rest Day */}
      <div className="flex-1 flex items-center justify-end sm:justify-start gap-2 overflow-x-auto no-scrollbar">
        {state.enabled && state.ranges.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {state.ranges.map((range, index) => (
              <div key={range.id} className="flex items-center gap-1.5 shrink-0">
                {/* Start Time Select */}
                <select
                  value={range.start}
                  onChange={(e) => handleUpdateRange(range.id, "start", e.target.value)}
                  className="h-8.5 px-2.5 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-text)] shadow-2xs focus:outline-none focus:border-[var(--color-action)] cursor-pointer"
                  aria-label={`Start time for ${label}`}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <span className="text-[var(--color-text-muted)] text-xs font-medium">to</span>

                {/* End Time Select */}
                <select
                  value={range.end}
                  onChange={(e) => handleUpdateRange(range.id, "end", e.target.value)}
                  className="h-8.5 px-2.5 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-text)] shadow-2xs focus:outline-none focus:border-[var(--color-action)] cursor-pointer"
                  aria-label={`End time for ${label}`}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Delete Slot Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveRange(range.id)}
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-[var(--radius-input)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                  title="Remove time slot"
                  aria-label="Remove time slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Add Next Slot Button */}
                {index === state.ranges.length - 1 && (
                  <button
                    type="button"
                    onClick={handleAddRange}
                    className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-[var(--radius-input)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
                    title="Add another time window"
                    aria-label="Add another time window"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)] font-medium py-1.5 select-none">Rest</span>
        )}
      </div>
    </div>
  );
}
