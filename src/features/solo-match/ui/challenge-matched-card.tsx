"use client";

import { ArrowRight, Clock, Dumbbell, Swords, UserRound } from "lucide-react";
import Link from "next/link";

import {
  CHECKIN_WINDOW_SECONDS,
  resolveParticipants,
} from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ChallengeMatchedCardProps {
  currentUserId: string;
  match: SoloMatchSummary;
  remainingReadySeconds: number;
}

export function ChallengeMatchedCard({
  currentUserId,
  match,
  remainingReadySeconds,
}: ChallengeMatchedCardProps) {
  const { me, opponent } = resolveParticipants(match, currentUserId);
  const isInProgress = match.status === "IN_PROGRESS";
  const progressRatio = Math.max(
    0,
    Math.min(100, Math.round((remainingReadySeconds / CHECKIN_WINDOW_SECONDS) * 100)),
  );

  return (
    <section
      aria-live="assertive"
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs"
    >
      {/* Top Status & Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action-soft)] px-3 py-1 text-xs font-bold tracking-wider text-[var(--color-action)] uppercase">
          <Swords aria-hidden="true" size={13} />
          {isInProgress ? "Match In Progress" : "Opponent Matched"}
        </span>

        {!isInProgress ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1 text-xs font-bold text-[var(--color-text)] border border-neutral-100">
            <Clock aria-hidden="true" className="text-[var(--color-action)]" size={13} />
            <span>Check-in:</span>
            <span
              className="text-sm font-extrabold text-[var(--color-action)] tabular-nums"
              data-testid="checkin-countdown"
            >
              {remainingReadySeconds}s
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action-soft)] px-3 py-1 text-xs font-bold text-[var(--color-action)]">
            Live Arena Open
          </span>
        )}
      </div>

      {/* Selected Exercise Banner */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3 sm:p-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-action)] text-white">
            <Dumbbell aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
              Assigned Challenge
            </p>
            <h3 className="truncate text-base sm:text-lg font-bold text-[var(--color-text)]">
              {match.exerciseName}
            </h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] sm:text-xs font-bold text-[var(--color-action)]">
          {match.challengeType === "DURATION" ? "Endurance Hold" : "Max Reps"}
        </span>
      </div>

      {/* Head-to-Head Players */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-action-soft)]/50 p-3 sm:p-4 text-center">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--color-action)] text-xs sm:text-sm font-bold text-white shadow-xs">
            {(me?.displayName || "You").slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-2 truncate max-w-full text-xs sm:text-sm font-bold text-[var(--color-action)]">
            {me?.displayName || "You"}
          </p>
          <span className="mt-0.5 text-[10px] sm:text-[11px] font-semibold text-neutral-500">
            Challenger
          </span>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 sm:p-4 text-center">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-neutral-700 text-xs sm:text-sm font-bold text-white shadow-xs">
            {opponent?.displayName ? (
              opponent.displayName.slice(0, 2).toUpperCase()
            ) : (
              <UserRound aria-hidden="true" size={18} />
            )}
          </div>
          <p className="mt-2 truncate max-w-full text-xs sm:text-sm font-bold text-[var(--color-text)]">
            {opponent?.displayName || "Opponent"}
          </p>
          <span className="mt-0.5 text-[10px] sm:text-[11px] font-semibold text-[var(--color-text-muted)]">
            Rival
          </span>
        </div>
      </div>

      {/* 60-Second Check-in Progress Bar */}
      {!isInProgress ? (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--color-action)] transition-all duration-300 motion-reduce:transition-none"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-[11px] sm:text-xs text-[var(--color-text-muted)]">
            Enter the arena before the check-in timer expires.
          </p>
        </div>
      ) : null}

      {/* Primary Action CTA */}
      <div className="mt-5">
        <Link
          className="flex h-12 sm:h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-6 text-sm sm:text-base font-bold text-white shadow-xs transition-all hover:bg-[var(--color-action-hover)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)]"
          data-testid="enter-arena-link"
          href={`/challenge/${match.matchId}`}
          transitionTypes={NAV_FORWARD}
        >
          <span>{isInProgress ? "Resume Live Duel" : "Enter Arena"}</span>
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
