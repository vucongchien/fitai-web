"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Minus,
  Share2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { getFatigueLevel } from "@/features/workout/domain/pose-metrics";
import type { SessionReport } from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import { ShareWorkoutModal } from "@/features/workout/ui/live/share-workout-modal";
import { buttonVariants } from "@/shared/ui/button";
import { PageTransition } from "@/shared/ui/page-transition";

let lastRawReport: string | null = null;
let cachedReport: SessionReport | null = null;
let lastSessionId: string | null = null;

function getReportSnapshot(sessionId: string): SessionReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(reportStorageKey(sessionId));
    if (raw === lastRawReport && sessionId === lastSessionId) {
      return cachedReport;
    }
    lastRawReport = raw;
    lastSessionId = sessionId;
    cachedReport = raw ? (JSON.parse(raw) as SessionReport) : null;
    return cachedReport;
  } catch {
    return null;
  }
}

const emptySubscribe = () => () => {};

export function WorkoutSummaryView({ sessionId }: { sessionId: string }) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const report = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => getReportSnapshot(sessionId),
    () => null,
  );

  if (!isClient) {
    return (
      <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-4 sm:pt-6 pb-12">
        <div className="w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-6 sm:p-8">
          <main className="summary-main !w-full !max-w-none !m-0 !p-0">
            <div className="completion-mark bg-[var(--color-surface-subtle)] animate-pulse" />
            <p className="utility-label">Loading session summary...</p>
          </main>
        </div>
      </PageTransition>
    );
  }

  if (!report) {
    return (
      <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-4 sm:pt-6 pb-12">
        <div className="w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-6 sm:p-8">
          <main className="summary-main !w-full !max-w-none !m-0 !p-0">
            <div className="completion-mark bg-[var(--color-surface-subtle)] text-[var(--color-danger)]">
              <AlertCircle aria-hidden="true" size={30} />
            </div>

            <h1>Session Summary Unavailable</h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              This session data could not be loaded.
            </p>

            <div className="summary-actions">
              <Link className={buttonVariants({ size: "large", variant: "primary" })} href="/home">
                Return Home
              </Link>
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

  const formattedVolume = new Intl.NumberFormat("en-US").format(report.totalVolumeKg);
  const comparison = volumeComparison(report.totalVolumeKg, report.recentAvgVolumeKg);

  return (
    <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-4 sm:pt-6 pb-12">
      <div className="w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-6 sm:p-8">
        <main className="summary-main !w-full !max-w-none !m-0 !p-0">
          <Link aria-label="Back to home" className="summary-back" href="/home">
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>

          <div className="completion-mark">
            <Check aria-hidden="true" size={30} />
          </div>

          <p className="utility-label">Nice work</p>

          <h1>Session complete.</h1>

          {/* Calculate fatigue percentage on a 100% scale */}
          {(() => {
            const fatiguePct =
              report.averageRpe && report.averageRpe > 0
                ? Math.min(100, Math.max(10, Math.round((report.averageRpe / 10) * 100)))
                : Math.min(100, Math.max(30, Math.round((report.totalSets / 10) * 75)));

            const { color, label } = getFatigueLevel(fatiguePct);

            return (
              <>
                <dl className="summary-stats summary-stats--pair" style={{ marginBottom: "20px" }}>
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
                  <div>
                    <dt>Fatigue Level</dt>
                    <dd className="data-value" style={{ color }}>
                      {fatiguePct}%
                    </dd>
                  </div>
                </dl>

                {/* Visual Fatigue Progress Bar */}
                <div
                  style={{
                    background: "var(--color-surface-subtle)",
                    padding: "14px 18px",
                    borderRadius: "var(--radius-card)",
                    border: "1px solid var(--color-border)",
                    marginBottom: "32px",
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ color: "var(--color-text)" }}>Physical Exertion Index</span>
                    <span style={{ color, fontWeight: 700 }}>{label}</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      background: "var(--color-border)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${fatiguePct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "999px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </>
            );
          })()}

          {comparison ? (
            <section className="summary-compare" data-direction={comparison.direction}>
              {comparison.direction === "up" ? (
                <TrendingUp aria-hidden="true" size={20} />
              ) : comparison.direction === "down" ? (
                <TrendingDown aria-hidden="true" size={20} />
              ) : (
                <Minus aria-hidden="true" size={20} />
              )}
              <p>{comparison.text}</p>
            </section>
          ) : null}

          {report.personalRecords.length > 0 ? (
            <section className="summary-highlight">
              <Trophy aria-hidden="true" size={23} />
              <div>
                <h2>{report.personalRecords.length === 1 ? "New record" : "New records"}</h2>
                <p>
                  {report.personalRecords
                    .map((pr) => `${pr.name} — ${pr.oneRepMaxKg} kg`)
                    .join(", ")}
                </p>
              </div>
            </section>
          ) : null}

          <div className="summary-actions flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isShared}
              onClick={() => setShareModalOpen(true)}
              className={buttonVariants({
                size: "large",
                variant: isShared ? "secondary" : "quiet",
                className: "gap-2 w-full justify-center !border !border-neutral-300",
              })}
            >
              {isShared ? (
                <>
                  <Check size={18} className="text-emerald-600" />
                  Shared to Community
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  Share to Community
                </>
              )}
            </button>
            <Link className={buttonVariants({ size: "large", variant: "primary", className: "w-full justify-center" })} href="/home">
              Done
            </Link>
          </div>

          <ShareWorkoutModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            report={report}
            onSuccess={() => {
              setIsShared(true);
              toast.success("Workout shared to Community Activity Feed!");
            }}
          />
        </main>
      </div>
    </PageTransition>
  );
}

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
