"use client";

import { Camera, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

import { TrendLineChart, type TrendPoint } from "@/shared/ui/charts/trend-line-chart";

import { summarizeMetricTrend } from "../model/progress-aggregator";
import type { BodyMetricEntry, MetricKey, ProgressNutritionSummary } from "../model/types";

interface MetricTrendSectionProps {
  entries: readonly BodyMetricEntry[];
  targetWeightKg: number;
  targetBodyFatPercent: number;
  nutrition?: ProgressNutritionSummary;
  onOpenLogModal: () => void;
}

export function MetricTrendSection({
  entries,
  targetWeightKg,
  targetBodyFatPercent,
  nutrition,
  onOpenLogModal,
}: MetricTrendSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("weightKg");
  const [showAllRows, setShowAllRows] = useState(false);

  const isCalories = selectedMetric === "calories";
  const targetValue = isCalories
    ? (nutrition?.targetDailyCalories ?? 0)
    : selectedMetric === "weightKg"
      ? targetWeightKg
      : targetBodyFatPercent;

  const summaryLine = isCalories
    ? nutrition && nutrition.loggedDays > 0
      ? `Avg ${nutrition.avgDailyCalories.toLocaleString("en-US")} kcal/day across ${nutrition.loggedDays} logged ${nutrition.loggedDays === 1 ? "day" : "days"}${targetValue > 0 ? ` (Goal: ${targetValue.toLocaleString("en-US")} kcal)` : ""}.`
      : "No meals logged in the last 14 days."
    : summarizeMetricTrend(entries, selectedMetric, targetValue);

  const rawChartPoints: TrendPoint[] = isCalories
    ? (nutrition?.trend ?? []).map((day) => ({
        label: day.dateLabel,
        value: day.calories > 0 ? day.calories : null,
      }))
    : entries.map((entry) => ({
        label: entry.dateLabel,
        value: entry[selectedMetric] > 0 ? entry[selectedMetric] : null,
      }));

  // Chart stack requires unique x-axis labels; keep the latest value per day label.
  const chartPoints: TrendPoint[] = Array.from(
    rawChartPoints
      .reduce((map, point) => {
        map.set(point.label, point);
        return map;
      }, new Map<string, TrendPoint>())
      .values(),
  );

  const newestFirst = [...entries].reverse();
  const visibleRows = showAllRows ? newestFirst : newestFirst.slice(0, 5);

  return (
    <section
      aria-label="Metric trend and check-in history"
      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--color-text)]">
            Metric Trend
          </h2>
          <p
            className="text-xs sm:text-[13px] text-neutral-600 mt-0.5 truncate"
            title={summaryLine}
          >
            {summaryLine}
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-1 rounded-xl bg-neutral-100 p-1 self-start sm:self-auto"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedMetric === "weightKg"}
            onClick={() => setSelectedMetric("weightKg")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedMetric === "weightKg"
                ? "bg-white text-[var(--color-text)] shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Weight (kg)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedMetric === "bodyFatPercent"}
            onClick={() => setSelectedMetric("bodyFatPercent")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedMetric === "bodyFatPercent"
                ? "bg-white text-[var(--color-text)] shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Body Fat (%)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedMetric === "calories"}
            onClick={() => setSelectedMetric("calories")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedMetric === "calories"
                ? "bg-white text-[var(--color-text)] shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Calories
          </button>
        </div>
      </div>

      {/* Single-metric Trend Chart */}
      <div>
        <TrendLineChart
          ariaLabel={
            isCalories
              ? "Daily calorie intake trend over time"
              : selectedMetric === "weightKg"
                ? "Weight trend over time in kilograms"
                : "Body fat percentage trend over time"
          }
          emptyMessage={
            isCalories
              ? "No meals logged yet for this period."
              : "No check-ins logged yet for this metric."
          }
          height={190}
          points={chartPoints}
          reference={
            targetValue > 0
              ? {
                  label: "Goal",
                  value: targetValue,
                }
              : undefined
          }
          tone={selectedMetric === "weightKg" ? "action" : "effort"}
          yLabel={isCalories ? "kcal" : selectedMetric === "weightKg" ? "kg" : "%"}
        />
      </div>

      {/* Compact History Table */}
      <div className="pt-2 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Check-in History
          </h3>
          <button
            type="button"
            onClick={onOpenLogModal}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-action)] hover:underline cursor-pointer"
          >
            <Plus size={13} />
            Log check-in
          </button>
        </div>

        {newestFirst.length === 0 ? (
          <div className="rounded-xl bg-neutral-50 border border-dashed border-neutral-200 p-4 text-center">
            <p className="text-xs text-neutral-600">
              No body check-ins recorded yet. Log your first weight or body fat check-in to start
              your history.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 px-2 font-semibold text-right">Weight</th>
                    <th className="py-2 px-2 font-semibold text-right">Body Fat</th>
                    <th className="py-2 px-2 font-semibold text-right">BMI</th>
                    <th className="py-2 pl-2 font-semibold text-right">Photo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {visibleRows.map((row) => (
                    <tr key={row.id || row.loggedAt} className="hover:bg-neutral-50/80">
                      <td className="py-2.5 pr-3 font-medium text-[var(--color-text)] whitespace-nowrap">
                        {row.dateLabel}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[var(--color-text)]">
                        {row.weightKg > 0 ? `${row.weightKg} kg` : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-neutral-600">
                        {row.bodyFatPercent > 0 ? `${row.bodyFatPercent}%` : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-neutral-600">
                        {row.bmi > 0 ? row.bmi : "—"}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {row.progressPhotoUrl ? (
                          <span
                            title="Progress photo attached"
                            className="inline-flex items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] p-1"
                          >
                            <Camera size={12} aria-label="Has photo" />
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {newestFirst.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                {showAllRows ? (
                  <>
                    Show less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Show all ({newestFirst.length}) <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
