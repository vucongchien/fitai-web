import type { LucideIcon } from "lucide-react";

import { CircularProgress } from "@/shared/ui/charts/circular-progress";

export type HeroStat = {
  Icon: LucideIcon;
  label: string;
  value: string;
};

type MetricHeroProps = {
  ariaLabel: string;
  /** Context line above the value, e.g. "Thursday 6 August" or "3 – 9 August". */
  dateLabel: string;
  Icon: LucideIcon;
  max: number;
  /** Sits under the value, e.g. "of 2,050 kcal target". */
  note?: string;
  stats: HeroStat[];
  tone?: "action" | "effort" | "recovery";
  /** The headline figure, e.g. "1,420" or "5". */
  value: number;
  valueText: string;
  unit?: string;
};

/**
 * Ring, date, headline value and a divided stat strip.
 *
 * The arc alone carries the ratio, so no percentage is printed — the figure below the ring
 * is the actual measurement.
 */
export function MetricHero({
  ariaLabel,
  dateLabel,
  Icon,
  max,
  note,
  stats,
  tone = "action",
  unit,
  value,
  valueText,
}: MetricHeroProps) {
  return (
    <section className="metric-hero">
      <CircularProgress ariaLabel={ariaLabel} Icon={Icon} max={max} tone={tone} value={value} />

      <p className="metric-hero__date">{dateLabel}</p>

      <p className="metric-hero__value">
        <strong className="data-value">{valueText}</strong>
        {unit ? <span className="metric-hero__unit">{unit}</span> : null}
      </p>

      {note ? <p className="metric-hero__note">{note}</p> : null}

      <ul className="hero-stats">
        {stats.map((stat) => (
          <li className="hero-stats__item" key={stat.label}>
            <span aria-hidden="true" className="hero-stats__icon">
              <stat.Icon size={17} strokeWidth={2} />
            </span>
            <strong className="data-value">{stat.value}</strong>
            <span className="hero-stats__label">{stat.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
