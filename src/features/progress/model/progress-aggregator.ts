import type { BodyMetricEntry, HeatmapDay, HeatmapWeek, MetricKey, PersonalRecord } from "./types";

export function calculateAdherencePercentage(completed: number, scheduled: number): number {
  if (scheduled <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((completed / scheduled) * 100));
}

export function formatVolumeKg(volumeKg: number): string {
  if (volumeKg >= 1000) {
    return `${(volumeKg / 1000).toFixed(1).replace(/\.0$/, "")}t`;
  }
  return `${volumeKg.toLocaleString("en-US")} kg`;
}

export function getTopPersonalRecords(records: PersonalRecord[], limit = 3): PersonalRecord[] {
  return records
    .toSorted((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, limit);
}

export function computeBmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function classifyBmi(bmi: number): {
  label: string;
  tone: "recovery" | "action" | "effort";
} {
  if (bmi <= 0) {
    return { label: "Not set", tone: "action" };
  }
  if (bmi < 18.5) {
    return { label: "Underweight", tone: "action" };
  }
  if (bmi < 25) {
    return { label: "Healthy", tone: "recovery" };
  }
  if (bmi < 30) {
    return { label: "Overweight", tone: "effort" };
  }
  return { label: "High", tone: "effort" };
}

export function computeBodyComposition(
  weightKg: number,
  bodyFatPercent: number,
): { leanMassKg: number; fatMassKg: number } {
  if (weightKg <= 0 || bodyFatPercent <= 0 || bodyFatPercent >= 100) {
    return { leanMassKg: Math.max(0, Math.round(weightKg * 10) / 10), fatMassKg: 0 };
  }
  const fatMassKg = Math.round(weightKg * (bodyFatPercent / 100) * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;
  return { leanMassKg, fatMassKg };
}

export function isSafePhotoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function formatShortDate(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrDate.slice(0, 10) || "—";
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export interface RawPeriodicMetric {
  id: string;
  weightKg: number;
  bodyFatPercent: number;
  progressPhotoUrl: string;
  loggedAt: string;
  heightCm: number;
}

export function mapPeriodicMetricsToEntries(
  metrics: readonly RawPeriodicMetric[],
  fallbackHeightCm = 0,
): BodyMetricEntry[] {
  return metrics
    .map((m) => {
      const heightCm = m.heightCm > 0 ? m.heightCm : fallbackHeightCm;
      const weightKg = Math.round(m.weightKg * 10) / 10;
      const bodyFatPercent = Math.round(m.bodyFatPercent * 10) / 10;
      const { leanMassKg, fatMassKg } = computeBodyComposition(weightKg, bodyFatPercent);
      return {
        id: m.id,
        loggedAt: m.loggedAt,
        dateLabel: formatShortDate(m.loggedAt),
        weightKg,
        bodyFatPercent,
        heightCm,
        bmi: computeBmi(weightKg, heightCm),
        leanMassKg,
        fatMassKg,
        progressPhotoUrl: isSafePhotoUrl(m.progressPhotoUrl) ? m.progressPhotoUrl.trim() : "",
      };
    })
    .toSorted((a, b) => {
      const timeA = new Date(a.loggedAt).getTime();
      const timeB = new Date(b.loggedAt).getTime();
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        return a.loggedAt.localeCompare(b.loggedAt);
      }
      return timeA - timeB;
    });
}

export function summarizeMetricTrend(
  entries: readonly BodyMetricEntry[],
  metric: MetricKey,
  targetValue?: number,
): string {
  const valid = entries.filter((e) => e[metric] > 0);
  const unit = metric === "weightKg" ? "kg" : "%";
  const label = metric === "weightKg" ? "weight" : "body fat";

  if (valid.length === 0) {
    return `No ${label} check-ins yet — log your first check-in to start tracking.`;
  }

  const latest = valid[valid.length - 1];
  if (valid.length === 1) {
    if (targetValue && targetValue > 0) {
      const gap = Math.round((latest[metric] - targetValue) * 10) / 10;
      if (Math.abs(gap) < 0.2) {
        return `Latest ${label} is ${latest[metric]} ${unit} — right on your target.`;
      }
      return `Latest ${label} is ${latest[metric]} ${unit} (${Math.abs(gap)} ${unit} ${gap > 0 ? "above" : "below"} your ${targetValue} ${unit} goal).`;
    }
    return `1 check-in logged at ${latest[metric]} ${unit}. Log one more to see your trend.`;
  }

  const first = valid[0];
  const delta = Math.round((latest[metric] - first[metric]) * 10) / 10;
  const absDelta = Math.abs(delta);

  const direction =
    absDelta < 0.1 ? "Steady" : delta < 0 ? `Down ${absDelta} ${unit}` : `Up ${absDelta} ${unit}`;

  const spanText = `across ${valid.length} check-ins`;

  if (targetValue && targetValue > 0) {
    const remaining = Math.round((latest[metric] - targetValue) * 10) / 10;
    if (Math.abs(remaining) < 0.2) {
      return `${direction} ${spanText} — you've reached your ${targetValue} ${unit} goal.`;
    }
    return `${direction} ${spanText} — ${Math.abs(remaining)} ${unit} away from your ${targetValue} ${unit} goal.`;
  }

  return `${direction} ${spanText} (currently ${latest[metric]} ${unit}).`;
}

export interface RawWorkoutSessionForHeatmap {
  date?: { seconds?: bigint | number } | string;
  startedAt?: { seconds?: bigint | number } | string;
  completedAt?: { seconds?: bigint | number } | string;
  durationMinutes?: number;
  totalVolume?: number;
  totalSets?: number;
  status?: string;
}

function toIsoDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveSessionDateKey(session: RawWorkoutSessionForHeatmap): string | null {
  const raw = session.date ?? session.completedAt ?? session.startedAt;
  if (!raw) {
    return null;
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : toIsoDateKey(d);
  }
  if (typeof raw === "object" && raw.seconds !== undefined) {
    const secs = Number(raw.seconds);
    if (!Number.isFinite(secs) || secs <= 0) {
      return null;
    }
    return toIsoDateKey(new Date(secs * 1000));
  }
  return null;
}

export function buildConsistencyHeatmap(
  sessions: readonly RawWorkoutSessionForHeatmap[],
  referenceDate: Date = new Date(),
  weeks = 12,
): HeatmapWeek[] {
  const byDate = new Map<string, { count: number; totalMinutes: number }>();

  for (const session of sessions) {
    const status = (session.status || "").toUpperCase();
    if (status && status !== "COMPLETED" && status !== "SESSION_STATUS_COMPLETED") {
      continue;
    }
    const key = resolveSessionDateKey(session);
    if (!key) {
      continue;
    }
    const estimatedMinutes =
      session.durationMinutes ??
      (session.totalSets && session.totalSets > 0 ? Math.max(15, session.totalSets * 3) : 30);
    const prev = byDate.get(key) ?? { count: 0, totalMinutes: 0 };
    byDate.set(key, {
      count: prev.count + 1,
      totalMinutes: prev.totalMinutes + Math.max(0, estimatedMinutes),
    });
  }

  // Align grid so the last column ends on the Sunday of referenceDate's week (Mon-Sun rows)
  const refUtc = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  const dayOfWeek = (refUtc.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  const endSunday = new Date(refUtc);
  endSunday.setUTCDate(refUtc.getUTCDate() + (6 - dayOfWeek));

  const totalDays = weeks * 7;
  const startMonday = new Date(endSunday);
  startMonday.setUTCDate(endSunday.getUTCDate() - (totalDays - 1));

  const result: HeatmapWeek[] = [];
  let lastMonth = "";

  for (let w = 0; w < weeks; w++) {
    const days: HeatmapDay[] = [];
    let weekMonthLabel: string | undefined;

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startMonday);
      cellDate.setUTCDate(startMonday.getUTCDate() + w * 7 + d);
      const dateKey = toIsoDateKey(cellDate);
      const monthName = cellDate.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
      if (d === 0 && monthName !== lastMonth) {
        weekMonthLabel = monthName;
        lastMonth = monthName;
      }

      const entry = byDate.get(dateKey);
      const count = entry?.count ?? 0;
      const totalMinutes = entry?.totalMinutes ?? 0;

      let intensity: 0 | 1 | 2 | 3 = 0;
      if (count >= 2 || totalMinutes >= 60) {
        intensity = 3;
      } else if (count === 1 && totalMinutes >= 35) {
        intensity = 2;
      } else if (count >= 1) {
        intensity = 1;
      }

      days.push({
        date: dateKey,
        dayLabel: cellDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        count,
        totalMinutes,
        intensity,
      });
    }

    result.push({
      weekIndex: w,
      monthLabel: weekMonthLabel,
      days,
    });
  }

  return result;
}
