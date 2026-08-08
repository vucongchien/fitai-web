/**
 * Availability Scheduler Types & Utilities
 * Clean, iOS-style 3-letter weekday scheduler.
 */

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface WeekdayItem {
  key: DayKey;
  label: string; // 3-letter abbreviation: "Mon", "Tue", ...
  fullLabel: string;
  order: number;
}

export const WEEKDAYS: WeekdayItem[] = [
  { key: "mon", label: "Mon", fullLabel: "Monday", order: 1 },
  { key: "tue", label: "Tue", fullLabel: "Tuesday", order: 2 },
  { key: "wed", label: "Wed", fullLabel: "Wednesday", order: 3 },
  { key: "thu", label: "Thu", fullLabel: "Thursday", order: 4 },
  { key: "fri", label: "Fri", fullLabel: "Friday", order: 5 },
  { key: "sat", label: "Sat", fullLabel: "Saturday", order: 6 },
  { key: "sun", label: "Sun", fullLabel: "Sunday", order: 7 },
];

export interface TimeRange {
  id: string;
  start: string; // e.g. "06:00" or "17:30"
  end: string;   // e.g. "07:30" or "19:00"
}

export interface DayAvailability {
  enabled: boolean;
  ranges: TimeRange[];
}

export type WeekAvailability = Record<DayKey, DayAvailability>;

export interface TimeOption {
  value: string;
  label: string;
}

/**
 * Builds clean time select options (HH:mm) from 05:00 to 22:30 with given minute step
 */
export function buildOptions(step = 30): TimeOption[] {
  const options: TimeOption[] = [];
  const startMin = 5 * 60; // 05:00
  const endMin = 23 * 60;  // 23:00

  for (let min = startMin; min <= endMin; min += step) {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const value = `${hh}:${mm}`;

    options.push({ value, label: value });
  }

  return options;
}

/**
 * Default initial week schedule (Mon, Wed, Fri enabled with 17:30-19:00, rest days disabled)
 */
export function defaultWeek(): WeekAvailability {
  return {
    mon: {
      enabled: true,
      ranges: [{ id: "mon-default", start: "17:30", end: "19:00" }],
    },
    tue: { enabled: false, ranges: [] },
    wed: {
      enabled: true,
      ranges: [{ id: "wed-default", start: "17:30", end: "19:00" }],
    },
    thu: { enabled: false, ranges: [] },
    fri: {
      enabled: true,
      ranges: [{ id: "fri-default", start: "17:30", end: "19:00" }],
    },
    sat: { enabled: false, ranges: [] },
    sun: { enabled: false, ranges: [] },
  };
}

/**
 * Converts WeekAvailability to PreferredWorkoutTimesMap (Record<DayKey, string[]>)
 */
export function weekAvailabilityToMap(week: WeekAvailability): Partial<Record<DayKey, string[]>> {
  const result: Partial<Record<DayKey, string[]>> = {};

  for (const { key } of WEEKDAYS) {
    const day = week[key];
    if (day && day.enabled && day.ranges.length > 0) {
      const validRanges = day.ranges
        .filter((r) => r.start && r.end)
        .map((r) => `${r.start}-${r.end}`);
      if (validRanges.length > 0) {
        result[key] = validRanges;
      }
    }
  }

  return result;
}

/**
 * Converts any PreferredWorkoutTimesMap or array to WeekAvailability
 */
export function mapToWeekAvailability(inputMap: Partial<Record<DayKey, string[]>> | string[] | undefined): WeekAvailability {
  const week: WeekAvailability = {
    mon: { enabled: false, ranges: [] },
    tue: { enabled: false, ranges: [] },
    wed: { enabled: false, ranges: [] },
    thu: { enabled: false, ranges: [] },
    fri: { enabled: false, ranges: [] },
    sat: { enabled: false, ranges: [] },
    sun: { enabled: false, ranges: [] },
  };

  if (!inputMap) {
    return defaultWeek();
  }

  // Array format
  if (Array.isArray(inputMap)) {
    for (const item of inputMap) {
      if (typeof item !== "string") continue;
      const colonIdx = item.indexOf(":");
      if (colonIdx > 0) {
        const dayKey = item.slice(0, colonIdx).trim().toLowerCase() as DayKey;
        const timeRange = item.slice(colonIdx + 1).trim();
        if (week[dayKey]) {
          week[dayKey].enabled = true;
          const [s, e] = timeRange.split("-");
          week[dayKey].ranges.push({
            id: `${dayKey}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            start: s || "17:30",
            end: e || "19:00",
          });
        }
      }
    }
    return Object.values(week).some((d) => d.enabled) ? week : defaultWeek();
  }

  // Record<DayKey, string[]>
  for (const { key } of WEEKDAYS) {
    const slots = inputMap[key];
    if (slots && slots.length > 0) {
      week[key].enabled = true;
      week[key].ranges = slots.map((slotStr, idx) => {
        const [s, e] = slotStr.split("-");
        return {
          id: `${key}-slot-${idx}`,
          start: s || "17:30",
          end: e || "19:00",
        };
      });
    }
  }

  return Object.values(week).some((d) => d.enabled) ? week : defaultWeek();
}
