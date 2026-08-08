"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { DayRow } from "./day-row";
import {
  type DayAvailability,
  type DayKey,
  WEEKDAYS,
  type WeekAvailability,
  buildOptions,
  defaultWeek,
} from "./types";

export type {
  DayAvailability,
  DayKey,
  TimeRange,
  WeekAvailability,
} from "./types";
export { defaultWeek } from "./types";

export interface AvailabilitySchedulerProps {
  value?: WeekAvailability;
  defaultValue?: WeekAvailability;
  onChange?: (value: WeekAvailability) => void;
  /** Minutes between selectable times. Default 30. */
  step?: number;
  className?: string;
}

export function AvailabilityScheduler({
  value,
  defaultValue,
  onChange,
  step = 30,
  className,
}: AvailabilitySchedulerProps) {
  const options = useMemo(() => buildOptions(step), [step]);

  const [internal, setInternal] = useState<WeekAvailability>(
    () => defaultValue ?? defaultWeek(),
  );
  const controlled = value !== undefined;
  const week = controlled ? value : internal;

  const commit = useCallback(
    (next: WeekAvailability) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );

  const setDay = useCallback(
    (day: DayKey, next: DayAvailability) => {
      commit({ ...week, [day]: next });
    },
    [commit, week],
  );

  return (
    <div className={cn("w-full max-w-xl divide-y divide-neutral-200 border border-neutral-200 rounded-2xl bg-white shadow-xs overflow-hidden", className)}>
      {WEEKDAYS.map(({ key, label }, i) => (
        <DayRow
          key={key}
          day={key}
          label={label}
          state={week[key] || { enabled: false, ranges: [] }}
          options={options}
          depth={WEEKDAYS.length - i}
          onChange={(next) => setDay(key, next)}
        />
      ))}
    </div>
  );
}
