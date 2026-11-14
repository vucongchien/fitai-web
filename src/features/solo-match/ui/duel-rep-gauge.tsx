"use client";

import { computeSoloRepProgressPercent } from "@/features/solo-match/domain/match-state";
import type { SoloChallengeType } from "@/features/solo-match/model/solo-match.types";

export interface DuelRepGaugeProps {
  challengeType: SoloChallengeType;
  currentAngle: number;
  exerciseId: string;
  lastRepConfirmedAtMs?: number;
  myFormScore: number;
}

const REP_THRESHOLD_PERCENT = 85;

export function DuelRepGauge({
  challengeType,
  currentAngle,
  exerciseId,
  lastRepConfirmedAtMs = 0,
  myFormScore,
}: DuelRepGaugeProps) {
  const percent = computeSoloRepProgressPercent({
    challengeType,
    currentAngle,
    exerciseId,
    myFormScore,
  });

  const showRepThreshold = challengeType !== "DURATION";
  const isAboveThreshold = showRepThreshold && percent >= REP_THRESHOLD_PERCENT;

  const fillClass =
    percent >= REP_THRESHOLD_PERCENT
      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"
      : percent >= 50
        ? "bg-[var(--color-action)]"
        : "bg-sky-400";

  const label = challengeType === "DURATION" ? "FORM" : "REP";

  return (
    <div
      aria-label={`${label} progress ${percent}%`}
      className="pointer-events-none absolute right-2.5 sm:right-3.5 top-14 bottom-16 z-20 flex flex-col items-center justify-center"
      data-mode={challengeType}
      data-percent={percent}
      data-testid="duel-rep-gauge"
    >
      <div className="relative flex h-full max-h-[210px] items-center">
        <div className="relative flex h-full w-3 sm:w-3.5 flex-col justify-end overflow-hidden rounded-full bg-black/55 backdrop-blur-sm border border-white/25">
          <div
            className={`w-full rounded-full transition-[height,background-color] duration-100 ease-out ${fillClass}`}
            style={{ height: `${percent}%` }}
          />
          {lastRepConfirmedAtMs > 0 ? (
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-emerald-300/80"
              key={lastRepConfirmedAtMs}
              style={{ animation: "soloRepFlash 450ms ease-out forwards" }}
            />
          ) : null}
        </div>

        {/* Rep-count threshold marker line at 85% (REPS mode only) */}
        {showRepThreshold ? (
          <div
            className="pointer-events-none absolute z-10 flex items-center"
            data-testid="duel-rep-threshold"
            data-threshold={REP_THRESHOLD_PERCENT}
            style={{
              bottom: `${REP_THRESHOLD_PERCENT}%`,
              left: "-4px",
              right: "-4px",
              transform: "translateY(50%)",
            }}
          >
            <div
              className={`h-0.5 w-full rounded-full ${
                isAboveThreshold
                  ? "bg-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.95)]"
                  : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.95)]"
              }`}
            />
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes soloRepFlash {
          0% { opacity: 0.95; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
