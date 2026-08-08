"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
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
  const comparison = volumeComparison(report.totalVolumeKg, report.recentAvgVolumeKg);

  return (
    <PageTransition className="summary-page">
      <main className="summary-main">
        {/* The summary is a destination, not a trap: it needs a way out that is
            not "Done". Back goes home, same as Done, but reads as reversible. */}
        <Link aria-label="Back to home" className="summary-back" href="/home">
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>

        <div className="completion-mark">
          <Check aria-hidden="true" size={30} />
        </div>

        <h1>Session complete.</h1>

        {/* Two numbers, not five. Duration and volume are what the session
            actually was; RPE and form score were self-reported or absent, and a
            wall of stats buries the one thing the user came here to see. */}
        <dl className="summary-stats summary-stats--pair">
          <div>
            <dt>Time</dt>
            <dd className="data-value">{report.durationMin} min</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd className="data-value">
              {report.totalVolumeKg > 0 ? `${formattedVolume} kg` : "Bodyweight"}
            </dd>
          </div>
          <div>
            <dt>Completed Sets</dt>
            <dd className="data-value">{`${report.totalSets} sets`}</dd>
          </div>
        </dl>

        {comparison ? (
          <section className="summary-compare" data-direction={comparison.direction}>
            {comparison.direction === "up" ? (
              <TrendingUp aria-hidden="true" size={20} />
            ) : (comparison.direction === "down" ? (
              <TrendingDown aria-hidden="true" size={20} />
            ) : (
              <Minus aria-hidden="true" size={20} />
            ))}
            <p>{comparison.text}</p>
          </section>
        ) : null}

        {report.personalRecords.length > 0 ? (
          <section className="summary-highlight">
            <Trophy aria-hidden="true" size={23} />
            <div>
              <h2>{report.personalRecords.length === 1 ? "New record" : "New records"}</h2>
              <p>
                {report.personalRecords.map((pr) => `${pr.name} — ${pr.oneRepMaxKg} kg`).join(", ")}
              </p>
            </div>
          </section>
        ) : null}

        <div className="summary-actions">
          <Link className={buttonVariants({ size: "large", variant: "primary" })} href="/home">
            Done
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}

/**
 * How this session compares with the user's recent average volume.
 *
 * Returns null when there is no history to compare against — an invented
 * baseline would make "up 100%" out of a first-ever session. Within ±5% counts
 * as holding steady rather than a change worth a percentage.
 */
function volumeComparison(
  volumeKg: number,
  recentAvgKg: number,
): { direction: "up" | "down" | "level"; text: string } | null {
  if (recentAvgKg <= 0 || volumeKg <= 0) {
    return null;
  }

  const deltaPct = Math.round((volumeKg / recentAvgKg - 1) * 100);

  if (Math.abs(deltaPct) <= 5) {
    return { direction: "level", text: "Right in line with your recent average." };
  }
  if (deltaPct > 0) {
    return { direction: "up", text: `${deltaPct}% more volume than your recent average.` };
  }
  return {
    direction: "down",
    text: `${Math.abs(deltaPct)}% less volume than your recent average.`,
  };
}
