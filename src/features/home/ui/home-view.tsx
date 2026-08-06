import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { HomeOverview } from "@/features/home/model/home-overview.types";
import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { MetricGrid } from "@/features/home/ui/metric-grid";
import { OverviewCard } from "@/features/home/ui/overview-card";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { ViewPlanCta } from "@/features/home/ui/view-plan-cta";

type HomeViewProps = {
  data: HomePageData;
  overview: HomeOverview;
};

const PLAN_ANCHOR_ID = "today-plan";

export function HomeView({ data, overview }: HomeViewProps) {
  return (
    <>
      <CoachNote message={data.coachNote} />

      <OverviewCard overview={overview} />

      <section className="content-section">
        <div className="content-section__header">
          <h2>Latest readings</h2>
        </div>
        <MetricGrid metrics={overview.metrics} />
      </section>

      <ViewPlanCta targetId={PLAN_ANCHOR_ID} />

      <div className="home-grid">
        <section className="content-section home-week">
          {/* Scroll target for the CTA above; focusable so keyboard users land here too. */}
          <div className="content-section__header" id={PLAN_ANCHOR_ID} tabIndex={-1}>
            <h2>Today&rsquo;s plan</h2>
            <p>Meals and sessions in order</p>
          </div>

          <TodayTimeline items={data.todayTimeline} />

          <Link className="text-action" href="/roadmap" transitionTypes={["nav-forward"]}>
            Open the four-week roadmap
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        <aside className="home-side">
          <EvidenceSection items={data.evidenceItems} />
        </aside>
      </div>

      <QuickActionsFab actions={data.quickActions} />
    </>
  );
}
