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
  const todayCalories = data.todayStats?.calories ?? (data.caloriesAverage ?? 0);

  return (
    <>
      <MetricHero
        Icon={Salad}
        ariaLabel={`Consumed ${todayCalories} kcal today against a ${data.caloriesTargetPerDay} kcal daily target`}
        dateLabel={data.dateLabel}
        max={data.caloriesTargetPerDay}
        note={`Target ${data.caloriesTargetPerDay.toLocaleString()} kcal / day`}
        stats={data.macros.map((macro, index) => ({
          Icon: MACRO_ICONS[index] ?? Beef,
          label: `${macro.label} / day`,
          value: `${macro.gramsPerDay.toLocaleString()} g`,
        }))}
        tone="recovery"
        unit="kcal"
        value={todayCalories}
        valueText={todayCalories === 0 ? "0" : todayCalories.toLocaleString()}
      />
      <section className="content-section">
        <div className="content-section__header">
          <h2>Today&rsquo;s Meals</h2>
          <p>Scheduled menu options and logged meals</p>
        </div>
        <MealTimeline slots={data.slots} />
      </section>

      <section className="content-section">
        <div className="content-section__header">
          <h2>7-Day Calorie Trend</h2>
          <p>
            Logged <span className="data-value">{data.daysLogged}</span> of the last {WEEK_DAYS} days
          </p>
        </div>
        <TrendLineChart
          ariaLabel="Calories logged each day this week against the daily target"
          emptyMessage="No meals logged this week."
          points={data.calorieSeries.map((day) => ({
            label: day.key.slice(5),
            value: day.calories,
          }))}
          reference={{ label: "Target", value: data.caloriesTargetPerDay }}
          tone="recovery"
          yLabel="kcal"
        />
      </section>
    </>
  );
}
