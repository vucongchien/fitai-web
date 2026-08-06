import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";
import { WeekRoute } from "@/features/roadmap/ui/week-route";

type RoadmapViewProps = {
  data: RoadmapPageData;
};

export function RoadmapView({ data }: RoadmapViewProps) {
  return (
    <>
      <div className="roadmap-layout">
        <section className="content-section">
          <div className="content-section__header">
            <h2>
              Week <span className="data-value">{data.activeWeek}</span>
            </h2>
            <p>{data.currentWeekDateRange}</p>
          </div>

          <WeekRoute sessions={data.currentWeekSessions} />

          <Link
            className="ui-button ui-button--secondary ui-button--medium roadmap-view__schedule"
            href="/schedule"
            transitionTypes={["nav-forward"]}
          >
            <span className="ui-button__label">
              See all four weeks
              <ArrowRight aria-hidden="true" size={17} />
            </span>
          </Link>
        </section>

        <aside className="roadmap-context">
          {data.contextItems.map((item) => {
            const { Icon } = item;
            return (
              <div className="roadmap-context__item" key={item.id}>
                <Icon aria-hidden="true" size={20} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </>
  );
}
