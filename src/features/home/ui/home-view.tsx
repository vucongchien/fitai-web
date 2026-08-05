import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { NutritionSummary } from "@/features/home/ui/nutrition-summary";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";

type HomeViewProps = {
  data: HomePageData;
};

export function HomeView({ data }: HomeViewProps) {
  return (
    <>
      <CoachNote message={data.coachNote} />

      <div className="home-grid">
        <section className="content-section home-week">
          <TodayTimeline items={data.todayTimeline} />

          <Link className="text-action" href="/roadmap" transitionTypes={["nav-forward"]}>
            Open the four-week roadmap
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        <aside className="home-side">
          <EvidenceSection items={data.evidenceItems} />
          <NutritionSummary summary={data.nutritionSummary} />
        </aside>
      </div>

      <QuickActionsFab actions={data.quickActions} />
    </>
  );
}
