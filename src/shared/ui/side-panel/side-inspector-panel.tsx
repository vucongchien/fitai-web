"use client";

import { Bell, Search, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { notificationBadgeStore } from "@/shared/ui/header-actions";
import { QuickNotificationsPane } from "@/shared/ui/side-panel/quick-notifications-pane";
import { QuickSearchPane } from "@/shared/ui/side-panel/quick-search-pane";
import { useSidePanel } from "@/shared/ui/side-panel/side-panel-context";

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
          aria-label="Mở tìm kiếm nhanh"
          className="h-10 pl-3.5 pr-4 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xs hover:border-neutral-300 hover:shadow-sm text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-2.5 group cursor-pointer"
          onClick={() => openPanel("search")}
          title="Tìm kiếm bài tập (Ctrl+K)"
          type="button"
        >
          <Search
            className="text-neutral-400 group-hover:text-neutral-700 transition-colors"
            size={16}
          />
          <span className="text-xs font-medium">Tìm kiếm...</span>
          <kbd className="hidden lg:inline-flex text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">
            Ctrl K
          </kbd>
        </button>
        <button
          aria-label="Mở thông báo nhanh"
          className="relative w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xs hover:border-neutral-300 hover:shadow-sm flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all group cursor-pointer"
          onClick={() => openPanel("notifications")}
          title="Thông báo"
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
          {/* Header */}
          <div className="h-16 px-5 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
              <button
                aria-label="Tab tìm kiếm"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "search"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("search")}
                type="button"
              >
                <Search size={15} />
                Tìm kiếm
              </button>
              <button
                aria-label="Tab thông báo"
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "notifications"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("notifications")}
                type="button"
              >
                <Bell size={15} />
                Thông báo
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 -ml-0.5" />
                )}
              </button>
            </div>

            <button
              aria-label="Đóng bảng phụ"
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              onClick={closePanel}
              type="button"
            >
              <X size={19} />
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
