"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Swords, Zap } from "lucide-react";
import Link from "next/link";

import { fetchActiveMatchClient } from "@/features/solo-match/api/solo-match-client";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ChallengeEntryCardProps {
  initialActiveMatch?: SoloMatchSummary | null;
}

export function ChallengeEntryCard({ initialActiveMatch = null }: ChallengeEntryCardProps) {
  const { data: activeMatch = initialActiveMatch } = useQuery({
    queryKey: ["solo-match", "active"],
    queryFn: async () => {
      const match = await fetchActiveMatchClient();
      return match && (match.status === "PENDING_READY" || match.status === "IN_PROGRESS")
        ? match
        : null;
    },
    initialData: initialActiveMatch ?? undefined,
  });

  const hasActive =
    activeMatch !== null &&
    (activeMatch.status === "PENDING_READY" || activeMatch.status === "IN_PROGRESS");

  if (hasActive && activeMatch) {
    const targetHref =
      activeMatch.status === "IN_PROGRESS" ? `/challenge/${activeMatch.matchId}` : "/challenge";

    return (
      <section aria-label="Active Solo Challenge" className="w-full">
        <Link
          className="group block w-full rounded-[20px] border-2 border-[var(--color-action)] bg-white p-5 transition-all hover:bg-[var(--color-action-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] focus-visible:ring-offset-2"
          href={targetHref}
          transitionTypes={NAV_FORWARD}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-action)] text-white">
                <Zap aria-hidden="true" size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action-soft)] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[var(--color-action)] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action)]" />
                    Live Match Active
                  </span>
                </div>
                <h3 className="mt-1 truncate text-base font-bold text-[var(--color-text)]">
                  {activeMatch.exerciseName} ·{" "}
                  {activeMatch.challengeType === "DURATION" ? "Endurance Hold" : "Max Reps"}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {activeMatch.status === "IN_PROGRESS"
                    ? "Your 1v1 duel is in progress. Tap to rejoin the arena."
                    : "Opponent matched! Check in within 60s to start."}
                </p>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] transition-transform group-hover:translate-x-0.5">
              <ArrowRight aria-hidden="true" size={18} />
            </div>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="1v1 Solo Challenge" className="w-full">
      <Link
        className="group block w-full rounded-[20px] border border-neutral-200 bg-white p-5 transition-colors hover:border-[var(--color-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] focus-visible:ring-offset-2"
        href="/challenge"
        transitionTypes={NAV_FORWARD}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-action-soft)] text-[var(--color-action)]">
              <Swords aria-hidden="true" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--color-action-soft)] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[var(--color-action)] uppercase">
                  1v1 Live AI Referee
                </span>
              </div>
              <h3 className="mt-1 truncate text-base font-bold text-[var(--color-text)]">
                Solo Challenge Arena
              </h3>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                Match in real time or pace against your Personal Record.
              </p>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-[var(--color-text)] transition-colors group-hover:bg-[var(--color-action)] group-hover:text-white">
            <ArrowRight aria-hidden="true" size={18} />
          </div>
        </div>
      </Link>
    </section>
  );
}
