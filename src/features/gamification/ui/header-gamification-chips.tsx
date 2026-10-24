"use client";

import { Flame } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";

interface HeaderGamificationChipsProps {
  streakDays: number;
  isActiveToday: boolean;
  coins: number;
  usePortal?: boolean;
}

const subscribeNoop = () => () => {};

export function HeaderGamificationChips({
  streakDays,
  isActiveToday,
  coins,
  usePortal = true,
}: HeaderGamificationChipsProps) {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const content = (
    <div className="flex items-center gap-2">
      {/* Streak Chip */}
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight transition-all",
          isActiveToday
            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs"
            : "bg-neutral-100 text-neutral-600 border border-neutral-200",
        )}
        title={`${streakDays} ngày streak liên tiếp`}
        aria-label={`${streakDays} ngày streak`}
      >
        <Flame
          size={14}
          className={cn(
            "transition-colors",
            isActiveToday ? "text-amber-500 fill-amber-500" : "text-neutral-400",
          )}
        />
        <span>{streakDays}</span>
      </div>

      {/* FitCoins Chip */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 shadow-xs"
        title={`${coins.toLocaleString()} FitCoins`}
        aria-label={`${coins.toLocaleString()} FitCoins`}
      >
        <span aria-hidden="true" className="text-xs leading-none">🪙</span>
        <span>{coins.toLocaleString()}</span>
      </div>
    </div>
  );

  if (!usePortal) {
    return content;
  }

  if (!isClient) {
    return null;
  }

  const portalTarget =
    document.querySelector("#app-header-gamification") ||
    document.querySelector("#today-header-badges");
  if (!portalTarget) {
    return null;
  }

  return createPortal(content, portalTarget);
}
