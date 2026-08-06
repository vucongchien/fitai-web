import type { HomeOverview } from "@/features/home/model/home-overview.types";
import { TrendLineChart } from "@/shared/ui/charts/trend-line-chart";

type OverviewCardProps = {
  overview: HomeOverview;
};

export function OverviewCard({ overview }: OverviewCardProps) {
  return (
    <section className="overview-card">
      <div className="overview-card__pair">
        <div className="overview-card__reading">
          <span className="utility-label">Workout completion</span>
          <strong className="data-value">{overview.workoutCompletionPercentage}%</strong>
          <span className="overview-card__detail">{overview.workoutSummary}</span>
          <div
            aria-label={`Workout completion ${overview.workoutCompletionPercentage} percent`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={overview.workoutCompletionPercentage}
            className="overview-card__track overview-card__track--effort"
            role="progressbar"
          >
            <span style={{ inlineSize: `${overview.workoutCompletionPercentage}%` }} />
          </div>
        </div>

        <div className="overview-card__reading">
          <span className="utility-label">Nutrition goal</span>
          <strong className="data-value">{overview.nutritionGoalPercentage}%</strong>
          <span className="overview-card__detail">{overview.nutritionSummary}</span>
          <div
            aria-label={`Nutrition goal ${overview.nutritionGoalPercentage} percent`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={overview.nutritionGoalPercentage}
            className="overview-card__track"
            role="progressbar"
          >
            <span style={{ inlineSize: `${overview.nutritionGoalPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="overview-card__chart">
        <span className="utility-label">Calories, last 7 days</span>
        <TrendLineChart
          ariaLabel="Calories logged over the last seven days"
          emptyMessage="No meals logged in the last seven days."
          height={150}
          points={overview.calorieTrend.map((day) => ({
            label: day.key.slice(5),
            value: day.calories,
          }))}
        />
      </div>
    </section>
  );
}
