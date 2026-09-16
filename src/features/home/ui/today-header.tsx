"use client";

import { Flame } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface TodayHeaderProps {
  dateLabel?: string;
}

export function TodayHeader({ dateLabel = "Today" }: TodayHeaderProps) {
  return (
    <header className="today-header">
      <div className="today-header__titles">
        <h1 className="display-title">{dateLabel}</h1>
      </div>
      <div className="today-header__badges" id="today-header-badges" />
    </header>
  );
}

interface TodayStreakBadgeProps {
  streakDays: number;
}

const subscribeNoop = () => () => {};

export function TodayStreakBadge({ streakDays }: TodayStreakBadgeProps) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  if (!isClient || streakDays <= 0) {
    return null;
  }

  const portalTarget = document.querySelector("#today-header-badges");
  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div className="streak-badge" title={`${streakDays} consecutive training days`}>
      <Flame aria-hidden="true" className="streak-badge__icon" size={16} />
      <span>{streakDays}-day streak</span>
    </div>,
    portalTarget,
  );
}
