/**
 * Calculates consecutive calendar training streak days based on workout session history.
 */
export function calculateConsecutiveStreakDays(
  sessions: Array<{
    date?: { seconds?: bigint | number } | string;
    startedAt?: { seconds?: bigint | number } | string;
    endedAt?: { seconds?: bigint | number } | string;
  }>,
): number {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const sessionDates = new Set<string>();
  for (const s of sessions) {
    let d: Date | null = null;
    if (s.date) {
      if (typeof s.date === "object" && "seconds" in s.date) {
        d = new Date(Number(s.date.seconds) * 1000);
      } else if (typeof s.date === "string") {
        d = new Date(s.date);
      }
    } else if (s.endedAt) {
      if (typeof s.endedAt === "object" && "seconds" in s.endedAt) {
        d = new Date(Number(s.endedAt.seconds) * 1000);
      } else if (typeof s.endedAt === "string") {
        d = new Date(s.endedAt);
      }
    } else if (s.startedAt) {
      if (typeof s.startedAt === "object" && "seconds" in s.startedAt) {
        d = new Date(Number(s.startedAt.seconds) * 1000);
      } else if (typeof s.startedAt === "string") {
        d = new Date(s.startedAt);
      }
    }
    if (d && !isNaN(d.getTime())) {
      // Format as YYYY-MM-DD in local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      sessionDates.add(`${year}-${month}-${day}`);
    }
  }

  if (sessionDates.size === 0) {
    return 0;
  }

  const today = new Date();
  const getLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = getLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  // If user hasn't trained today or yesterday, streak is broken (0)
  if (!sessionDates.has(todayStr) && !sessionDates.has(yesterdayStr)) {
    return 0;
  }

  // Count backwards from current active date
  let streak = 0;
  const cursor = sessionDates.has(todayStr) ? new Date(today) : new Date(yesterday);

  while (true) {
    const dateStr = getLocalDateStr(cursor);
    if (sessionDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
