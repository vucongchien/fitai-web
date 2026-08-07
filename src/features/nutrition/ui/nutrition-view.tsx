import { Beef, Droplet, Salad, Wheat } from "lucide-react";

import { WEEK_DAYS } from "@/features/nutrition/model/nutrition-page.mapper";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import { MealTimeline } from "@/features/nutrition/ui/meal-timeline";
import { MetricHero } from "@/shared/ui/charts/metric-hero";
import { TrendLineChart } from "@/shared/ui/charts/trend-line-chart";

interface NutritionViewProps {
  data: NutritionPageData;
}

const MACRO_ICONS = [Beef, Wheat, Droplet] as const;

export function NutritionView({ data }: NutritionViewProps) {
  const average = data.caloriesAverage;

  return (
    <>
      <MetricHero
        ariaLabel={`Average ${average ?? 0} kcal per day against a ${data.caloriesTargetPerDay} kcal daily target, across ${data.daysLogged} of ${WEEK_DAYS} logged days`}
        dateLabel={data.dateLabel}
        Icon={Salad}
        max={data.caloriesTargetPerDay}
        note={`Daily average · target ${data.caloriesTargetPerDay.toLocaleString()} kcal`}
        stats={data.macros.map((macro, index) => ({
          Icon: MACRO_ICONS[index] ?? Beef,
          label: `${macro.label} / day`,
          value: `${macro.gramsPerDay.toLocaleString()} g`,
        }))}
        tone="recovery"
        unit="kcal"
        value={average ?? 0}
        valueText={average === null ? "—" : average.toLocaleString()}
      />

      <section className="content-section">
        <div className="content-section__header">
          <h2>Calories per day</h2>
          <p>
            <span className="data-value">{data.daysLogged}</span> of {WEEK_DAYS} days logged
          </p>
        </div>
        <TrendLineChart
          ariaLabel="Calories logged each day this week against the daily target"
          emptyMessage="No meals logged this week yet."
          points={data.calorieSeries.map((day) => ({
            label: day.key.slice(5),
            value: day.calories,
          }))}
          reference={{ label: "Target", value: data.caloriesTargetPerDay }}
          tone="recovery"
          yLabel="kcal"
        />
      </section>

      <section className="content-section">
        <div className="content-section__header">
          <h2>Today&rsquo;s meals</h2>
          <p>
            <span className="data-value">{data.mealsLogged}</span> logged this week
          </p>
        </div>
        <MealTimeline slots={data.slots} />
      </section>
    </>
  );
}
