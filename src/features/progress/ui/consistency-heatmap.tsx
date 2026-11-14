"use client";

import { CalendarCheck2 } from "lucide-react";
import { useState } from "react";

import type { HeatmapDay, HeatmapWeek } from "../model/types";

interface ConsistencyHeatmapProps {
  weeks: readonly HeatmapWeek[];
}

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function cellColorClass(intensity: HeatmapDay["intensity"]): string {
  switch (intensity) {
    case 3:
      return "bg-[#16a34a] border-[#15803d]/30";
    case 2:
      return "bg-[#25c77a] border-[#16a34a]/20";
    case 1:
      return "bg-[#86efac] border-[#25c77a]/20";
    default:
      return "bg-neutral-100 border-neutral-200/70";
  }
}

export function ConsistencyHeatmap({ weeks }: ConsistencyHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  const activeDaysCount = weeks.reduce(
    (sum, week) => sum + week.days.filter((d) => d.count > 0).length,
    0,
  );
  const totalSessions = weeks.reduce(
    (sum, week) => sum + week.days.reduce((wSum, d) => wSum + d.count, 0),
    0,
  );

  return (
    <section
      aria-label="Workout consistency heatmap"
      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--color-text)]">
            Workout Consistency
          </h2>
          <p className="text-xs text-neutral-500">
            {totalSessions > 0
              ? `${totalSessions} workouts across ${activeDaysCount} active days in the last ${weeks.length} weeks`
              : `Last ${weeks.length} weeks — complete a workout to light up your calendar`}
          </p>
        </div>

        <CalendarCheck2
          aria-hidden="true"
          className="text-[var(--color-recovery-strong)]"
          size={18}
        />
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* Month labels row */}
          <div className="flex items-center pl-7 gap-1.5 text-[10px] font-medium text-neutral-400 h-4">
            {weeks.map((week) => (
              <div key={week.weekIndex} className="w-5 shrink-0 text-left">
                {week.monthLabel ?? ""}
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Weekday labels column */}
            <div className="flex flex-col gap-1.5 pr-1 text-[10px] text-neutral-400">
              {WEEKDAY_LABELS.map((label, idx) => (
                <div key={idx} className="h-5 flex items-center justify-end w-5">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            {weeks.map((week) => (
              <div key={week.weekIndex} className="flex flex-col gap-1.5 shrink-0">
                {week.days.map((day) => {
                  const isSelected = selectedDay?.date === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      onMouseEnter={() => setSelectedDay(day)}
                      aria-label={`${day.dayLabel}: ${day.count} workouts`}
                      className={`h-5 w-5 rounded-[5px] border transition-transform cursor-pointer ${cellColorClass(
                        day.intensity,
                      )} ${isSelected ? "ring-2 ring-neutral-900 scale-105" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Day Inspector + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-neutral-500">
        <span className="min-h-[1rem]">
          {selectedDay ? (
            selectedDay.count > 0 ? (
              <strong className="font-semibold text-[var(--color-text)]">
                {selectedDay.dayLabel} · {selectedDay.count}{" "}
                {selectedDay.count === 1 ? "workout" : "workouts"} (~{selectedDay.totalMinutes} min)
              </strong>
            ) : (
              <span>{selectedDay.dayLabel} · Rest day</span>
            )
          ) : (
            <span>Tap or hover any square to inspect</span>
          )}
        </span>

        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="h-3 w-3 rounded-[3px] bg-neutral-100 border border-neutral-200/70" />
          <span className="h-3 w-3 rounded-[3px] bg-[#86efac]" />
          <span className="h-3 w-3 rounded-[3px] bg-[#25c77a]" />
          <span className="h-3 w-3 rounded-[3px] bg-[#16a34a]" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
