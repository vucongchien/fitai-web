"use client";

import { areaY, defineChart, dot, lineY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { Chart } from "@tanstack/react-charts";
import { useMemo } from "react";

import { ChartEmpty } from "@/shared/ui/charts/chart-empty";

export interface TrendPoint {
  /** Category label on the x axis, e.g. "Mon" or "08-06". */
  label: string;
  /** `null` marks a day with nothing logged, so it reads as absent rather than zero. */
  value: number | null;
}

interface TrendLineChartProps {
  ariaLabel: string;
  emptyMessage?: string;
  height?: number;
  points: readonly TrendPoint[];
  /** Horizontal target line, drawn behind the series. */
  reference?: { label: string; value: number };
  tone?: "action" | "effort" | "recovery";
  yLabel?: string;
}

/**
 * Wraps `@tanstack/react-charts` so the pre-1.0 API stays in one place.
 * A breaking upgrade lands here, not in the screens.
 */
export function TrendLineChart({
  ariaLabel,
  emptyMessage = "No data logged yet.",
  height = 200,
  points,
  reference,
  tone = "action",
  yLabel,
}: TrendLineChartProps) {
  const logged = points.filter((point) => point.value !== null);

  const definition = useMemo(() => {
    const series =
      tone === "recovery"
        ? "var(--color-recovery)"
        : (tone === "effort"
          ? "var(--color-effort)"
          : "var(--color-action)");

    // Every category is passed so the axis keeps all its ticks; the marks' y channels
    // Accept null, so a day with nothing logged leaves a gap instead of dropping to zero.
    const marks = [
      areaY(points, { fill: series, fillOpacity: 0.1, x: "label", y: "value" }),
      lineY(points, { stroke: series, strokeWidth: 2.5, x: "label", y: "value" }),
      dot(logged, { fill: series, r: 3.5, x: "label", y: "value" }),
    ];

    if (reference) {
      // A flat series across every category renders as the dashed target rule.
      marks.unshift(
        lineY(
          points.map((point) => ({ label: point.label, value: reference.value })),
          {
            stroke: "var(--color-border-strong)",
            strokeDasharray: "4 4",
            strokeWidth: 1.5,
            x: "label",
            y: "value",
          },
        ),
      );
    }

    return defineChart({
      marks,
      x: { scale: () => scalePoint<string>().padding(0.32) },
      y: {
        axis: yLabel ? { label: yLabel } : undefined,
        grid: true,
        nice: true,
        scale: scaleLinear,
      },
    });
  }, [logged, points, reference, yLabel]);

  if (logged.length === 0) {
    return <ChartEmpty height={height} message={emptyMessage} />;
  }

  return (
    <figure className="chart-figure">
      <div className="chart-frame" style={{ height: `${height}px` }}>
        <Chart ariaLabel={ariaLabel} definition={definition} height={height} />
      </div>
      {reference ? (
        <figcaption className="chart-legend">
          <span className="chart-legend__series">Logged</span>
          <span className="chart-legend__reference">
            {reference.label} ·{" "}
            <span className="data-value">{reference.value.toLocaleString("en-US")}</span>
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
