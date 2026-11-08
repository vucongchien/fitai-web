"use client";

import { AlertTriangle, Sparkles, WifiOff } from "lucide-react";

import {
  computeRelativeLaneProgress,
  formatChallengeScore,
} from "@/features/solo-match/domain/match-state";
import type { SoloChallengeType } from "@/features/solo-match/model/solo-match.types";
import type { SoloStreamStatusLabel } from "@/features/solo-match/model/use-solo-duel";

export interface DuelVersusHudProps {
  challengeType: SoloChallengeType;
  coachCue?: string;
  connectionPhase: string;
  currentAngle?: number;
  detectedErrors: string[];
  isDebug?: boolean;
  myDisplayName: string;
  myStatus: SoloStreamStatusLabel;
  myValue: number;
  opponentDisplayName: string;
  opponentStatus: SoloStreamStatusLabel;
  opponentValue: number;
}

export function DuelVersusHud({
  challengeType,
  connectionPhase,
  currentAngle = 0,
  isDebug = false,
  myDisplayName,
  myStatus: _myStatus,
  myValue,
  opponentDisplayName,
  opponentStatus,
  opponentValue,
}: DuelVersusHudProps) {
  const { myPercent, opponentPercent } = computeRelativeLaneProgress(myValue, opponentValue);

  const isReconnecting = connectionPhase === "reconnecting";
  const isOpponentDisconnected = opponentStatus === "DISCONNECTED";
  const isOpponentCompleted = opponentStatus === "COMPLETED";

  return (
    <div className="w-full max-w-[640px] mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-neutral-200/90 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: You (Relay Blue name, NO redundant '(YOU)', bold score without slashed zero) */}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[var(--color-action)] uppercase truncate max-w-full">
            {myDisplayName || "You"}
          </span>
          <span
            className="text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[var(--color-text)] [font-family:var(--font-display)]"
            data-testid="duel-my-score"
          >
            {formatChallengeScore(myValue, challengeType)}
          </span>
        </div>

        {/* Center: Symmetrical VS Pill & Tug-of-War Bar */}
        <div className="flex flex-col items-center justify-center w-14 sm:w-28 shrink-0 px-1">
          <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-neutral-100 text-[9px] sm:text-[10px] font-extrabold text-neutral-400 mb-0.5 sm:mb-1">
            VS
          </span>
          <div className="relative h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--color-action)] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, myPercent)}%` }}
            />
            <div
              className="absolute inset-y-0 right-0 bg-neutral-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, opponentPercent)}%` }}
            />
          </div>
        </div>

        {/* Right: Rival (Slate name, single-line truncate, bold score) */}
        <div className="flex flex-col items-end min-w-0 flex-1">
          <div className="flex items-center gap-1 max-w-full">
            {isOpponentDisconnected ? (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            ) : isOpponentCompleted ? (
              <span className="text-[8px] sm:text-[9px] font-bold text-neutral-400 uppercase shrink-0">
                [Done]
              </span>
            ) : null}
            <span className="truncate text-[10px] sm:text-xs font-bold tracking-wider text-neutral-600 uppercase">
              {opponentDisplayName || "Rival"}
            </span>
          </div>
          <span
            className="text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[var(--color-text)] [font-family:var(--font-display)]"
            data-testid="duel-opponent-score"
          >
            {formatChallengeScore(opponentValue, challengeType)}
          </span>
        </div>
      </div>

      {/* System Warning Banners (Only displayed when abnormal) */}
      {isReconnecting ? (
        <div
          className="mt-1 flex items-center justify-center gap-1.5 py-0.5 text-[11px] font-bold text-amber-600 border-t border-neutral-100"
          data-testid="arena-reconnecting-badge"
        >
          <WifiOff aria-hidden="true" size={12} />
          <span>Reconnecting to lane · 45s grace active</span>
        </div>
      ) : isOpponentDisconnected ? (
        <div className="mt-1 flex items-center justify-center gap-1.5 py-0.5 text-[11px] font-semibold text-amber-600 border-t border-neutral-100">
          <WifiOff aria-hidden="true" size={12} />
          <span>{opponentDisplayName || "Rival"} disconnected · 45s grace</span>
        </div>
      ) : null}

      {/* Optional debug info only when requested via ?debug=1 */}
      {isDebug ? (
        <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 tabular-nums">
          <span>Angle: {currentAngle}°</span>
          <span>Lane: Sync</span>
        </div>
      ) : null}
    </div>
  );
}

export function DuelCueToast({
  coachCue,
  detectedErrors,
}: {
  coachCue?: string;
  detectedErrors: string[];
}) {
  const activeCue = detectedErrors.length > 0 ? detectedErrors.join(" · ") : coachCue || null;

  if (!activeCue) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute bottom-4 inset-x-4 z-30 mx-auto max-w-[460px]"
    >
      <div className="flex items-center justify-center gap-2 rounded-xl bg-black/80 px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-white backdrop-blur-md border border-white/15 shadow-xl animate-in fade-in duration-200">
        {detectedErrors.length > 0 ? (
          <AlertTriangle aria-hidden="true" className="shrink-0 text-amber-400" size={16} />
        ) : (
          <Sparkles aria-hidden="true" className="shrink-0 text-[var(--color-action)]" size={16} />
        )}
        <span className="leading-snug">{activeCue}</span>
      </div>
    </div>
  );
}
