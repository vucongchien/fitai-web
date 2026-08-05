import { getMockProgressStats } from "@/features/progress/model/progress-aggregator";
import { RoadmapProgressBanner } from "@/features/progress/ui/roadmap-progress-banner";
import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";
import { WeekRoute } from "@/features/roadmap/ui/week-route";

type RoadmapViewProps = {
  data: RoadmapPageData;
};

export function RoadmapView({ data }: RoadmapViewProps) {
  const stats = getMockProgressStats();

  return (
    <>
      <RoadmapProgressBanner adherence={stats.adherence} />

      <span className="roadmap-phase" style={{ position: "absolute", top: "1rem", right: "1rem" }}>
        Week {data.activeWeek} active
      </span>

      <nav aria-label="Roadmap weeks" className="week-selector">
        {data.weeks.map((week) => (
          <button
            aria-current={week.state === "active" ? "step" : undefined}
            className="week-selector__item"
            data-state={week.state}
            key={week.number}
            type="button"
          >
            <span className="data-value">W{week.number}</span>
            <strong>{week.label}</strong>
          </button>
        ))}
      </nav>

      <div className="roadmap-layout">
        <section className="content-section">
          <div className="content-section__header">
            <h2>{data.currentWeekLabel}</h2>
            <p>{data.currentWeekDateRange}</p>
          </div>
          <WeekRoute sessions={data.currentWeekSessions} />
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
