"use client";

import { AlertCircle, ArrowRight, Check, Gauge, Medal, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { buttonVariants } from "@/shared/ui/button";
import { PageTransition } from "@/shared/ui/page-transition";

export function WorkoutSummaryView({ sessionId }: { sessionId: string }) {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(reportStorageKey(sessionId));
      if (raw) {
        const parsed = JSON.parse(raw) as SessionReport;
        setReport(parsed);
      } else {
        setError("No workout report was found for this session.");
      }
    } catch {
      setError("Failed to parse the workout report.");
    } finally {
      setLoaded(true);
    }
  }, [sessionId]);

  if (!loaded) {
    return (
      <PageTransition className="summary-page">
        <main className="summary-main">
          <div className="completion-mark bg-[var(--color-surface-subtle,#eceef0)] animate-pulse" />
          <p className="utility-label">Loading session summary...</p>
        </main>
      </PageTransition>
    );
  }

  if (error || !report) {
    return (
      <PageTransition className="summary-page">
        <main className="summary-main">
          <div className="completion-mark bg-[var(--color-surface-subtle,#eceef0)] text-[var(--color-danger,#c92f42)]">
            <AlertCircle aria-hidden="true" size={30} />
          </div>

          <h1>Session Summary Unavailable</h1>
          <p className="text-sm text-[var(--color-text-muted,#50565c)] mb-6">
            {error ?? "This session data could not be loaded."}
          </p>

          <div className="summary-actions">
            <Link className={buttonVariants({ size: "large", variant: "primary" })} href="/home">
              Return Home
            </Link>
          </div>
        </main>
      </PageTransition>
    );
  }

  const formattedVolume = new Intl.NumberFormat("en-US").format(report.totalVolumeKg);

  return (
    <PageTransition className="summary-page">
      <main className="summary-main">
        <div className="completion-mark">
          <Check aria-hidden="true" size={30} />
        </div>

        <h1>Session complete.</h1>
        <p>You kept the work controlled. This result is ready for the next plan review.</p>

        <dl className="summary-stats">
          <div>
            <dt>Total sets</dt>
            <dd className="data-value">{report.totalSets}</dd>
          </div>
          <div>
            <dt>Training volume</dt>
            <dd className="data-value">{`${formattedVolume} kg`}</dd>
          </div>
          <div>
            <dt>Average effort</dt>
            <dd className="data-value">
              {report.averageRpe !== null ? `${report.averageRpe.toFixed(1)} RPE` : "N/A"}
            </dd>
          </div>
        </dl>

        {report.personalRecords.length > 0 ? (
          <section className="summary-highlight">
            <Trophy aria-hidden="true" size={23} />
            <div>
              <h2>New Personal Records!</h2>
              <p>
                {report.personalRecords
                  .map((pr) => `${pr.name} (${pr.oneRepMaxKg} kg 1RM)`)
                  .join(", ")}
              </p>
            </div>
          </section>
        ) : (
          <section className="summary-highlight">
            <Medal aria-hidden="true" size={23} />
            <div>
              <h2>A steadier session</h2>
              <p>Your average effort stayed inside today’s target range.</p>
            </div>
          </section>
        )}

        {report.averageFormScore !== null ? (
          <section className="summary-highlight summary-highlight--neutral">
            <Gauge aria-hidden="true" size={23} />
            <div>
              <h2>Form Score: {Math.round(report.averageFormScore)}%</h2>
              <p>AI Camera tracked your motion and form quality throughout the session.</p>
            </div>
          </section>
        ) : (
          <section className="summary-highlight summary-highlight--neutral">
            <Gauge aria-hidden="true" size={23} />
            <div>
              <h2>No form score today</h2>
              <p>This session used manual logging, so FITAI will not invent a camera-based score.</p>
            </div>
          </section>
        )}

        <div className="summary-actions">
          <Link
            className={buttonVariants({ size: "large", variant: "primary" })}
            href="/home"
          >
            Done
          </Link>
          <Link className="text-action" href="/profile/progress">
            <TrendingUp aria-hidden="true" size={18} />
            View progress
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}
