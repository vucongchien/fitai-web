"use client";

import { Bell, Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { notificationBadgeStore } from "@/shared/ui/header-actions";
import { useSidePanel } from "@/shared/ui/side-panel/side-panel-context";

interface TodayHeaderProps {
  dateLabel?: string;
}

export function TodayHeader({ dateLabel = "Today" }: TodayHeaderProps) {
  const { openPanel } = useSidePanel();

  const hasUnread = useSyncExternalStore(
    notificationBadgeStore.subscribe,
    notificationBadgeStore.getSnapshot,
    () => false,
  );

  return (
    <header className="today-header px-5 sm:px-6 pt-6 pb-2 flex items-center justify-between">
      <div className="today-header__titles">
        <h1 className="display-title">{dateLabel}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Gamification Badges (Streak & Coins portalled here on desktop) */}
        <div className="today-header__badges flex items-center" id="today-header-badges" />

        {/* Desktop In-Content Quick Triggers (Search & Notifications for Home only) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            aria-label="Search exercises"
            className="relative w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-950 !border !border-solid !border-neutral-200/80 transition-all flex items-center justify-center cursor-pointer group"
            onClick={() => openPanel("search")}
            title="Search exercises (Ctrl+K)"
            type="button"
          >
            <Search
              size={18}
              strokeWidth={2.2}
              className="group-hover:scale-105 transition-transform"
            />
          </button>

          <button
            aria-label={hasUnread ? "Notifications, unread items available" : "Notifications"}
            className="relative w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-950 !border !border-solid !border-neutral-200/80 transition-all flex items-center justify-center cursor-pointer group"
            onClick={() => openPanel("notifications")}
            title="Notifications"
            type="button"
          >
            <Bell
              size={18}
              strokeWidth={2.2}
              className="group-hover:scale-105 transition-transform"
            />
            {hasUnread && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-effort ring-2 ring-white"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
