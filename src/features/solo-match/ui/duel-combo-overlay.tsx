"use client";

import { Flame, Sparkles } from "lucide-react";
import { useCallback, useRef, useSyncExternalStore } from "react";

import {
  COMBO_TIMEOUT_MS,
  getComboMilestoneLabel,
} from "@/features/solo-match/domain/combo-tracker";
import { triggerKamehaCheer } from "@/features/solo-match/ui/kameha-clash-fx";

export interface DuelComboOverlayProps {
  comboStreak?: number;
  lastMilestone?: number | null;
  lastRepConfirmedAtMs?: number;
}

function resolveCheerText(
  comboStreak: number,
  milestoneLabel: string | null,
): { col: string; text: string } {
  if (milestoneLabel) {
    return { col: "#ffdf00", text: milestoneLabel.toUpperCase() };
  }
  if (comboStreak % 3 === 0) {
    return { col: "#fb923c", text: "COMBO!" };
  }
  if (comboStreak % 2 === 0) {
    return { col: "#38bdf8", text: "NICE!" };
  }
  return { col: "#facc15", text: `${comboStreak}x!` };
}

export function DuelComboOverlay({
  comboStreak = 0,
  lastMilestone = null,
  lastRepConfirmedAtMs = 0,
}: DuelComboOverlayProps) {
  const milestoneLabel = lastMilestone ? getComboMilestoneLabel(lastMilestone) : null;
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const prevRef = useRef({ comboStreak, lastMilestone, lastRepConfirmedAtMs });

  const subscribeCheer = useCallback(() => {
    const prev = prevRef.current;
    const isNewRep = lastRepConfirmedAtMs > 0 && lastRepConfirmedAtMs !== prev.lastRepConfirmedAtMs;
    const isNewMilestone = lastMilestone !== null && lastMilestone !== prev.lastMilestone;
    prevRef.current = { comboStreak, lastMilestone, lastRepConfirmedAtMs };

    if (!isNewRep && !isNewMilestone) {
      return () => {};
    }

    if (typeof window === "undefined") {
      return () => {};
    }

    const { col, text } = resolveCheerText(comboStreak, isNewMilestone ? milestoneLabel : null);

    if (isNewMilestone && milestoneLabel) {
      if (bannerRef.current) {
        triggerKamehaCheer(bannerRef.current, {
          col,
          size: 1.25,
          text,
        });
      } else {
        triggerKamehaCheer({ x: window.innerWidth * 0.5, y: 100 }, { col, size: 1.25, text });
      }
    } else if (isNewRep && comboStreak >= 2) {
      if (badgeRef.current) {
        triggerKamehaCheer(badgeRef.current, {
          col,
          size: 1.05,
          text,
        });
      } else {
        triggerKamehaCheer({ x: 90, y: 40 }, { col, size: 1.05, text });
      }
    }

    return () => {};
  }, [comboStreak, lastMilestone, lastRepConfirmedAtMs, milestoneLabel]);

  useSyncExternalStore(
    subscribeCheer,
    () => 0,
    () => 0,
  );

  if (comboStreak < 2 && !milestoneLabel) {
    return null;
  }

  return (
    <>
      {comboStreak >= 2 ? (
        <div
          ref={badgeRef}
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
          ref={bannerRef}
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
