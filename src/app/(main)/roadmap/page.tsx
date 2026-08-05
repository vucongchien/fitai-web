import { Suspense } from "react";

import { WeekRoute } from "@/features/roadmap/ui/week-route";
import { getRoadmapPageData } from "@/shared/api/bff/roadmap/queries";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Roadmap" };

async function RoadmapContent() {
  const data = await getRoadmapPageData();

  return (
    <>
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

function RoadmapSkeleton() {
  return (
    <div className="roadmap-skeleton mt-4">
      <div className="skeleton-box h-12 w-full mb-4 rounded-[10px] bg-[var(--color-surface-hover,#eee)]" />
      <div className="skeleton-box h-[300px] w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <PageTransition className="page roadmap-page">
      <header className="page-heading">
        <div>
          <h1>Your four-week route</h1>
          <p>The plan builds gradually, then gives your body room to absorb the work.</p>
        </div>
      </header>

      <TripleLane active="plan" labelled morph />

      <Suspense fallback={<RoadmapSkeleton />}>
        <RoadmapContent />
      </Suspense>
    </PageTransition>
  );
}
