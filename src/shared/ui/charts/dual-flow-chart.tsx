"use client";

import { defineChart, dot, lineY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { Chart } from "@tanstack/react-charts";
import { useMemo } from "react";

import { ChartEmpty } from "@/shared/ui/charts/chart-empty";

export type FlowPoint = {
  label: string;
  /** Percentage of that day's target. `null` when there was no target to meet. */
  nutrition: number | null;
  workout: number | null;
};

type DualFlowChartProps = {
  ariaLabel: string;
  emptyMessage?: string;
  height?: number;
  points: readonly FlowPoint[];
};

/**
 * The two weekly flows on one scale.
 *
 * Both series are percentages of that day's own target, which is what makes a shared axis
 * honest: calories against `target_calories`, sessions against the day's scheduled count.
 * Raw kcal and kg could not share an axis without flattening one of them.
 */
export function DualFlowChart({
  ariaLabel,
  emptyMessage = "Nothing logged this week yet.",
  height = 190,
  points,
}: DualFlowChartProps) {
  const hasData = points.some((point) => point.nutrition !== null || point.workout !== null);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          // 100% reference, so "on plan" has a visible line to sit on.
          lineY(
            points.map((point) => ({ label: point.label, value: 100 })),
            {
              stroke: "var(--color-border-strong)",
              strokeDasharray: "4 4",
              strokeWidth: 1.5,
              x: "label",
              y: "value",
            },
          ),
          lineY(points, {
            stroke: "var(--color-action)",
            strokeWidth: 2.5,
            x: "label",
            y: "nutrition",
          }),
          dot(
            points.filter((point) => point.nutrition !== null),
            { fill: "var(--color-action)", r: 3.5, x: "label", y: "nutrition" },
          ),
          lineY(points, {
            stroke: "var(--color-effort)",
            strokeWidth: 2.5,
            x: "label",
            y: "workout",
          }),
          dot(
            points.filter((point) => point.workout !== null),
            { fill: "var(--color-effort)", r: 3.5, x: "label", y: "workout" },
          ),
        ],
        x: { scale: () => scalePoint<string>().padding(0.32) },
        y: {
          axis: { label: "% of target" },
          grid: true,
          nice: true,
          scale: scaleLinear,
        },
      }),
    [points],
  );

  if (!hasData) return <ChartEmpty height={height} message={emptyMessage} />;

  return (
    <figure className="chart-figure">
      <div className="chart-frame" style={{ height: `${height}px` }}>
        <Chart ariaLabel={ariaLabel} definition={definition} height={height} />
      </div>
      <figcaption className="chart-legend">
        <span className="chart-legend__series">Nutrition</span>
        <span className="chart-legend__series chart-legend__series--effort">Workout</span>
        <span className="chart-legend__reference">On plan</span>
      </figcaption>
    </figure>
  );
}
