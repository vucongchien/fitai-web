"use client";

import { ArrowLeft, Bell, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { markNotificationAsReadAction } from "@/features/notification/server/notification-actions";
import { BrandMark } from "@/shared/ui/brand-mark";
import { EmptyState } from "@/shared/ui/empty-state";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { NAV_BACK } from "@/shared/ui/transition-types";

export interface NotificationItem {
  id: string;
  icon: "coach" | "pr" | "plan";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const ICON = {
  coach: Sparkles,
  pr: Trophy,
  plan: Bell,
} as const;

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsView({ initialNotifications }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) {
      return;
    }

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      const success = await markNotificationAsReadAction(id);
      if (!success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: false } : item))
        );
      }
    } catch (error) {
      console.error("[NotificationsView] failed to mark as read:", error);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false } : item))
      );
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
                <h1 className="page-hero__title" style={{ margin: 0 }}>Notifications</h1>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
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
                    color: "var(--color-text-secondary)",
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
            <ol className="notification-list">
              {notifications.map((item) => {
                const Icon = ICON[item.icon];
                return (
                  <li
                    className="notification-item"
                    data-unread={!item.read || undefined}
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.read)}
                    style={{ cursor: item.read ? "default" : "pointer" }}
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
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}
