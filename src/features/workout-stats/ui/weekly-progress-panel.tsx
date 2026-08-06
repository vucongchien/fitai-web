import { formatVolume } from "@/features/workout-stats/model/workout-stats.mapper";
import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";

type WeeklyProgressPanelProps = {
  data: WorkoutStatsData;
};

type GoalBarProps = {
  label: string;
  percentage: number;
  reading: string;
  tone?: "action" | "recovery";
};

function GoalBar({ label, percentage, reading, tone = "action" }: GoalBarProps) {
  return (
    <div className={tone === "recovery" ? "goal-bar goal-bar--recovery" : "goal-bar"}>
      <div className="goal-bar__header">
        <strong>{label}</strong>
        <span className="goal-bar__reading data-value">{reading}</span>
      </div>
      <div
        aria-label={`${label}: ${percentage} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="goal-bar__track"
        role="progressbar"
      >
        <span style={{ inlineSize: `${percentage}%` }} />
      </div>
    </div>
  );
}

/**
 * Weekly progress: the two goal bars and the week's achievements.
 *
 * Both readings are plain counts — sessions completed over scheduled, days logged over
 * seven — never a weighted index, because no such figure exists on the wire.
 */
export function WeeklyProgressPanel({ data }: WeeklyProgressPanelProps) {
  const nutrition = data.weeklyNutritionAdherence;
  const workout = data.adherence;

  return (
    <>
      <section className="content-section">
        <div className="content-section__header">
          <h2>Weekly goals</h2>
          <p>Where the week stands</p>
        </div>

        <div className="goal-bars">
          <GoalBar
            label="Nutrition goal"
            percentage={nutrition.percentage}
            reading={`${nutrition.completed}/${nutrition.scheduled} days`}
            tone="recovery"
          />
          <GoalBar
            label="Workout goal"
            percentage={workout.percentage}
            reading={`${workout.completed}/${workout.scheduled} sessions`}
          />
        </div>
      </section>

      <section className="content-section">
        <div className="content-section__header">
          <h2>This week</h2>
          <p>Logged evidence</p>
        </div>

        <dl className="achievement-list">
          <div className="achievement-list__row">
            <dt>Workouts completed</dt>
            <dd className="data-value">{workout.completed}</dd>
          </div>
          <div className="achievement-list__row">
            <dt>Meals logged</dt>
            <dd className="data-value">{data.weeklyMealsLogged}</dd>
          </div>
          <div className="achievement-list__row">
            <dt>Average protein intake</dt>
            <dd className="data-value">
              {data.weeklyAverageProtein === null ? "No data" : `${data.weeklyAverageProtein} g`}
            </dd>
          </div>
          <div className="achievement-list__row">
            <dt>Active days</dt>
            <dd className="data-value">{data.activeDays}</dd>
          </div>
          <div className="achievement-list__row">
            <dt>Training volume</dt>
            <dd className="data-value">{formatVolume(data.volumeKg)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
