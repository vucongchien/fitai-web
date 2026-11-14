"use client";

import { WifiOff, Zap } from "lucide-react";
import { useCallback, useRef, useSyncExternalStore } from "react";

import { computeTugOfWarSplit } from "@/features/solo-match/domain/match-state";
import type { SoloChallengeType } from "@/features/solo-match/model/solo-match.types";
import type { SoloStreamStatusLabel } from "@/features/solo-match/model/use-solo-duel";

const TIE_ACTIVE_PULSE_MS = 1200;

type TugBarSideState = "leading" | "tie-active" | "tie-idle" | "trailing";

function useScoreIncreasePulse(
  myValue: number,
  opponentValue: number,
  durationMs: number,
): boolean {
  const storeRef = useRef<{
    active: boolean;
    expiresAt: number;
    listeners: Set<() => void>;
    prevMy: number;
    prevOpp: number;
    timer: ReturnType<typeof globalThis.setTimeout> | null;
  } | null>(null);

  if (storeRef.current === null) {
    storeRef.current = {
      active: false,
      expiresAt: 0,
      listeners: new Set(),
      prevMy: myValue,
      prevOpp: opponentValue,
      timer: null,
    };
  }

  const store = storeRef.current;
  const expirePulse = useCallback(() => {
    store.active = false;
    store.timer = null;
    for (const listener of store.listeners) {
      listener();
    }
  }, [store]);

  if (myValue > store.prevMy || opponentValue > store.prevOpp) {
    store.prevMy = myValue;
    store.prevOpp = opponentValue;
    store.active = true;
    store.expiresAt = Date.now() + durationMs;
    if (store.timer !== null) {
      globalThis.clearTimeout(store.timer);
    }
    store.timer = globalThis.setTimeout(expirePulse, durationMs);
  } else if (myValue !== store.prevMy || opponentValue !== store.prevOpp) {
    store.prevMy = myValue;
    store.prevOpp = opponentValue;
  }

  const subscribe = useCallback(
    (listener: () => void) => {
      store.listeners.add(listener);
      if (store.active && store.timer === null) {
        const remainingMs = store.expiresAt - Date.now();
        if (remainingMs <= 0) {
          store.active = false;
        } else {
          store.timer = globalThis.setTimeout(expirePulse, remainingMs);
        }
      }
      return () => {
        store.listeners.delete(listener);
        if (store.listeners.size === 0 && store.timer !== null) {
          globalThis.clearTimeout(store.timer);
          store.timer = null;
        }
      };
    },
    [expirePulse, store],
  );

  return useSyncExternalStore(
    subscribe,
    () => store.active,
    () => false,
  );
}

function resolveSideState(
  side: "me" | "opponent",
  leader: "me" | "opponent" | "tie",
  isTieActive: boolean,
): TugBarSideState {
  if (leader === "tie") {
    return isTieActive ? "tie-active" : "tie-idle";
  }
  return leader === side ? "leading" : "trailing";
}

const MY_BAR_CLASSES: Record<TugBarSideState, string> = {
  leading:
    "z-[2] bg-[var(--color-action)] bg-linear-to-r from-blue-500 via-sky-400 to-cyan-300 brightness-110 saturate-125 shadow-[inset_-10px_0_16px_-4px_rgba(255,255,255,0.55),0_0_12px_rgba(56,189,248,0.45)]",
  "tie-active":
    "bg-[var(--color-action)] bg-linear-to-r from-blue-500 via-sky-400 to-cyan-300 brightness-110 saturate-125 shadow-[inset_-8px_0_14px_-4px_rgba(255,255,255,0.5)]",
  "tie-idle": "bg-[var(--color-action)] bg-linear-to-r from-[var(--color-action)] to-sky-400",
  trailing:
    "bg-[var(--color-action)] bg-linear-to-r from-[var(--color-action)] to-sky-400 brightness-75 saturate-75",
};

const OPPONENT_BAR_CLASSES: Record<TugBarSideState, string> = {
  leading:
    "z-[2] bg-rose-500 bg-linear-to-l from-rose-500 via-rose-400 to-pink-300 brightness-110 saturate-125 shadow-[inset_10px_0_16px_-4px_rgba(255,255,255,0.55),0_0_12px_rgba(251,113,133,0.45)]",
  "tie-active":
    "bg-rose-500 bg-linear-to-l from-rose-500 via-rose-400 to-pink-300 brightness-110 saturate-125 shadow-[inset_8px_0_14px_-4px_rgba(255,255,255,0.5)]",
  "tie-idle": "bg-rose-500 bg-linear-to-l from-rose-600 to-rose-400",
  trailing: "bg-rose-500 bg-linear-to-l from-rose-600 to-rose-400 brightness-75 saturate-75",
};

export interface DuelVersusHudProps {
  challengeType: SoloChallengeType;
  connectionPhase: string;
  currentAngle?: number;
  isDebug?: boolean;
  myDisplayName: string;
  myStatus: SoloStreamStatusLabel;
  myValue: number;
  myXp?: number;
  opponentDisplayName: string;
  opponentStatus: SoloStreamStatusLabel;
  opponentValue: number;
  opponentXp?: number;
}

function formatXp(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return safe.toLocaleString("en-US");
}

export function DuelVersusHud({
  challengeType: _challengeType,
  connectionPhase,
  currentAngle = 0,
  isDebug = false,
  myDisplayName,
  myStatus: _myStatus,
  myValue,
  myXp = 0,
  opponentDisplayName,
  opponentStatus,
  opponentValue,
  opponentXp = 0,
}: DuelVersusHudProps) {
  const { delta, leader, myShare, opponentShare } = computeTugOfWarSplit(myValue, opponentValue);
  const isScoreIncreasing = useScoreIncreasePulse(myValue, opponentValue, TIE_ACTIVE_PULSE_MS);

  const isTieActive = leader === "tie" && isScoreIncreasing;
  const myBarState = resolveSideState("me", leader, isTieActive);
  const opponentBarState = resolveSideState("opponent", leader, isTieActive);
  const myBarClass = MY_BAR_CLASSES[myBarState];
  const opponentBarClass = OPPONENT_BAR_CLASSES[opponentBarState];

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
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-bold tracking-wider text-[var(--color-action)] uppercase truncate">
            {myDisplayName || "You"}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 tabular-nums shrink-0"
            data-testid="duel-my-xp"
          >
            <Zap
              aria-hidden="true"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 fill-amber-500 shrink-0"
            />
            {formatXp(myXp)}
          </span>
        </div>

        {/* Center: Sleek Horizontal VS + Lead Delta Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-neutral-50/90 pl-2 pr-1 py-0.5 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-neutral-400 uppercase">
            VS
          </span>
          <span
            className={`inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold leading-none tracking-tight tabular-nums ${leadBadgeClass}`}
            data-testid="duel-lead-badge"
            key={`lead-${clashKey}`}
            style={{ animation: "soloClashBump 320ms ease-out" }}
          >
            {leadLabel}
          </span>
        </div>

        {/* Right: Rival */}
        <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1">
          {isOpponentDisconnected ? (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          ) : isOpponentCompleted ? (
            <span className="text-[8px] sm:text-[9px] font-bold text-neutral-400 uppercase shrink-0">
              [Done]
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 tabular-nums shrink-0"
            data-testid="duel-opponent-xp"
          >
            <Zap
              aria-hidden="true"
              className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 fill-amber-500 shrink-0"
            />
            {formatXp(opponentXp)}
          </span>
          <span className="truncate text-[11px] sm:text-xs font-bold tracking-wider text-rose-600 uppercase">
            {opponentDisplayName || "Rival"}
          </span>
        </div>
      </div>

      {/* Full-Width Tug-of-War Clash Bar (------/----) */}
      <div
        aria-label={`Tug of war score split: ${myShare}% vs ${opponentShare}%`}
        className="relative mt-2 h-6 sm:h-7 w-full overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200/80"
        data-leader={leader}
        data-my-share={myShare}
        data-opponent-share={opponentShare}
        data-testid="duel-tug-of-war-bar"
        data-tie-active={isTieActive ? "true" : "false"}
      >
        {/* Left push bar (You) — score rides the right edge just left of (/) */}
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-end pr-3 sm:pr-3.5 transition-[width,filter,box-shadow] duration-300 ease-out ${myBarClass}`}
          data-state={myBarState}
          data-testid="duel-my-bar"
          style={{ paddingRight: "12px", width: `${myShare}%` }}
        >
          {myBarState === "trailing" ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-linear-to-l from-slate-950/35 via-slate-900/15 to-transparent"
              data-testid="duel-my-pushback-shade"
            />
          ) : null}
          <span
            className="pointer-events-none z-10 text-[11px] sm:text-xs font-extrabold tracking-tight text-white tabular-nums leading-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]"
            data-testid="duel-my-score"
          >
            {myValue}
          </span>
        </div>
        {/* Right push bar (Opponent) — score rides the left edge just right of (/) */}
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-start pl-3 sm:pl-3.5 transition-[width,filter,box-shadow] duration-300 ease-out ${opponentBarClass}`}
          data-state={opponentBarState}
          data-testid="duel-opponent-bar"
          style={{ paddingLeft: "12px", width: `${opponentShare}%` }}
        >
          {opponentBarState === "trailing" ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-linear-to-r from-rose-950/35 via-rose-950/15 to-transparent"
              data-testid="duel-opponent-pushback-shade"
            />
          ) : null}
          <span
            className="pointer-events-none z-10 text-[11px] sm:text-xs font-extrabold tracking-tight text-white tabular-nums leading-none whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]"
            data-testid="duel-opponent-score"
          >
            {opponentValue}
          </span>
        </div>
        {/* Diagonal Clash Divider (/) */}
        <div
          className="absolute inset-y-0 z-10 w-1.5 -translate-x-1/2 -skew-x-12 transition-[left] duration-300 ease-out"
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
