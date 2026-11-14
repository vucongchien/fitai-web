"use client";

import { WifiOff } from "lucide-react";

import {
  computeTugOfWarSplit,
  formatChallengeScore,
} from "@/features/solo-match/domain/match-state";
import type { SoloChallengeType } from "@/features/solo-match/model/solo-match.types";
import type { SoloStreamStatusLabel } from "@/features/solo-match/model/use-solo-duel";

export interface DuelVersusHudProps {
  challengeType: SoloChallengeType;
  connectionPhase: string;
  currentAngle?: number;
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
  const { delta, leader, myShare, opponentShare } = computeTugOfWarSplit(myValue, opponentValue);

  const isReconnecting = connectionPhase === "reconnecting";
  const isOpponentDisconnected = opponentStatus === "DISCONNECTED";
  const isOpponentCompleted = opponentStatus === "COMPLETED";

  const clashKey = `${myValue}-${opponentValue}`;
  const leadLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "TIED";
  const leadBadgeClass =
    leader === "me"
      ? "bg-[var(--color-action-soft)] text-[var(--color-action)] border-[var(--color-action)]/25"
      : leader === "opponent"
        ? "bg-rose-50 text-rose-600 border-rose-200"
        : "bg-neutral-100 text-neutral-500 border-neutral-200";

  return (
    <div
      className="w-full px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-neutral-200/90 rounded-2xl shadow-xs"
      data-testid="duel-versus-hud"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: You (Relay Blue) */}
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

        {/* Center: VS & Lead Delta Pill */}
        <div className="flex flex-col items-center justify-center shrink-0 px-1">
          <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-neutral-100 text-[9px] sm:text-[10px] font-extrabold text-neutral-500">
            VS
          </span>
          <span
            className={`mt-1 inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold tracking-tight tabular-nums ${leadBadgeClass}`}
            data-testid="duel-lead-badge"
            key={`lead-${clashKey}`}
            style={{ animation: "soloClashBump 320ms ease-out" }}
          >
            {leadLabel}
          </span>
        </div>

        {/* Right: Rival */}
        <div className="flex flex-col items-end min-w-0 flex-1">
          <div className="flex items-center gap-1 max-w-full">
            {isOpponentDisconnected ? (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            ) : isOpponentCompleted ? (
              <span className="text-[8px] sm:text-[9px] font-bold text-neutral-400 uppercase shrink-0">
                [Done]
              </span>
            ) : null}
            <span className="truncate text-[10px] sm:text-xs font-bold tracking-wider text-rose-600 uppercase">
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

      {/* Full-Width Tug-of-War Clash Bar (------/----) */}
      <div
        aria-label={`Tug of war score split: ${myShare}% vs ${opponentShare}%`}
        className="relative mt-2 h-6 sm:h-7 w-full overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200/80"
        data-my-share={myShare}
        data-opponent-share={opponentShare}
        data-testid="duel-tug-of-war-bar"
      >
        {/* Left push bar (You) */}
        <div
          className="absolute inset-y-0 left-0 bg-[var(--color-action)] bg-linear-to-r from-[var(--color-action)] to-sky-400 transition-[width] duration-300 ease-out"
          style={{ width: `${myShare}%` }}
        />
        {/* Right push bar (Opponent) */}
        <div
          className="absolute inset-y-0 right-0 bg-rose-500 bg-linear-to-l from-rose-600 to-rose-400 transition-[width] duration-300 ease-out"
          style={{ width: `${opponentShare}%` }}
        />
        {/* High-contrast score numbers inside the bar */}
        <span
          className="pointer-events-none absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-10 text-[11px] sm:text-xs font-extrabold tracking-tight text-white tabular-nums leading-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]"
          data-testid="duel-my-bar-score"
        >
          {myValue}
        </span>
        <span
          className="pointer-events-none absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-10 text-[11px] sm:text-xs font-extrabold tracking-tight text-white tabular-nums leading-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]"
          data-testid="duel-opponent-bar-score"
        >
          {opponentValue}
        </span>
        {/* Diagonal Clash Divider (/) */}
        <div
          className="absolute inset-y-0 w-1.5 -translate-x-1/2 -skew-x-12 transition-[left] duration-300 ease-out"
          data-testid="duel-tug-of-war-divider"
          style={{ left: `${myShare}%` }}
        >
          <div
            className="h-full w-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)]"
            key={`slash-${clashKey}`}
            style={{ animation: "soloClashBump 320ms ease-out" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes soloClashBump {
          0% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }
      `}</style>

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
