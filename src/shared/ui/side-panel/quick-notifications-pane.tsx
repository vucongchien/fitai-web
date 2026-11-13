"use client";

import { Bell, CheckCheck, Loader2, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

import {
  formatNotificationRelativeTime,
  getNotificationIconType,
  mergeUniqueNotifications,
  resolveNotificationHref,
} from "@/features/notification/model/notification-routing";
import {
  listNotificationsAction,
  markNotificationAsReadAction,
  type NotificationItemDTO,
} from "@/features/notification/server/notification-actions";
import { notificationBadgeStore } from "@/shared/ui/header-actions";

const PANE_PAGE_SIZE = 30;

class NotificationListStore {
  private notifications: NotificationItemDTO[] = [];
  private totalCount = 0;
  private isLoading = true;
  private isLoadingMore = false;
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
  getLoadingMoreSnapshot = () => this.isLoadingMore;
  getTotalCountSnapshot = () => this.totalCount;

  async refresh() {
    this.fetching = true;
    this.isLoading = true;
    this.emit();
    try {
      const res = await listNotificationsAction(PANE_PAGE_SIZE, 0);
      this.notifications = res.notifications || [];
      this.totalCount = res.totalCount;
      this.fetched = true;
    } catch {
      this.notifications = [];
      this.totalCount = 0;
    } finally {
      this.isLoading = false;
      this.fetching = false;
      this.emit();
    }
  }

  async loadMore() {
    if (this.isLoadingMore || this.notifications.length >= this.totalCount) {
      return;
    }
    this.isLoadingMore = true;
    this.emit();
    try {
      const res = await listNotificationsAction(PANE_PAGE_SIZE, this.notifications.length);
      this.notifications = mergeUniqueNotifications(this.notifications, res.notifications || []);
      this.totalCount = res.totalCount;
    } catch {
      // Keep current list on failure so the user can retry.
    } finally {
      this.isLoadingMore = false;
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

export function QuickNotificationsPane() {
  const router = useRouter();
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

  const isLoadingMore = useSyncExternalStore(
    notificationListStore.subscribe,
    notificationListStore.getLoadingMoreSnapshot,
    () => false,
  );

  const totalCount = useSyncExternalStore(
    notificationListStore.subscribe,
    notificationListStore.getTotalCountSnapshot,
    () => 0,
  );

  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasMore = notifications.length < totalCount;

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

  const handleNotificationClick = (item: NotificationItemDTO) => {
    handleMarkAsRead(item.id, item.isRead);
    const targetHref = resolveNotificationHref(item.data);
    if (targetHref) {
      router.push(targetHref);
    }
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
          <>
            {notifications.map((item) => {
              const iconType = getNotificationIconType(item.title, item.data);
              const Icon = iconType === "pr" ? Trophy : iconType === "coach" ? Sparkles : Bell;

              return (
                <button
                  key={item.id}
                  className={`w-full text-left py-3 px-3 rounded-xl transition-colors flex items-start gap-3 my-0.5 cursor-pointer ${
                    item.isRead
                      ? "hover:bg-neutral-50 opacity-80"
                      : "bg-brand-50/40 hover:bg-brand-50/70"
                  }`}
                  onClick={() => handleNotificationClick(item)}
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
                      {formatNotificationRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              );
            })}
            {hasMore && (
              <div className="pt-3 pb-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => void notificationListStore.loadMore()}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-1.5 rounded-lg !border !border-solid !border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingMore && <Loader2 className="animate-spin" size={14} />}
                  {isLoadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
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
