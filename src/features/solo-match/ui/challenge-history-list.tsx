"use client";

import { ChevronRight, History, Trophy } from "lucide-react";
import Link from "next/link";

import {
  formatChallengeScore,
  resolveParticipants,
} from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ChallengeHistoryListProps {
  currentUserId: string;
  matches: SoloMatchSummary[];
}

function getOutcomeBadge(match: SoloMatchSummary, currentUserId: string) {
  const { me } = resolveParticipants(match, currentUserId);
  if (match.status === "CANCELLED") {
    return {
      className: "bg-neutral-100 text-[var(--color-text-muted)] border border-neutral-200/80",
      label: "Cancelled",
    };
  }
  if (match.isDraw || me?.result === "DRAW") {
    return {
      className: "bg-neutral-100 text-[var(--color-text)] border border-neutral-200",
      label: "Draw",
    };
  }
  const isWin =
    me?.result === "WIN" ||
    (Boolean(match.winnerId) && Boolean(me?.userId) && match.winnerId === me?.userId);
  if (isWin) {
    return {
      className:
        "bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[var(--color-border)]",
      label: "Victory",
    };
  }
  if (me?.result === "FORFEITED") {
    return {
      className: "bg-neutral-100 text-[var(--color-text-muted)] border border-neutral-200/80",
      label: "Forfeited",
    };
  }
  return {
    className: "bg-neutral-100 text-[var(--color-text)] border border-neutral-200",
    label: "Completed",
  };
}

export function ChallengeHistoryList({ currentUserId, matches }: ChallengeHistoryListProps) {
  if (matches.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-[var(--color-text-muted)]">
          <History aria-hidden="true" size={18} />
        </div>
        <h3 className="mt-2 text-sm font-bold text-[var(--color-text)]">No recent challenges</h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          Your completed 1v1 duels will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const { me, opponent } = resolveParticipants(match, currentUserId);
        const badge = getOutcomeBadge(match, currentUserId);
        const myScoreText = formatChallengeScore(me?.scoreValue ?? 0, match.challengeType);
        const oppScoreText = formatChallengeScore(opponent?.scoreValue ?? 0, match.challengeType);
        const dateLabel = match.endedAtIso || match.startedAtIso;

        return (
          <Link
            className="group flex items-center justify-between gap-3.5 rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-3.5 transition-all hover:bg-white hover:border-[var(--color-border)] hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] cursor-pointer"
            href={`/challenge/${match.matchId}/result`}
            key={match.matchId}
            transitionTypes={NAV_FORWARD}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                >
                  {badge.label === "Victory" ? <Trophy aria-hidden="true" size={10} /> : null}
                  {badge.label}
                </span>
                <span className="truncate text-sm font-bold text-[var(--color-text)]">
                  {match.exerciseName}
                </span>
                {dateLabel ? (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    ·{" "}
                    {new Date(dateLabel).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                vs{" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {opponent?.displayName || "Challenger"}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right tabular-nums">
                <div className="text-sm font-bold text-[var(--color-text)]">{myScoreText}</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Opp: {oppScoreText}
                </div>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--color-action)]"
                size={16}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
