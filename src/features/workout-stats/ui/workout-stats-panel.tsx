import { Check, Dumbbell, Timer, Weight } from "lucide-react";

import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import { MetricHero } from "@/shared/ui/charts/metric-hero";
import { VolumeBarChart } from "@/shared/ui/charts/volume-bar-chart";

interface WorkoutStatsPanelProps {
  data: WorkoutStatsData;
  children?: React.ReactNode;
}

export function WorkoutMetricHero({ data }: { data: WorkoutStatsData }) {
  if (data.error) {
    return null;
  }

  const { adherence } = data;

  return (
    <MetricHero
      ariaLabel={`${adherence.scheduled} sessions planned this week, ${adherence.completed} completed`}
      dateLabel={data.dateLabel}
      Icon={Dumbbell}
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
      tone="action"
      unit={adherence.scheduled === 1 ? "session" : "sessions"}
      value={adherence.completed}
      valueText={String(adherence.scheduled)}
    />
  );
}

export function TrainingVolumeSection({ data }: { data: WorkoutStatsData }) {
  if (data.error) {
    return null;
  }

  return (
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
  );
}

export function WorkoutStatsPanel({ data, children }: WorkoutStatsPanelProps) {
  if (data.error) {
    return children ? <>{children}</> : null;
  }

  return (
    <>
      {/* The headline is the week's planned total; the strip below breaks it down. */}
      <WorkoutMetricHero data={data} />

      {children}

      <TrainingVolumeSection data={data} />
    </>
  );
}
