import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface HomeViewProps {
  data: HomePageData;
}

export function HomeView({ data }: HomeViewProps) {
  return (
    <>
      <CoachNote message={data.coachNote} />

      <div className="home-grid">
        <section className="content-section home-week">
          <div className="content-section__header">
            <h2>Today&rsquo;s plan</h2>
            <p>Meals and sessions in order</p>
          </div>

          <TodayTimeline items={data.todayTimeline} />

          <Link className="text-action" href="/roadmap" transitionTypes={NAV_FORWARD}>
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
