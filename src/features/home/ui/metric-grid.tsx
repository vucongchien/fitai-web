import { Dumbbell, Flame, Layers, Salad, Target, Utensils, Weight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { MetricCard, MetricIcon } from "@/features/home/model/home-overview.types";

const ICONS: Record<MetricIcon, LucideIcon> = {
  dumbbell: Dumbbell,
  flame: Flame,
  layers: Layers,
  salad: Salad,
  target: Target,
  utensils: Utensils,
  weight: Weight,
};

type MetricGridProps = {
  metrics: MetricCard[];
};

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <ul className="metric-grid">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.icon];

        return (
          <li className="metric-grid__card" key={metric.id}>
            <span aria-hidden="true" className="metric-grid__icon">
              <Icon size={16} />
            </span>

            <span className="metric-grid__title">{metric.title}</span>

            <strong className="metric-grid__value data-value">{metric.value}</strong>

            <span className="metric-grid__goal">{metric.goal}</span>

            {metric.percentage === null ? null : (
              <div
                aria-label={`${metric.title}: ${metric.percentage} percent of target`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={metric.percentage}
                className="metric-grid__track"
                role="progressbar"
              >
                <span style={{ inlineSize: `${metric.percentage}%` }} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
