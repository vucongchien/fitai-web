import { CalendarClock, Check, Weight } from "lucide-react";

import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import { MetricHero } from "@/shared/ui/charts/metric-hero";
import { TrendLineChart } from "@/shared/ui/charts/trend-line-chart";

type WorkoutStatsPanelProps = {
  data: WorkoutStatsData;
};

export function WorkoutStatsPanel({ data }: WorkoutStatsPanelProps) {
  const { adherence } = data;
  const remaining = Math.max(0, adherence.scheduled - adherence.completed);

  return (
    <>
      {/* The headline is the week's planned total; the strip below breaks it down. */}
      <MetricHero
        ariaLabel={`${adherence.scheduled} sessions planned this week, ${adherence.completed} completed`}
        dateLabel={data.dateLabel}
        Icon={CalendarClock}
        max={adherence.scheduled}
        stats={[
          { Icon: Check, label: "Completed", value: String(adherence.completed) },
          { Icon: CalendarClock, label: "Remaining", value: String(remaining) },
          { Icon: Weight, label: "Volume", value: formatVolume(data.volumeKg) },
        ]}
        tone="effort"
        unit={adherence.scheduled === 1 ? "session" : "sessions"}
        value={adherence.completed}
        valueText={String(adherence.scheduled)}
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
    </>
  );
}
