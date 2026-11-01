"use client";

import { Bell, Search, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { notificationBadgeStore } from "@/shared/ui/header-actions";
import { QuickNotificationsPane } from "@/shared/ui/side-panel/quick-notifications-pane";
import { QuickSearchPane } from "@/shared/ui/side-panel/quick-search-pane";
import { useSidePanel } from "@/shared/ui/side-panel/side-panel-context";
import { TabButton } from "@/shared/ui/tab-button";

export function SideInspectorPanel() {
  const { activeTab, isOpen, openPanel, closePanel } = useSidePanel();

  const hasUnread = useSyncExternalStore(
    notificationBadgeStore.subscribe,
    notificationBadgeStore.getSnapshot,
    () => false,
  );

  return (
    <>
      {/* 1. Top-Right Quick Utility Dock on Desktop */}
      <div className="fixed top-4 right-6 z-30 hidden md:flex items-center gap-2">
        <button
          aria-label="Search exercises"
          className="relative w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xs hover:border-neutral-300 hover:shadow-sm flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all group cursor-pointer"
          onClick={() => openPanel("search")}
          title="Search exercises (Ctrl+K)"
          type="button"
        >
          <Search
            className="text-neutral-500 group-hover:text-neutral-800 transition-colors"
            size={17}
          />
        </button>
        <button
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xs hover:border-neutral-300 hover:shadow-sm flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all group cursor-pointer"
          onClick={() => openPanel("notifications")}
          title="Notifications"
          type="button"
        >
          <Bell
            className="text-neutral-500 group-hover:text-neutral-800 transition-colors"
            size={17}
          />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* 2. Backdrop Overlay */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-neutral-900/25 backdrop-blur-xs transition-opacity duration-200"
          onClick={closePanel}
        />
      )}

      {/* 3. Spacious Slide-Over Inspector Drawer (Zero layout shift on main card) */}
      {isOpen && (
        <aside
          aria-label="Side Inspector Drawer"
          className="fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl flex flex-col border-l border-neutral-200"
        >
          {/* Header with Unified TabButton */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 bg-white shrink-0">
            <div className="flex items-center flex-1 gap-2" role="tablist">
              <TabButton
                active={activeTab === "search"}
                aria-label="Search tab"
                className="flex items-center justify-center gap-2"
                onClick={() => openPanel("search")}
              >
                <Search size={16} />
                <span>Search</span>
              </TabButton>
              <TabButton
                active={activeTab === "notifications"}
                aria-label="Notifications tab"
                className="flex items-center justify-center gap-2"
                onClick={() => openPanel("notifications")}
              >
                <Bell size={16} />
                <span>Notifications</span>
                {hasUnread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
              </TabButton>
            </div>

            <button
              aria-label="Close panel"
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-2 cursor-pointer"
              onClick={closePanel}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "search" && <QuickSearchPane />}
            {activeTab === "notifications" && <QuickNotificationsPane />}
          </div>
        </aside>
      )}
    </>
  );
}
