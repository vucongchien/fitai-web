import { ArrowRight, Dumbbell, Salad, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { CoachNote } from "@/features/home/ui/coach-note";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayHeader } from "@/features/home/ui/today-header";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { todayTimelineItems } from "@/shared/lib/demo-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home — Today" };

export default function HomePage() {
  const coachNotice = "Intensity reduced today based on your recovery feedback.";

  return (
    <PageTransition className="page home-page">
      <TodayHeader streakDays={4} />

      <CoachNote message={coachNotice} />

      <div className="home-grid">
        <section className="content-section home-week">
          <TodayTimeline items={todayTimelineItems} />

          <Link className="text-action" href="/roadmap" transitionTypes={["nav-forward"]}>
            Open the four-week roadmap
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        <aside className="home-side">
          <section className="content-section evidence-list">
            <div className="content-section__header">
              <h2>Recent evidence</h2>
            </div>
            <div className="evidence-list__item">
              <Dumbbell aria-hidden="true" size={20} />
              <div>
                <strong className="data-value">8,460 kg</strong>
                <span>Training volume this week</span>
              </div>
            </div>
            <div className="evidence-list__item">
              <ShieldCheck aria-hidden="true" size={20} />
              <div>
                <strong className="data-value">6.4 RPE</strong>
                <span>Controlled average effort</span>
              </div>
            </div>
          </section>

          <section className="nutrition-line">
            <Salad aria-hidden="true" size={21} />
            <div>
              <strong>Today&rsquo;s nutrition</strong>
              <span>1,420 of 2,050 kcal logged</span>
            </div>
          </section>
        </aside>
      </div>

      {/* Floating Action Button only for Home */}
      <QuickActionsFab />
    </PageTransition>
  );
}
