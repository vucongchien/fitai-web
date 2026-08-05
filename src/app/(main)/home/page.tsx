import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { getHomePageData } from "@/shared/api/bff/home/queries";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { NutritionSummary } from "@/features/home/ui/nutrition-summary";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayHeader } from "@/features/home/ui/today-header";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home — Today" };

async function HomeContent() {
  const data = await getHomePageData();

  return (
    <>
      <TodayHeader streakDays={data.streak.days} />

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

function HomeSkeleton() {
  return (
    <div className="home-skeleton" aria-label="Loading home content">
      <div className="skeleton-box" style={{ height: "48px", width: "50%", marginBottom: "16px", borderRadius: "8px", background: "var(--color-surface-hover, #eee)" }} />
      <div className="skeleton-box" style={{ height: "240px", width: "100%", borderRadius: "12px", background: "var(--color-surface-hover, #eee)" }} />
    </div>
  );
}

export default function HomePage() {
  return (
    <PageTransition className="page home-page">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </PageTransition>
  );
}
