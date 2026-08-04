import { ArrowRight, Check, Gauge, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";

import { buttonVariants } from "@/shared/ui/button";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Workout complete" };

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <PageTransition className="summary-page">
      <main className="summary-main">
        <TripleLane active="recover" compact morph />
        <ViewTransition default="none" name={`workout-session-${sessionId}`} share="session-morph">
          <div className="completion-mark">
            <Check aria-hidden="true" size={30} />
          </div>
        </ViewTransition>
        <h1>Session complete.</h1>
        <p>You kept the work controlled. This result is ready for the next plan review.</p>

        <dl className="summary-stats">
          <div>
            <dt>Total sets</dt>
            <dd className="data-value">12</dd>
          </div>
          <div>
            <dt>Training volume</dt>
            <dd className="data-value">2,160 kg</dd>
          </div>
          <div>
            <dt>Average effort</dt>
            <dd className="data-value">6.6 RPE</dd>
          </div>
        </dl>

        <section className="summary-highlight">
          <Medal aria-hidden="true" size={23} />
          <div>
            <h2>A steadier second half</h2>
            <p>Your average effort stayed inside today’s target range.</p>
          </div>
        </section>

        <section className="summary-highlight summary-highlight--neutral">
          <Gauge aria-hidden="true" size={23} />
          <div>
            <h2>No form score today</h2>
            <p>This session used manual logging, so FITAI will not invent a camera-based score.</p>
          </div>
        </section>

        <div className="summary-actions">
          <Link
            className={buttonVariants({ size: "large", variant: "primary" })}
            href="/home"
            transitionTypes={["nav-forward"]}
          >
            Done
          </Link>
          <Link className="text-action" href="/profile/progress" transitionTypes={["nav-forward"]}>
            <TrendingUp aria-hidden="true" size={18} />
            View progress
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}
