import { ArrowRight, Dumbbell, Salad, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { NextSessionPanel } from "@/features/roadmap/ui/next-session-panel";
import { WeekRoute } from "@/features/roadmap/ui/week-route";
import { activeRoadmap, nextSession, sessions } from "@/shared/lib/demo-data";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home" };

export default function HomePage() {
  return (
    <PageTransition className="page home-page">
      <NextSessionPanel session={nextSession} />

      <div className="home-grid">
        <section className="content-section home-week">
          <div className="content-section__header">
            <h2>This week</h2>
            <p>{activeRoadmap.progressLabel}</p>
          </div>
          <WeekRoute morphNextSession={false} sessions={sessions} />
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

          <section className="recovery-note">
            <span aria-hidden="true" className="recovery-note__icon">
              <ShieldCheck size={21} />
            </span>
            <div>
              <h2>Recovery is on course</h2>
              <p>No active injury constraints. Friday stays at the planned intensity.</p>
            </div>
          </section>

          <section className="nutrition-line">
            <Salad aria-hidden="true" size={21} />
            <div>
              <strong>Today’s nutrition</strong>
              <span>1,420 of 2,050 kcal logged</span>
            </div>
          </section>
        </aside>
      </div>
    </PageTransition>
  );
}
