import { Activity, Flame, Scale, TrendingDown, TrendingUp } from "lucide-react";

import { formatVolumeKg } from "../model/progress-aggregator";
import type { BodyMetricEntry } from "../model/types";

interface KpiSummaryCardsProps {
  currentWeightKg: number;
  targetWeightKg: number;
  currentBodyFatPercent: number;
  targetBodyFatPercent: number;
  streakDays: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  adherencePercentage: number;
  entries: readonly BodyMetricEntry[];
}

function computeDelta(entries: readonly BodyMetricEntry[], key: "weightKg" | "bodyFatPercent") {
  const valid = entries.filter((e) => e[key] > 0);
  if (valid.length < 2) {
    return null;
  }
  const first = valid[0][key];
  const last = valid[valid.length - 1][key];
  return Math.round((last - first) * 10) / 10;
}

export function KpiSummaryCards({
  currentWeightKg,
  targetWeightKg,
  currentBodyFatPercent,
  targetBodyFatPercent,
  streakDays,
  totalWorkouts,
  totalVolumeKg,
  adherencePercentage,
  entries,
}: KpiSummaryCardsProps) {
  const weightDelta = computeDelta(entries, "weightKg");
  const bfDelta = computeDelta(entries, "bodyFatPercent");

  return (
    <section aria-label="Key progress metrics" className="grid grid-cols-2 gap-3">
      {/* Weight Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500">Current Weight</span>
          <Scale aria-hidden="true" className="text-[var(--color-action)]" size={16} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <strong className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] tabular-nums">
            {currentWeightKg > 0 ? `${currentWeightKg}` : "—"}
          </strong>
          {currentWeightKg > 0 && <span className="text-xs font-medium text-neutral-500">kg</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
          {weightDelta !== null && Math.abs(weightDelta) >= 0.1 ? (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                weightDelta < 0
                  ? "text-[var(--color-recovery-strong)]"
                  : "text-[var(--color-effort-ink)]"
              }`}
            >
              {weightDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
            </span>
          ) : null}
          {targetWeightKg > 0 ? <span>Goal: {targetWeightKg} kg</span> : <span>Log check-in</span>}
        </div>
      </div>

      {/* Body Fat Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500">Body Fat</span>
          <Activity aria-hidden="true" className="text-[var(--color-effort)]" size={16} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <strong className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] tabular-nums">
            {currentBodyFatPercent > 0 ? `${currentBodyFatPercent}` : "—"}
          </strong>
          {currentBodyFatPercent > 0 && (
            <span className="text-xs font-medium text-neutral-500">%</span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
          {bfDelta !== null && Math.abs(bfDelta) >= 0.1 ? (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                bfDelta < 0
                  ? "text-[var(--color-recovery-strong)]"
                  : "text-[var(--color-effort-ink)]"
              }`}
            >
              {bfDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {bfDelta > 0 ? `+${bfDelta}` : bfDelta}%
            </span>
          ) : null}
          {targetBodyFatPercent > 0 ? (
            <span>Goal: {targetBodyFatPercent}%</span>
          ) : (
            <span>Optional metric</span>
          )}
        </div>
      </div>

      {/* Active Streak Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500">Active Streak</span>
          <Flame aria-hidden="true" className="text-[var(--color-effort)]" size={16} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <strong className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] tabular-nums">
            {streakDays}
          </strong>
          <span className="text-xs font-medium text-neutral-500">
            {streakDays === 1 ? "day" : "days"}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">
          {totalWorkouts} {totalWorkouts === 1 ? "workout" : "workouts"} completed
        </p>
      </div>

      {/* Volume & Adherence Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500">Total Volume</span>
          <span className="rounded-full bg-[var(--color-recovery-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-recovery-ink)]">
            {adherencePercentage}% plan
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <strong className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] tabular-nums">
            {totalVolumeKg > 0 ? formatVolumeKg(totalVolumeKg) : "0 kg"}
          </strong>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">Cumulative weight lifted</p>
      </div>
    </section>
  );
}
