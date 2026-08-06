import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { HomeOverview } from "@/features/home/model/home-overview.types";
import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { OverviewCard } from "@/features/home/ui/overview-card";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";

type HomeViewProps = {
  data: HomePageData;
  overview: HomeOverview;
};

export function HomeView({ data, overview }: HomeViewProps) {
  return (
    <>
      <CoachNote message={data.coachNote} />

      <OverviewCard overview={overview} />

      <div className="home-grid">
        <section className="content-section home-week">
          <div className="content-section__header">
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
