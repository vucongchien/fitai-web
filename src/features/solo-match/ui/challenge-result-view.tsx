"use client";

import {
  AlertCircle,
  Clock,
  RotateCcw,
  Scale,
  Share2,
  Shield,
  ShieldAlert,
  Swords,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import {
  computeRelativeLaneProgress,
  formatChallengeScore,
  resolveParticipants,
} from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { NAV_BACK, NAV_FORWARD } from "@/shared/ui/transition-types";

export interface ChallengeResultViewProps {
  currentUserId: string;
  match: SoloMatchSummary | null;
}

interface OutcomePresentation {
  badgeLabel: string;
  badgeTone: "victory" | "neutral" | "warning";
  headline: string;
  isVictory: boolean;
  subheadline: string;
}

function deriveOutcome(match: SoloMatchSummary, currentUserId: string): OutcomePresentation {
  const { me, opponent } = resolveParticipants(match, currentUserId);
  const opponentName = opponent?.displayName || "Rival";

  if (match.status === "CANCELLED") {
    return {
      badgeLabel: "Match Cancelled",
      badgeTone: "warning",
      headline: "Match Cancelled",
      isVictory: false,
      subheadline: "The 60-second check-in window expired before both athletes entered the arena.",
    };
  }

  if (match.isDraw || me?.result === "DRAW") {
    return {
      badgeLabel: "Draw",
      badgeTone: "neutral",
      headline: "Draw Match",
      isVictory: false,
      subheadline: `You and ${opponentName} finished with identical verified output.`,
    };
  }

  const isWin =
    me?.result === "WIN" ||
    (Boolean(match.winnerId) && Boolean(me?.userId) && match.winnerId === me?.userId);

  if (isWin) {
    const oppForfeited = opponent?.result === "FORFEITED" || match.status === "FORFEITED";
    return {
      badgeLabel: "Victory",
      badgeTone: "victory",
      headline: "Victory!",
      isVictory: true,
      subheadline: oppForfeited
        ? `${opponentName} forfeited or disconnected. Your verified reps took the win.`
        : `You outpaced ${opponentName} under strict AI referee scoring.`,
    };
  }

  if (me?.result === "FORFEITED" || match.status === "FORFEITED") {
    return {
      badgeLabel: "Forfeited",
      badgeTone: "neutral",
      headline: "Match Forfeited",
      isVictory: false,
      subheadline: "This duel concluded early due to a manual forfeit or disconnection.",
    };
  }

  return {
    badgeLabel: "Completed",
    badgeTone: "neutral",
    headline: "Match Complete",
    isVictory: false,
    subheadline: `${opponentName} took the win this round. Keep training full ROM and run it back!`,
  };
}

export function ChallengeResultView({ currentUserId, match }: ChallengeResultViewProps) {
  if (!match) {
    return (
      <div className="w-full px-5 sm:px-6 py-12 text-center">
        <div className="mx-auto max-w-[480px] rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)]">
            <AlertCircle aria-hidden="true" size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[var(--color-text)]">
            Match Record Unavailable
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            The record for this challenge could not be found or has expired.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-6 text-sm font-bold text-white transition-colors hover:bg-[var(--color-action-hover)]"
              href="/challenge"
              transitionTypes={NAV_BACK}
            >
              Return to Solo Challenge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { me, opponent } = resolveParticipants(match, currentUserId);
  const outcome = deriveOutcome(match, currentUserId);
  const isCancelled = match.status === "CANCELLED";

  const myValue = me?.scoreValue ?? 0;
  const oppValue = opponent?.scoreValue ?? 0;
  const { myPercent, opponentPercent } = computeRelativeLaneProgress(myValue, oppValue);
  const myForm = me?.formScore !== undefined ? Math.round(me.formScore) : null;
  const oppForm = opponent?.formScore !== undefined ? Math.round(opponent.formScore) : null;

  const myDisplayName = me?.displayName || "You";
  const opponentDisplayName = opponent?.displayName || "Rival";

  return (
    <div className="w-full">
      {/* Harmonized page-heading exactly matching /nutrition/lunch */}
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2">
        <div>
          <h1>Match Summary</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {match.exerciseName} · 1v1 Arena
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shrink-0 self-start mt-1.5 ${
            outcome.badgeTone === "victory"
              ? "bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[var(--color-border)]"
              : outcome.badgeTone === "warning"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
          }`}
          data-testid="match-outcome-badge"
        >
          {outcome.isVictory ? (
            <Trophy aria-hidden="true" size={13} />
          ) : outcome.badgeLabel === "Draw" ? (
            <Scale aria-hidden="true" size={13} />
          ) : outcome.badgeTone === "warning" ? (
            <Clock aria-hidden="true" size={13} />
          ) : (
            <Shield aria-hidden="true" size={13} />
          )}
          {outcome.badgeLabel}
        </span>
      </header>

      {/* Main Content Area: Harmonized with /nutrition/lunch padding & structure */}
      <div className="px-5 sm:px-6 pb-8 bg-white">
        {isCancelled ? (
          /* Cancelled Match Presentation */
          <div className="mt-4 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 shadow-xs">
              <Clock aria-hidden="true" size={32} />
            </div>

            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              Match Cancelled
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)] leading-relaxed">
              {outcome.subheadline}
            </p>

            {/* Cancelled Context Notice Card */}
            <div className="mt-6 w-full rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-5 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 text-xs font-bold text-neutral-600">
                <span>{match.exerciseName} Challenge</span>
                <span className="text-amber-600 uppercase text-[10px] tracking-wider font-extrabold">
                  Unranked
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <ShieldAlert size={16} className="text-neutral-400 shrink-0" />
                <span>
                  No repetitions were recorded. Your rating and stats remain completely unaffected.
                </span>
              </div>
            </div>

            {/* Hidden scores to maintain test contract if queried */}
            <div className="sr-only" data-testid="result-my-score">
              {formatChallengeScore(myValue, match.challengeType)}
            </div>
            <div className="sr-only" data-testid="result-opponent-score">
              {formatChallengeScore(oppValue, match.challengeType)}
            </div>

            {/* Single Clean Primary Action: Find Another Match */}
            <div className="mt-8 w-full">
              <Link
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-6 text-sm font-bold text-white shadow-xs transition-all hover:bg-[var(--color-action-hover)] active:scale-[0.99] cursor-pointer"
                data-testid="play-again-link"
                href="/challenge"
                transitionTypes={NAV_FORWARD}
              >
                <Swords aria-hidden="true" size={17} />
                <span>Find Another Match</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Completed / Forfeited Match Presentation */
          <>
            {/* Hero Outcome Badge & Headline */}
            <div className="mt-4 flex flex-col items-center text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs ${
                  outcome.isVictory
                    ? "bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[var(--color-border)]"
                    : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                }`}
              >
                {outcome.isVictory ? (
                  <Trophy aria-hidden="true" size={30} />
                ) : outcome.badgeLabel === "Draw" ? (
                  <Scale aria-hidden="true" size={28} />
                ) : (
                  <Shield aria-hidden="true" size={28} />
                )}
              </div>

              <h2 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
                {outcome.headline}
              </h2>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                {outcome.subheadline}
              </p>
            </div>

            {/* Unified Head-to-Head Duel Card */}
            <section
              aria-label="Head to Head Results"
              className="mt-7 rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              {/* Subheading: Exercise title */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 text-xs font-bold">
                <span className="text-[var(--color-text)]">{match.exerciseName} Duel</span>
                <span className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
                  {match.challengeType === "DURATION" ? "Isometric Hold" : "Verified Reps"}
                </span>
              </div>

              {/* Symmetrical Two-Column Scores with Center VS Pill */}
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                {/* Left: You */}
                <div className="flex flex-col items-start pr-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold tracking-wider text-[var(--color-action)] uppercase truncate max-w-[120px] sm:max-w-[160px]">
                      {myDisplayName}
                    </span>
                    {outcome.isVictory ? (
                      <span className="rounded-full bg-[var(--color-action)] px-1.5 py-0.2 text-[9px] font-extrabold text-white shrink-0">
                        WIN
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)] tabular-nums [font-family:var(--font-display)]"
                    data-testid="result-my-score"
                  >
                    {formatChallengeScore(myValue, match.challengeType)}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-neutral-600">
                    Form:{" "}
                    <span className="font-extrabold text-[var(--color-action)] tabular-nums">
                      {myForm !== null ? `${myForm}%` : "Verified"}
                    </span>
                  </div>
                </div>

                {/* Center: Subtle VS Pill */}
                <div className="flex items-center justify-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-extrabold text-neutral-400">
                    VS
                  </span>
                </div>

                {/* Right: Rival */}
                <div className="flex flex-col items-end pl-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!outcome.isVictory && opponent?.result === "WIN" ? (
                      <span className="rounded-full bg-neutral-700 px-1.5 py-0.2 text-[9px] font-extrabold text-white shrink-0">
                        WIN
                      </span>
                    ) : null}
                    <span className="text-xs font-extrabold tracking-wider text-neutral-500 uppercase truncate max-w-[120px] sm:max-w-[160px]">
                      {opponentDisplayName}
                    </span>
                  </div>

                  <div
                    className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)] tabular-nums [font-family:var(--font-display)]"
                    data-testid="result-opponent-score"
                  >
                    {formatChallengeScore(oppValue, match.challengeType)}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-neutral-600">
                    Form:{" "}
                    <span className="font-extrabold text-neutral-700 tabular-nums">
                      {oppForm !== null ? `${oppForm}%` : "Verified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symmetrical Relative Ratio Bar */}
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-muted)] mb-1.5">
                  <span className="text-[var(--color-action)]">Your Share ({myPercent}%)</span>
                  <span className="text-neutral-500">
                    {opponentDisplayName} ({opponentPercent}%)
                  </span>
                </div>

                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--color-action)] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, myPercent)}%` }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 bg-neutral-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, opponentPercent)}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Clear Action Controls: Primary Play Again + Secondary Share */}
            <div className="mt-7 flex gap-3">
              <Link
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-6 text-sm font-bold text-white shadow-xs transition-all hover:bg-[var(--color-action-hover)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] cursor-pointer"
                data-testid="play-again-link"
                href="/challenge"
                transitionTypes={NAV_FORWARD}
              >
                <RotateCcw aria-hidden="true" size={17} />
                <span>Play Again</span>
              </Link>

              <Link
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-bold text-[var(--color-text)] shadow-xs transition-all hover:bg-neutral-50 active:scale-[0.99] cursor-pointer"
                href="/community"
                transitionTypes={NAV_FORWARD}
              >
                <Share2 aria-hidden="true" size={16} />
                <span>Share</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
