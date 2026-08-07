"use client";

import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts-scales/band";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { Chart } from "@tanstack/react-charts";
import { useMemo } from "react";

import { ChartEmpty } from "@/shared/ui/charts/chart-empty";

export interface VolumeBar {
  /** Axis label for the week, e.g. "W1" or "Aug 3". */
  label: string;
  /** Total kg lifted. `null` for a week with no logged session. */
  volumeKg: number | null;
}

interface VolumeBarChartProps {
  ariaLabel: string;
  bars: readonly VolumeBar[];
  emptyMessage?: string;
  height?: number;
}

/**
 * Training volume per week — whether the load is actually going up.
 *
 * Bars, not a line: each week is a discrete total, and a line between them would imply
 * values in between. A week with no session is dropped rather than drawn as zero, so a
 * rest week never looks like a collapse in output.
 */
export function VolumeBarChart({
  ariaLabel,
  bars,
  emptyMessage = "No sessions logged yet.",
  height = 200,
}: VolumeBarChartProps) {
  const logged = bars.filter((bar) => bar.volumeKg !== null);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(bars, {
            fill: "var(--color-effort)",
            x: "label",
            y: "volumeKg",
          }),
        ],
        x: { scale: () => scaleBand<string>().padding(0.36) },
        y: {
          axis: { label: "kg" },
          grid: true,
          nice: true,
          scale: scaleLinear,
        },
      }),
    [bars],
  );

  if (logged.length === 0) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  return (
    <div className="chart-frame chart-frame--effort" style={{ height: `${height}px` }}>
      <Chart ariaLabel={ariaLabel} definition={definition} height={height} />
    </div>
  );
}
