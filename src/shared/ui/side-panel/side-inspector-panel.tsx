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
      {/* 1. Backdrop for Tablet / Small Screen (< 1280px) */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="xl:hidden fixed inset-0 z-40 bg-neutral-900/25 backdrop-blur-xs transition-opacity duration-200"
          onClick={closePanel}
        />
      )}

      {/* 2. Slide-over Drawer for Tablet / Small Screen (< 1280px) */}
      {isOpen && (
        <aside
          aria-label="Side Inspector Drawer"
          className="xl:hidden fixed top-0 right-0 z-50 h-full w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
        >
          {/* Drawer Header */}
          <div className="h-14 px-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                aria-label="Tab tìm kiếm"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "search"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("search")}
                type="button"
              >
                <Search size={14} />
                Tìm kiếm
              </button>
              <button
                aria-label="Tab thông báo"
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "notifications"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("notifications")}
                type="button"
              >
                <Bell size={14} />
                Thông báo
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 -ml-0.5" />
                )}
              </button>
            </div>

            <button
              aria-label="Đóng bảng phụ"
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              onClick={closePanel}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "search" && <QuickSearchPane />}
            {activeTab === "notifications" && <QuickNotificationsPane />}
          </div>
        </aside>
      )}

      {/* 3. Inline Desktop 3rd Column (>= 1280px / xl) */}
      {isOpen ? (
        <aside
          aria-label="Desktop Inspector Panel"
          className="hidden xl:flex flex-col w-[350px] 2xl:w-[380px] shrink-0 sticky top-4 h-[calc(100dvh-2rem)] bg-white rounded-[24px] border border-neutral-300 shadow-xs overflow-hidden transition-all duration-200"
        >
          {/* Header */}
          <div className="h-14 px-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                aria-label="Desktop Tab tìm kiếm"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "search"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("search")}
                type="button"
              >
                <Search size={14} />
                Tìm kiếm
              </button>
              <button
                aria-label="Desktop Tab thông báo"
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "notifications"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
                onClick={() => openPanel("notifications")}
                type="button"
              >
                <Bell size={14} />
                Thông báo
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 -ml-0.5" />
                )}
              </button>
            </div>

            <button
              aria-label="Đóng bảng bên phải"
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              onClick={closePanel}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "search" && <QuickSearchPane />}
            {activeTab === "notifications" && <QuickNotificationsPane />}
          </div>
        </aside>
      ) : (
        /* Collapsed Quick Actions Dock on Desktop */
        <div className="hidden md:flex flex-col gap-2 sticky top-6 shrink-0 self-start">
          <button
            aria-label="Mở tìm kiếm nhanh"
            className="w-11 h-11 rounded-2xl bg-white border border-neutral-300 shadow-xs flex items-center justify-center text-neutral-600 hover:text-brand-600 hover:border-brand-300 hover:shadow-sm transition-all group"
            onClick={() => openPanel("search")}
            title="Tìm kiếm bài tập (Ctrl+K)"
            type="button"
          >
            <Search className="group-hover:scale-110 transition-transform" size={19} />
          </button>
          <button
            aria-label="Mở thông báo nhanh"
            className="relative w-11 h-11 rounded-2xl bg-white border border-neutral-300 shadow-xs flex items-center justify-center text-neutral-600 hover:text-brand-600 hover:border-brand-300 hover:shadow-sm transition-all group"
            onClick={() => openPanel("notifications")}
            title="Thông báo"
            type="button"
          >
            <Bell className="group-hover:scale-110 transition-transform" size={19} />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      )}
    </>
  );
}
