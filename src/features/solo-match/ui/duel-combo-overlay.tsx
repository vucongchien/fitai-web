"use client";

import { Flame, Sparkles } from "lucide-react";

import {
  COMBO_TIMEOUT_MS,
  getComboMilestoneLabel,
} from "@/features/solo-match/domain/combo-tracker";

export interface DuelComboOverlayProps {
  comboStreak?: number;
  lastMilestone?: number | null;
  lastRepConfirmedAtMs?: number;
}

export function DuelComboOverlay({
  comboStreak = 0,
  lastMilestone = null,
  lastRepConfirmedAtMs = 0,
}: DuelComboOverlayProps) {
  const milestoneLabel = lastMilestone ? getComboMilestoneLabel(lastMilestone) : null;

  if (comboStreak < 2 && !milestoneLabel) {
    return null;
  }

  return (
    <>
      {comboStreak >= 2 ? (
        <div
          className="pointer-events-none absolute top-3 left-3 z-20 flex flex-col overflow-hidden rounded-xl bg-neutral-950/85 px-3 py-1.5 text-white backdrop-blur-md border border-amber-400/50 shadow-lg"
          data-testid="duel-combo-badge"
        >
          <div className="flex items-center gap-1.5">
            <Flame aria-hidden="true" className="text-amber-400 shrink-0" size={14} />
            <span className="text-xs sm:text-sm font-black tracking-tight tabular-nums">
              {comboStreak}x COMBO
            </span>
          </div>
          <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-amber-400 bg-linear-to-r from-amber-400 to-orange-500 origin-left"
              key={lastRepConfirmedAtMs}
              style={{
                animation: `soloComboDrain ${COMBO_TIMEOUT_MS}ms linear forwards`,
              }}
            />
          </div>
          <style>{`
            @keyframes soloComboDrain {
              from { transform: scaleX(1); }
              to { transform: scaleX(0); }
            }
          `}</style>
        </div>
      ) : null}

      {milestoneLabel ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-14 inset-x-0 z-25 flex justify-center px-4"
          data-testid="duel-combo-milestone-banner"
          key={`milestone-${lastMilestone}-${lastRepConfirmedAtMs}`}
          style={{ animation: "soloMilestoneBanner 1.4s ease-out forwards" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-1.5 text-xs sm:text-sm font-black tracking-wider text-white shadow-xl ring-2 ring-white/40">
            <Sparkles aria-hidden="true" size={15} />
            <span>{milestoneLabel}</span>
          </div>
          <style>{`
            @keyframes soloMilestoneBanner {
              0% { opacity: 0; transform: translateY(-8px) scale(0.92); }
              15% { opacity: 1; transform: translateY(0) scale(1.04); }
              80% { opacity: 1; transform: translateY(0) scale(1); }
              100% { opacity: 0; transform: translateY(-6px) scale(0.96); visibility: hidden; }
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
