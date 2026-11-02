"use client";

import { Bell, CheckCheck, Loader2, Sparkles, Trophy } from "lucide-react";
import { useSyncExternalStore, useTransition } from "react";

import {
  listNotificationsAction,
  markNotificationAsReadAction,
  type NotificationItemDTO,
} from "@/features/notification/server/notification-actions";
import { notificationBadgeStore } from "@/shared/ui/header-actions";

class NotificationListStore {
  private notifications: NotificationItemDTO[] = [];
  private isLoading = true;
  private fetched = false;
  private fetching = false;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.fetched && !this.fetching && typeof window !== "undefined") {
      void this.refresh();
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.notifications;
  getServerSnapshot = () => [];
  getLoadingSnapshot = () => this.isLoading;

  async refresh() {
    this.fetching = true;
    this.isLoading = true;
    this.emit();
    try {
      const res = await listNotificationsAction(30, 0);
      this.notifications = res.notifications || [];
      this.fetched = true;
    } catch {
      this.notifications = [];
    } finally {
      this.isLoading = false;
      this.fetching = false;
      this.emit();
    }
  }

  markReadOptimistic(id: string) {
    if (id === "all") {
      this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    } else {
      this.notifications = this.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
    }
    this.emit();
  }

  revertRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n));
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const notificationListStore = new NotificationListStore();

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return dateString;
  }
}

export function QuickNotificationsPane() {
  const notifications = useSyncExternalStore(
    notificationListStore.subscribe,
    notificationListStore.getSnapshot,
    notificationListStore.getServerSnapshot,
  );

  const isLoading = useSyncExternalStore(
    notificationListStore.subscribe,
    notificationListStore.getLoadingSnapshot,
    () => false,
  );

  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string, isRead: boolean) => {
    if (isRead) return;

    notificationListStore.markReadOptimistic(id);

    startTransition(async () => {
      try {
        await markNotificationAsReadAction(id);
        void notificationBadgeStore.refresh();
      } catch {
        notificationListStore.revertRead(id);
      }
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    notificationListStore.markReadOptimistic("all");

    startTransition(async () => {
      try {
        await markNotificationAsReadAction("all");
        void notificationBadgeStore.refresh();
      } catch {
        void notificationListStore.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Subheader with Mark all as read */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">
          {unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}
        </span>
        {unreadCount > 0 && (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            disabled={isPending}
            onClick={handleMarkAllAsRead}
            type="button"
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-neutral-100">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-neutral-400">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => {
            const isPr =
              item.title.toLowerCase().includes("pr") ||
              item.title.toLowerCase().includes("record") ||
              item.title.toLowerCase().includes("kỷ lục");
            const isCoach =
              item.title.toLowerCase().includes("coach") ||
              item.title.toLowerCase().includes("huấn luyện");
            const Icon = isPr ? Trophy : isCoach ? Sparkles : Bell;

            return (
              <button
                key={item.id}
                className={`w-full text-left py-3 px-3 rounded-xl transition-colors flex items-start gap-3 my-0.5 cursor-pointer ${
                  item.isRead
                    ? "hover:bg-neutral-50 opacity-80"
                    : "bg-brand-50/40 hover:bg-brand-50/70"
                }`}
                onClick={() => handleMarkAsRead(item.id, item.isRead)}
                type="button"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.isRead
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-brand-500 text-white shadow-xs"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        item.isRead
                          ? "font-medium text-neutral-800"
                          : "font-semibold text-neutral-900"
                      }`}
                    >
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-brand-500 shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.body}
                  </p>
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <Bell className="text-neutral-300 mb-2" size={32} />
            <p className="text-sm font-medium text-neutral-700">All caught up</p>
            <p className="text-xs text-neutral-400 mt-1">You have no new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
