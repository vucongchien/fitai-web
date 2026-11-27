// The browser's IANA zone (e.g. "Asia/Ho_Chi_Minh"), "" when unknown. Workout slots are wall
// clock in it, so the profile stores it and the backend schedules and reminds in it.
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}
