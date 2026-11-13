"use client";

import { ArrowLeft, Bell, Loader2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  mapNotificationDtoToViewModel,
  mergeUniqueNotifications,
  resolveNotificationHref,
  type NotificationItemViewModel,
} from "@/features/notification/model/notification-routing";
import {
  listNotificationsAction,
  markNotificationAsReadAction,
} from "@/features/notification/server/notification-actions";
import { BrandMark } from "@/shared/ui/brand-mark";
import { EmptyState } from "@/shared/ui/empty-state";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { NAV_BACK } from "@/shared/ui/transition-types";

export type NotificationItem = NotificationItemViewModel;

const ICON = {
  coach: Sparkles,
  pr: Trophy,
  plan: Bell,
} as const;

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  initialTotalCount?: number;
  pageSize?: number;
}

export function NotificationsView({
  initialNotifications,
  initialTotalCount = initialNotifications.length,
  pageSize = 20,
}: NotificationsViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) {
      return;
    }

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );

    try {
      const success = await markNotificationAsReadAction(id);
      if (!success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: false } : item)),
        );
      }
    } catch (error) {
      console.error("[NotificationsView] failed to mark as read:", error);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false } : item)),
      );
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    void handleMarkAsRead(item.id, item.read);
    const targetHref = resolveNotificationHref(item.data);
    if (targetHref) {
      router.push(targetHref);
    }
  };

  const hasMore = notifications.length < totalCount;

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const result = await listNotificationsAction(pageSize, notifications.length);
      const mapped = result.notifications.map(mapNotificationDtoToViewModel);
      setNotifications((prev) => mergeUniqueNotifications(prev, mapped));
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("[NotificationsView] failed to load more notifications:", error);
      setLoadMoreError("Không thể tải thêm thông báo. Vui lòng thử lại.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;
  const hasUnread = unreadCount > 0;

  const handleMarkAllAsRead = async () => {
    if (!hasUnread) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await markNotificationAsReadAction("all");
    } catch (err) {
      console.error("[NotificationsView] failed to mark all as read:", err);
    }
  };

  return (
    <PullToRefresh activePath="/notifications">
      <div className="focused-page">
        <header className="focused-header">
          <Link
            aria-label="Back"
            className="focused-header__back"
            href="/home"
            transitionTypes={NAV_BACK}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <BrandMark />
          <HeaderActions hasNotifications={hasUnread} />
        </header>

        <main className="focused-main">
          <header className="page-hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 className="page-hero__title" style={{ margin: 0 }}>
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "var(--color-action)",
                      color: "var(--color-action-contrast)",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {unreadCount} mới
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>
            <p className="page-hero__lede">Coach messages, milestones, and plan updates.</p>
          </header>

          {notifications.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="You will see coach messages, personal records, and plan updates here."
              />
            </div>
          ) : (
            <>
              <ol className="notification-list">
                {notifications.map((item) => {
                  const Icon = ICON[item.icon];
                  const targetHref = resolveNotificationHref(item.data);
                  const isInteractive = !item.read || Boolean(targetHref);
                  return (
                    <li
                      className="notification-item"
                      data-unread={!item.read || undefined}
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      style={{ cursor: isInteractive ? "pointer" : "default" }}
                    >
                      <span className="notification-item__icon" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      <div className="notification-item__body">
                        <div className="notification-item__head">
                          <strong>{item.title}</strong>
                          <span>{item.time}</span>
                        </div>
                        <p>{item.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {(hasMore || loadMoreError) && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  {loadMoreError && (
                    <p className="text-xs text-red-600" role="alert">
                      {loadMoreError}
                    </p>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-2 rounded-xl !border !border-solid !border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingMore && <Loader2 className="animate-spin" size={16} />}
                      {isLoadingMore ? "Đang tải..." : "Tải thêm thông báo"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}
