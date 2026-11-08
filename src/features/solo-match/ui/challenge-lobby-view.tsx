"use client";

import {
  AlertCircle,
  Camera,
  Radio,
  RotateCcw,
  Shield,
  Swords,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";

import {
  BOT_FALLBACK_MAX_SECONDS,
  BOT_FALLBACK_NOTICE_SECONDS,
  formatSecondsClock,
} from "@/features/solo-match/domain/match-state";
import type { ChallengePageData } from "@/features/solo-match/model/solo-match.types";
import { useMatchmaking } from "@/features/solo-match/model/use-matchmaking";
import { ChallengeHistoryList } from "@/features/solo-match/ui/challenge-history-list";
import { ChallengeMatchedCard } from "@/features/solo-match/ui/challenge-matched-card";
import { DuelHeroAnimation } from "@/features/solo-match/ui/duel-hero-animation";

interface ChallengeLobbyViewProps {
  data: ChallengePageData;
}

export function ChallengeLobbyView({ data }: ChallengeLobbyViewProps) {
  const { cancelQueue, resetToIdle, startQueue, state } = useMatchmaking(data.activeMatch);

  return (
    <>
      {/* Standard Clean Page Header */}
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
            Solo Challenge
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Live 1v1 arena with real-time AI referee
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors shadow-2xs"
          title="View Leaderboard"
        >
          <Trophy className="size-3.5 text-amber-500" />
          <span>Leaderboard</span>
        </Link>
      </header>

      <div className="px-5 sm:px-6 pb-12 bg-white">
        {/* Primary Stage: Matched / Expired / Error / Hero (Idle & Queued) */}
        {state.phase === "matched" && state.activeMatch ? (
          <div className="pt-2 pb-6">
            <ChallengeMatchedCard
              currentUserId={data.currentUserId}
              match={state.activeMatch}
              remainingReadySeconds={state.remainingReadySeconds}
            />
          </div>
        ) : state.phase === "expired" || state.phase === "error" ? (
          <section
            aria-live="polite"
            className="my-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)]">
                <AlertCircle aria-hidden="true" size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  {state.phase === "expired"
                    ? "Check-in Window Expired"
                    : "Matchmaking Interrupted"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {state.errorMessage ||
                    "The match could not be started in time. You can jump right back into the queue whenever you are ready."}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-4 text-sm font-bold text-white transition-colors hover:bg-[var(--color-action-hover)] active:scale-[0.99]"
                onClick={startQueue}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                <span>Find New Match</span>
              </button>
              <button
                className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-neutral-50 active:scale-[0.99]"
                onClick={resetToIdle}
                type="button"
              >
                <span>Back to Lobby</span>
              </button>
            </div>
          </section>
        ) : (
          /* Sleek, unboxed Arena Action area with zero layout shift on search */
          <section className="pt-2 pb-8">
            {/* Visualized Pushup Duel Animation */}
            <div className="mb-4">
              <DuelHeroAnimation />
            </div>

            {/* In-place transition: 3 Telemetry Badges <-> Elapsed Search Timer */}
            {state.phase === "queued" ? (
              <div
                aria-busy="true"
                aria-live="polite"
                className="flex h-[76px] flex-col justify-between rounded-xl bg-neutral-50/90 px-4 py-2 text-center border border-neutral-100"
              >
                <div className="flex items-center justify-between w-full text-[11px] font-semibold text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-action)]">
                    <Radio aria-hidden="true" className="animate-pulse" size={13} />
                    Searching challenger
                  </span>
                  <span className="tabular-nums text-[10px] text-neutral-400 font-semibold">
                    PR Pace at 05:00
                  </span>
                </div>

                <div
                  className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] tabular-nums"
                  data-testid="queue-elapsed-timer"
                >
                  {formatSecondsClock(state.elapsedSeconds)}
                </div>

                <div className="w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-action)] transition-all duration-500 motion-reduce:transition-none"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.min(
                            100,
                            Math.round(
                              (Math.max(0, state.elapsedSeconds) / BOT_FALLBACK_MAX_SECONDS) * 100,
                            ),
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {state.elapsedSeconds >= BOT_FALLBACK_NOTICE_SECONDS ? (
                  <p className="mt-1 text-[10px] leading-tight text-[var(--color-text-muted)]">
                    At 05:00, you will race against your Personal Record pace.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid h-[76px] grid-cols-3 gap-2 sm:gap-2.5">
                <div className="flex h-full flex-col items-center justify-center rounded-xl bg-neutral-50/90 py-1.5 px-2 text-center border border-neutral-100">
                  <Timer aria-hidden="true" className="text-[var(--color-action)] mb-1" size={17} />
                  <div className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                    60s Check-in
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Ready window
                  </div>
                </div>

                <div className="flex h-full flex-col items-center justify-center rounded-xl bg-neutral-50/90 py-1.5 px-2 text-center border border-neutral-100">
                  <Camera
                    aria-hidden="true"
                    className="text-[var(--color-action)] mb-1"
                    size={17}
                  />
                  <div className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                    20 FPS AI
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Strict referee
                  </div>
                </div>

                <div className="flex h-full flex-col items-center justify-center rounded-xl bg-neutral-50/90 py-1.5 px-2 text-center border border-neutral-100">
                  <Shield
                    aria-hidden="true"
                    className="text-[var(--color-action)] mb-1"
                    size={17}
                  />
                  <div className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                    45s Grace
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Drop protection
                  </div>
                </div>
              </div>
            )}

            {/* In-place Action Button: Find Match <-> Cancel Search */}
            <div className="mt-4">
              {state.phase === "queued" ? (
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200/80 text-[var(--color-text)] px-5 text-sm font-bold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] cursor-pointer"
                  data-testid="cancel-queue-button"
                  onClick={cancelQueue}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                  <span>Cancel Search</span>
                </button>
              ) : (
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[var(--color-action-hover)] active:scale-[0.99] cursor-pointer"
                  data-testid="find-match-button"
                  onClick={startQueue}
                  type="button"
                >
                  <Swords aria-hidden="true" size={18} />
                  <span>Find Match</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Recent Matches Section (Edge-to-edge separator with generous spacing) */}
        <section aria-labelledby="challenge-history-heading" className="content-section pt-6">
          <div className="content-section__header mb-3">
            <h2
              className="text-base font-bold text-[var(--color-text)]"
              id="challenge-history-heading"
            >
              Recent Matches
            </h2>
            <span className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
              {data.history.length} {data.history.length === 1 ? "record" : "records"}
            </span>
          </div>

          <ChallengeHistoryList currentUserId={data.currentUserId} matches={data.history} />
        </section>
      </div>
    </>
  );
}
