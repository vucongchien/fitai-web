import { Route } from "lucide-react";

import type { RoadmapAdherence } from "../model/types";

type RoadmapProgressBannerProps = {
  adherence: RoadmapAdherence;
};

export function RoadmapProgressBanner({ adherence }: RoadmapProgressBannerProps) {
  const {
    adherencePercentage,
    currentWeek,
    sessionsCompleted,
    totalSessionsScheduled,
    totalWeeks,
  } = adherence;

  return (
    <section className="adherence-banner">
      <span aria-hidden="true" className="adherence-banner__icon">
        <Route size={17} />
      </span>

      <div className="adherence-banner__body">
        <span className="utility-label">Route adherence</span>
        <p>
          Week <span className="data-value">{currentWeek}</span> of{" "}
          <span className="data-value">{totalWeeks}</span> ·{" "}
          <span className="data-value">{sessionsCompleted}</span> of{" "}
          <span className="data-value">{totalSessionsScheduled}</span> sessions done
        </p>
      </div>

      <strong className="adherence-banner__value data-value">{adherencePercentage}%</strong>

      <div
        aria-label={`Route adherence ${adherencePercentage} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={adherencePercentage}
        className="adherence-banner__track"
        role="progressbar"
      >
        <span style={{ inlineSize: `${adherencePercentage}%` }} />
      </div>
    </section>
  );
}
