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

            <p className="metric-grid__value">
              <strong className="data-value">{metric.value}</strong>
              {metric.unit ? <span className="metric-grid__unit">{metric.unit}</span> : null}
            </p>

            <span className="metric-grid__caption">{metric.caption}</span>
          </li>
        );
      })}
    </ul>
  );
}
