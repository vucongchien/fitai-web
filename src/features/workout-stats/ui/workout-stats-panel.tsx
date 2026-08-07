import { CalendarClock, Check, Timer, Weight } from "lucide-react";

import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import { MetricHero } from "@/shared/ui/charts/metric-hero";
import { VolumeBarChart } from "@/shared/ui/charts/volume-bar-chart";

interface WorkoutStatsPanelProps {
  data: WorkoutStatsData;
}

export function WorkoutStatsPanel({ data }: WorkoutStatsPanelProps) {
  const { adherence } = data;

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
          {
            Icon: Timer,
            label: "Trained today",
            value: data.minutesToday === 0 ? "—" : `${data.minutesToday} min`,
          },
          { Icon: Weight, label: "Volume", value: formatVolume(data.volumeKg) },
        ]}
        tone="effort"
        unit={adherence.scheduled === 1 ? "session" : "sessions"}
        value={adherence.completed}
        valueText={String(adherence.scheduled)}
      />

      <section className="content-section">
        <div className="content-section__header">
          <h2>Training volume</h2>
          <p>Total lifted per week</p>
        </div>
        <VolumeBarChart
          ariaLabel="Total training volume lifted each week over the last four weeks"
          bars={data.volumeTrend}
          emptyMessage="Complete a session to start the volume record."
        />
      </section>
    </>
  );
}
