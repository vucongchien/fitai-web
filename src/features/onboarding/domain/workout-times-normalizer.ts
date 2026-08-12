/**
 * Workout Times Normalizer & Schedule Engine
 * Clean, iOS-style, minimal schedule management for Onboarding and Profile.
 */

export type DayOfWeekKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DayOfWeekConfig {
  key: DayOfWeekKey;
  shortLabel: string;
  label: string;
  fullLabel: string;
  order: number;
}

export const DAYS_OF_WEEK: DayOfWeekConfig[] = [
  { key: "mon", shortLabel: "M", label: "Mon", fullLabel: "Monday", order: 1 },
  { key: "tue", shortLabel: "T", label: "Tue", fullLabel: "Tuesday", order: 2 },
  { key: "wed", shortLabel: "W", label: "Wed", fullLabel: "Wednesday", order: 3 },
  { key: "thu", shortLabel: "T", label: "Thu", fullLabel: "Thursday", order: 4 },
  { key: "fri", shortLabel: "F", label: "Fri", fullLabel: "Friday", order: 5 },
  { key: "sat", shortLabel: "S", label: "Sat", fullLabel: "Saturday", order: 6 },
  { key: "sun", shortLabel: "S", label: "Sun", fullLabel: "Sunday", order: 7 },
];

export type PreferredWorkoutTimesMap = Partial<Record<DayOfWeekKey, string[]>>;

export interface SlotPreset {
  id: string;
  label: string;
  timeRange: string; // E.g. "06:00-07:30"
  durationMinutes: number;
}

export const COMMON_SLOT_PRESETS: SlotPreset[] = [
  {
    id: "early_morning",
    label: "Early (06:00 - 07:30)",
    timeRange: "06:00-07:30",
    durationMinutes: 90,
  },
  {
    id: "morning",
    label: "Morning (07:30 - 09:00)",
    timeRange: "07:30-09:00",
    durationMinutes: 90,
  },
  {
    id: "lunch",
    label: "Noon (11:30 - 13:00)",
    timeRange: "11:30-13:00",
    durationMinutes: 90,
  },
  {
    id: "evening",
    label: "Evening (17:30 - 19:00)",
    timeRange: "17:30-19:00",
    durationMinutes: 90,
  },
  {
    id: "night",
    label: "Night (19:30 - 21:00)",
    timeRange: "19:30-21:00",
    durationMinutes: 90,
  },
];

export type WeeklyPresetId =
  | "MWF_EVENING"
  | "MWF_MORNING"
  | "TTS_MORNING"
  | "UPPER_LOWER_4DAY"
  | "WEEKDAYS_5DAY"
  | "WEEKEND_FOCUS"
  | "CLEAR";

export interface WeeklyPresetConfig {
  id: WeeklyPresetId;
  label: string;
  shortLabel: string;
  schedule: PreferredWorkoutTimesMap;
}

export const WEEKLY_PRESETS: WeeklyPresetConfig[] = [
  {
    id: "MWF_EVENING",
    label: "Mon • Wed • Fri (PM)",
    shortLabel: "Mon-Wed-Fri PM",
    schedule: {
      mon: ["17:30-19:00"],
      wed: ["17:30-19:00"],
      fri: ["17:30-19:00"],
    },
  },
  {
    id: "MWF_MORNING",
    label: "Mon • Wed • Fri (AM)",
    shortLabel: "Mon-Wed-Fri AM",
    schedule: {
      mon: ["06:00-07:30"],
      wed: ["06:00-07:30"],
      fri: ["06:00-07:30"],
    },
  },
  {
    id: "TTS_MORNING",
    label: "Tue • Thu • Sat (AM)",
    shortLabel: "Tue-Thu-Sat AM",
    schedule: {
      tue: ["06:00-07:30"],
      thu: ["06:00-07:30"],
      sat: ["06:00-07:30"],
    },
  },
  {
    id: "UPPER_LOWER_4DAY",
    label: "4 Days (M, Tu, Th, F)",
    shortLabel: "4 Days Split",
    schedule: {
      mon: ["18:00-19:30"],
      tue: ["18:00-19:30"],
      thu: ["18:00-19:30"],
      fri: ["18:00-19:30"],
    },
  },
  {
    id: "WEEKDAYS_5DAY",
    label: "Weekdays (Mon - Fri)",
    shortLabel: "5 Days (M-F)",
    schedule: {
      mon: ["17:30-19:00"],
      tue: ["17:30-19:00"],
      wed: ["17:30-19:00"],
      thu: ["17:30-19:00"],
      fri: ["17:30-19:00"],
    },
  },
  {
    id: "WEEKEND_FOCUS",
    label: "Wed • Sat • Sun",
    shortLabel: "Weekend Focus",
    schedule: {
      wed: ["19:30-21:00"],
      sat: ["08:00-09:30"],
      sun: ["08:00-09:30"],
    },
  },
];

/**
 * Calculates slot duration in minutes from "HH:mm-HH:mm" (e.g. "06:00-07:30" => 90 mins)
 */
export function calculateSlotDurationMinutes(slotStr: string, defaultMinutes = 60): number {
  if (!slotStr || typeof slotStr !== "string") {
    return defaultMinutes;
  }

  const parts = slotStr.trim().split("-");
  if (parts.length !== 2) {
    if (slotStr.includes("AM") || slotStr.includes("PM")) {
      return 60;
    }
    return defaultMinutes;
  }

  const [startStr, endStr] = parts;
  const startMinutes = parseTimeToMinutes(startStr);
  const endMinutes = parseTimeToMinutes(endStr);

  if (startMinutes === null || endMinutes === null) {
    return defaultMinutes;
  }

  let diff = endMinutes - startMinutes;
  if (diff <= 0) {
    diff += 24 * 60;
  }

  return diff > 0 && diff <= 360 ? diff : defaultMinutes;
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) {return null;}
  const cleaned = timeStr.trim();
  const [hourStr, minStr] = cleaned.split(":");
  const hours = parseInt(hourStr, 10);
  const mins = minStr === undefined ? 0 : parseInt(minStr, 10);

  if (isNaN(hours) || isNaN(mins) || hours < 0 || hours > 23 || mins < 0 || mins > 59) {
    return null;
  }

  return hours * 60 + mins;
}

/**
 * Validates start and end time (HH:mm)
 */
export function validateTimeSlot(
  startTime: string,
  endTime: string,
): { isValid: boolean; message?: string; durationMinutes?: number } {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  if (startMin === null || endMin === null) {
    return { isValid: false, message: "Invalid time format (HH:mm)" };
  }

  let duration = endMin - startMin;
  if (duration <= 0) {
    duration += 24 * 60;
  }

  if (duration < 20) {
    return { isValid: false, message: "Minimum workout duration is 20 minutes" };
  }

  if (duration > 240) {
    return { isValid: false, message: "Workout duration should not exceed 4 hours" };
  }

  return { isValid: true, durationMinutes: duration };
}

/**
 * Normalizes day abbreviation to DayOfWeekKey ("mon", "tue", etc.)
 */
export function normalizeDayKey(rawDay: string): DayOfWeekKey | null {
  if (!rawDay || typeof rawDay !== "string") {return null;}
  const cleaned = rawDay.trim().toLowerCase();

  if (cleaned.startsWith("mon") || cleaned === "t2" || cleaned === "m" || cleaned === "monday") {
    return "mon";
  }
  if (cleaned.startsWith("tue") || cleaned === "t3" || cleaned === "tu" || cleaned === "tuesday") {
    return "tue";
  }
  if (cleaned.startsWith("wed") || cleaned === "t4" || cleaned === "w" || cleaned === "wednesday") {
    return "wed";
  }
  if (cleaned.startsWith("thu") || cleaned === "t5" || cleaned === "th" || cleaned === "thursday") {
    return "thu";
  }
  if (cleaned.startsWith("fri") || cleaned === "t6" || cleaned === "f" || cleaned === "friday") {
    return "fri";
  }
  if (cleaned.startsWith("sat") || cleaned === "t7" || cleaned === "sa" || cleaned === "saturday") {
    return "sat";
  }
  if (cleaned.startsWith("sun") || cleaned === "cn" || cleaned === "su" || cleaned === "sunday" || cleaned.startsWith("chủ")) {
    return "sun";
  }

  return null;
}

/**
 * Universal Normalizer:
 * Converts any input format (Key-Value map, string array "mon:06:00-07:30", legacy array ["Mon PM"])
 * into clean PreferredWorkoutTimesMap.
 */
export function normalizeWorkoutTimes(input: unknown): PreferredWorkoutTimesMap {
  const result: PreferredWorkoutTimesMap = {};

  if (!input) {
    return result;
  }

  // Case 1: Object / Record Key-Value
  if (typeof input === "object" && !Array.isArray(input)) {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const dayKey = normalizeDayKey(key);
      if (!dayKey) {continue;}

      if (Array.isArray(value)) {
        const validSlots = value
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .map((v) => normalizeSlotTime(v));
        if (validSlots.length > 0) {
          result[dayKey] = [...new Set(validSlots)];
        }
      } else if (typeof value === "string" && value.trim().length > 0) {
        result[dayKey] = [normalizeSlotTime(value)];
      }
    }
    return result;
  }

  // Case 2: Array format
  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item !== "string") {continue;}
      const trimmed = item.trim();
      if (!trimmed) {continue;}

      // 2.1: JSON stringified map
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const nested = normalizeWorkoutTimes(parsed);
          for (const [d, slots] of Object.entries(nested) as [DayOfWeekKey, string[]][]) {
            result[d] = [...new Set([...result[d] || [], ...slots])];
          }
          continue;
        } catch {
          // Ignore json parse error
        }
      }

      // 2.2: Format "mon:06:00-07:30"
      if (trimmed.includes(":") && (trimmed.includes("-") || trimmed.length > 5)) {
        const colonIdx = trimmed.indexOf(":");
        const prefix = trimmed.slice(0, colonIdx);
        const dayKey = normalizeDayKey(prefix);

        if (dayKey) {
          const slot = normalizeSlotTime(trimmed.slice(colonIdx + 1));
          result[dayKey] = [...new Set([...result[dayKey] || [], slot])];
          continue;
        }
      }

      // 2.3: Legacy format "Mon PM", "Wed AM"
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx > 0) {
        const dayPart = trimmed.slice(0, spaceIdx);
        const timePart = trimmed.slice(spaceIdx + 1).trim();
        const dayKey = normalizeDayKey(dayPart);

        if (dayKey) {
          const slot = normalizeLegacySlot(timePart);
          result[dayKey] = [...new Set([...result[dayKey] || [], slot])];
          continue;
        }
      }

      // 2.4: Day name only
      const dayKeyOnly = normalizeDayKey(trimmed);
      if (dayKeyOnly) {
        result[dayKeyOnly] = [...new Set([...result[dayKeyOnly] || [], '17:30-19:00'])];
      }
    }
  }

  return result;
}

function normalizeSlotTime(slotStr: string): string {
  const cleaned = slotStr.trim();
  if (cleaned.includes("-")) {
    return cleaned;
  }
  return normalizeLegacySlot(cleaned);
}

function normalizeLegacySlot(legacyStr: string): string {
  const upper = legacyStr.trim().toUpperCase();
  if (upper === "AM" || upper.includes("MORNING")) {
    return "06:00-07:30";
  }
  if (upper === "PM" || upper.includes("EVENING") || upper.includes("NIGHT")) {
    return "17:30-19:00";
  }
  if (upper === "LUNCH" || upper.includes("NOON")) {
    return "11:30-13:00";
  }
  if (/^\d{1,2}:\d{2}$/.test(legacyStr)) {
    const startMin = parseTimeToMinutes(legacyStr);
    if (startMin !== null) {
      const endMin = (startMin + 90) % (24 * 60);
      const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
      const endM = String(endMin % 60).padStart(2, "0");
      return `${legacyStr}-${endH}:${endM}`;
    }
  }
  return "17:30-19:00";
}

/**
 * Serializes PreferredWorkoutTimesMap to protobuf string array format
 * e.g. ["mon:06:00-07:30", "wed:17:30-19:00"]
 */
export function formatWorkoutTimesToProto(map: PreferredWorkoutTimesMap): string[] {
  const normalized = normalizeWorkoutTimes(map);
  const result: string[] = [];

  for (const day of DAYS_OF_WEEK) {
    const slots = normalized[day.key];
    if (slots && slots.length > 0) {
      for (const slot of slots) {
        result.push(`${day.key}:${slot}`);
      }
    }
  }

  if (result.length === 0) {
    return ["mon:17:30-19:00", "wed:17:30-19:00", "fri:17:30-19:00"];
  }

  return result;
}

export function formatWorkoutTimesToAgentJson(map: PreferredWorkoutTimesMap): string {
  const normalized = normalizeWorkoutTimes(map);
  return JSON.stringify(normalized);
}

export interface WeeklyScheduleStats {
  activeDaysCount: number;
  totalSlotsCount: number;
  avgDurationMinutes: number;
  totalHoursPerWeek: number;
  activeDays: DayOfWeekKey[];
  restDays: DayOfWeekKey[];
  hasSchedule: boolean;
}

/**
 * Calculates schedule metrics for live feedback
 */
export function calculateWeeklyScheduleStats(map: PreferredWorkoutTimesMap): WeeklyScheduleStats {
  const normalized = normalizeWorkoutTimes(map);
  const activeDays: DayOfWeekKey[] = [];
  const restDays: DayOfWeekKey[] = [];
  let totalSlots = 0;
  let totalMinutes = 0;

  for (const day of DAYS_OF_WEEK) {
    const slots = normalized[day.key];
    if (slots && slots.length > 0) {
      activeDays.push(day.key);
      totalSlots += slots.length;
      for (const slot of slots) {
        totalMinutes += calculateSlotDurationMinutes(slot);
      }
    } else {
      restDays.push(day.key);
    }
  }

  const activeDaysCount = activeDays.length;
  const avgDurationMinutes = totalSlots > 0 ? Math.round(totalMinutes / totalSlots) : 0;
  const totalHoursPerWeek = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    activeDaysCount,
    totalSlotsCount: totalSlots,
    avgDurationMinutes,
    totalHoursPerWeek,
    activeDays,
    restDays,
    hasSchedule: activeDaysCount > 0,
  };
}

/**
 * Applies a preset schedule
 */
export function applyWeeklyPreset(presetId: WeeklyPresetId): PreferredWorkoutTimesMap {
  if (presetId === "CLEAR") {
    return {};
  }
  const preset = WEEKLY_PRESETS.find((p) => p.id === presetId);
  return preset ? JSON.parse(JSON.stringify(preset.schedule)) : {};
}

/**
 * Copies slots from one day to all other active training days
 */
export function copySlotsToOtherActiveDays(
  map: PreferredWorkoutTimesMap,
  sourceDay: DayOfWeekKey,
): PreferredWorkoutTimesMap {
  const sourceSlots = map[sourceDay];
  if (!sourceSlots || sourceSlots.length === 0) {
    return { ...map };
  }

  const updated: PreferredWorkoutTimesMap = { ...map };
  for (const day of DAYS_OF_WEEK) {
    if (day.key !== sourceDay && updated[day.key] && (updated[day.key]?.length ?? 0) > 0) {
      updated[day.key] = [...sourceSlots];
    }
  }

  return updated;
}
