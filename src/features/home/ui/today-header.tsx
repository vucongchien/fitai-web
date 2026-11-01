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

      {/* Desktop In-Content Quick Triggers (Search & Notifications for Home only) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          aria-label="Search exercises"
          className="relative w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all flex items-center justify-center cursor-pointer group"
          onClick={() => openPanel("search")}
          title="Search exercises (Ctrl+K)"
          type="button"
        >
          <Search size={18} className="group-hover:scale-105 transition-transform" />
        </button>

        <button
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-all flex items-center justify-center cursor-pointer group"
          onClick={() => openPanel("notifications")}
          title="Notifications"
          type="button"
        >
          <Bell size={18} className="group-hover:scale-105 transition-transform" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      <div className="today-header__badges md:hidden" id="today-header-badges" />
    </header>
  );
}
