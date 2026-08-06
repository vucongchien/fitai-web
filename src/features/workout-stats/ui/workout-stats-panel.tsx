import { Dumbbell, Layers, Weight } from "lucide-react";

import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import { WeeklyProgressPanel } from "@/features/workout-stats/ui/weekly-progress-panel";
import { MetricHero } from "@/shared/ui/charts/metric-hero";
import { TrendLineChart } from "@/shared/ui/charts/trend-line-chart";

type WorkoutStatsPanelProps = {
  data: WorkoutStatsData;
};

export function WorkoutStatsPanel({ data }: WorkoutStatsPanelProps) {
  const { adherence } = data;

  return (
    <>
      <MetricHero
        ariaLabel={`${adherence.completed} of ${adherence.scheduled} sessions completed this week`}
        dateLabel={data.dateLabel}
        Icon={Dumbbell}
        max={adherence.scheduled}
        note={
          adherence.scheduled === 0
            ? "No sessions scheduled this week"
            : `of ${adherence.scheduled} sessions planned`
        }
        stats={[
          {
            Icon: Weight,
            label: "Volume",
            value: formatVolume(data.volumeKg),
          },
          { Icon: Layers, label: "Sets", value: data.totalSets.toLocaleString() },
          { Icon: Dumbbell, label: "Active days", value: String(data.activeDays) },
        ]}
        tone="effort"
        unit={adherence.completed === 1 ? "session" : "sessions"}
        value={adherence.completed}
        valueText={String(adherence.completed)}
      />

      <section className="content-section">
        <div className="content-section__header">
          <h2>Sessions per day</h2>
          <p>Completed this week</p>
        </div>
        <TrendLineChart
          ariaLabel="Completed workout sessions per day this week"
          emptyMessage="No sessions scheduled this week yet."
          points={data.weekdaySeries.map((day) => ({
            label: day.label,
            value: day.sessions,
          }))}
          yLabel="Sessions"
        />
      </section>

      <WeeklyProgressPanel data={data} />
    </>
  );
}
