/**
 * Day-key normalization.
 *
 * The wire uses two different date carriers and they are not directly comparable:
 *   - `WorkoutSessionSummary.date` is a `google.protobuf.Timestamp`
 *   - `SessionPlan.scheduled_date` / `DayPlan.scheduled_date` are `google.type.Date`
 *   - `MealLogItem.logged_at` is a plain `string` with no format declared in the proto
 *
 * Everything collapses to a `YYYY-MM-DD` key before comparison or grouping.
 */

export type DayKey = string;

export type TimestampLike = {
  seconds: bigint | number;
};

export type CalendarDateLike = {
  day: number;
  month: number;
  year: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Formats a `Date` as a UTC day key. */
export function toDayKey(date: Date): DayKey | null {
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** `google.protobuf.Timestamp` → day key. */
export function dayKeyFromTimestamp(timestamp: TimestampLike | undefined): DayKey | null {
  if (!timestamp) return null;
  const seconds = Number(timestamp.seconds);
  if (!Number.isFinite(seconds)) return null;
  return toDayKey(new Date(seconds * 1000));
}

/** `google.type.Date` → day key. Guards the proto default of all-zero fields. */
export function dayKeyFromCalendarDate(date: CalendarDateLike | undefined): DayKey | null {
  if (!date || !date.year || !date.month || !date.day) return null;
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/**
 * `MealLogItem.logged_at` → day key.
 *
 * The proto declares no format, so accept an ISO-ish timestamp and fall back to the
 * leading `YYYY-MM-DD` when the value does not parse as a date.
 */
export function dayKeyFromLoggedAt(loggedAt: string | undefined): DayKey | null {
  if (!loggedAt) return null;

  const parsed = new Date(loggedAt);
  if (!Number.isNaN(parsed.getTime())) return toDayKey(parsed);

  const leading = /^(\d{4}-\d{2}-\d{2})/.exec(loggedAt);
  return leading?.[1] ?? null;
}

/** Minutes since midnight, for ordering a day's meals. Unparseable values sort last. */
export function minutesOfDay(loggedAt: string | undefined): number {
  if (!loggedAt) return Number.MAX_SAFE_INTEGER;

  const parsed = new Date(loggedAt);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getUTCHours() * 60 + parsed.getUTCMinutes();
  }

  const clock = /(\d{1,2}):(\d{2})/.exec(loggedAt);
  if (!clock) return Number.MAX_SAFE_INTEGER;
  return Number(clock[1]) * 60 + Number(clock[2]);
}

/** Formats a day key as a short clock label, e.g. "07:30". */
export function clockLabel(loggedAt: string | undefined): string | null {
  const minutes = minutesOfDay(loggedAt);
  if (minutes === Number.MAX_SAFE_INTEGER) return null;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Inclusive list of day keys ending at `endKey`, oldest first. */
export function dayKeyRange(endKey: DayKey, length: number): DayKey[] {
  const end = new Date(`${endKey}T00:00:00Z`);
  if (Number.isNaN(end.getTime()) || length <= 0) return [];

  const keys: DayKey[] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = toDayKey(day);
    if (key) keys.push(key);
  }
  return keys;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Short weekday label for a day key, e.g. "Mon". */
export function weekdayLabel(key: DayKey): string | null {
  const date = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return WEEKDAY_LABELS[date.getUTCDay()] ?? null;
}
