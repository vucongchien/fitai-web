"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import type { ProgressDashboardData } from "../model/types";
import { BodySilhouetteCard } from "./body-silhouette-card";
import { ConsistencyHeatmap } from "./consistency-heatmap";
import { KpiSummaryCards } from "./kpi-summary-cards";
import { LogMetricsModal } from "./log-metrics-modal";
import { MetricTrendSection } from "./metric-trend-section";
import { PhotoComparisonSlider } from "./photo-comparison-slider";
import { WeeklyGoalRing } from "./weekly-goal-ring";

interface ProgressDashboardViewProps {
  data: ProgressDashboardData;
}

export function ProgressDashboardView({ data }: ProgressDashboardViewProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  return (
    <div className="space-y-5 px-4 sm:px-6 pt-5 pb-10 bg-white">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Body &amp; Progress
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Track your body metrics, consistency, and transformation
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[var(--color-action-hover)] active:scale-98 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Log Check-in
        </button>
      </header>

      {/* Weekly Goal Ring */}
      <WeeklyGoalRing
        completed={data.weeklyGoal.completed}
        target={data.weeklyGoal.target}
        percentage={data.weeklyGoal.percentage}
      />

      {/* KPI Summary Cards */}
      <KpiSummaryCards
        currentWeightKg={data.currentWeightKg}
        targetWeightKg={data.targetWeightKg}
        currentBodyFatPercent={data.currentBodyFatPercent}
        targetBodyFatPercent={data.targetBodyFatPercent}
        streakDays={data.streakDays}
        totalWorkouts={data.totalWorkouts}
        totalVolumeKg={data.totalVolumeKg}
        adherencePercentage={data.adherencePercentage}
        entries={data.entries}
      />

      {/* Interactive Body Silhouette & Composition */}
      <BodySilhouetteCard
        weightKg={data.currentWeightKg}
        heightCm={data.heightCm}
        bodyFatPercent={data.currentBodyFatPercent}
        preferredMuscleGroups={data.preferredMuscleGroups}
        activeInjuries={data.activeInjuries}
        gender={data.gender}
      />

      {/* Single-Metric Trend Chart + Plain-Language Summary + Compact History Table */}
      <MetricTrendSection
        entries={data.entries}
        targetWeightKg={data.targetWeightKg}
        targetBodyFatPercent={data.targetBodyFatPercent}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* Before / After Comparison Photo Slider & Gallery */}
      <PhotoComparisonSlider photos={data.photos} onOpenLogModal={() => setIsLogModalOpen(true)} />

      {/* Workout Consistency Heatmap */}
      <ConsistencyHeatmap weeks={data.heatmapWeeks} />

      {/* Log Periodic Metrics Modal */}
      <LogMetricsModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        defaultWeightKg={data.currentWeightKg}
        defaultBodyFatPercent={data.currentBodyFatPercent}
        defaultHeightCm={data.heightCm}
      />
    </div>
  );
}
