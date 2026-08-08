"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Bell, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { listNotificationsAction, markNotificationAsReadAction } from "@/features/notification/server/notification-actions";
import { EnablePushButton } from "@/shared/push/enable-push-button";
import { BrandMark } from "@/shared/ui/brand-mark";
import { EmptyState } from "@/shared/ui/empty-state";
import { FeedbackState } from "@/shared/ui/feedback-state";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { NAV_BACK } from "@/shared/ui/transition-types";

interface NotificationItem {
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

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Nếu mốc thời gian ở tương lai
    if (diffMs < 0) return "Just now";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

function getIconType(title: string, data: Record<string, string>): "coach" | "pr" | "plan" {
  const type = data?.type || data?.icon || "";
  const lowerTitle = title.toLowerCase();
  
  if (
    type === "pr" ||
    type === "trophy" ||
    lowerTitle.includes("record") ||
    lowerTitle.includes("pr")
  ) {
    return "pr";
  }
  
  if (
    type === "coach" ||
    type === "sparkles" ||
    lowerTitle.includes("coach")
  ) {
    return "coach";
  }
  
  return "plan";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listNotificationsAction(50, 0);
      const mapped = result.notifications.map((item) => ({
        id: item.id,
        icon: getIconType(item.title, item.data),
        title: item.title,
        body: item.body,
        time: formatRelativeTime(item.createdAt),
        read: item.isRead,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error("[NotificationsPage] failed to load:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;

    // Cập nhật optimistic UI trước
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      const success = await markNotificationAsReadAction(id);
      if (!success) {
        // Rollback nếu fail
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: false } : item))
        );
      }
    } catch (err) {
      console.error("[NotificationsPage] failed to mark as read:", err);
      // Rollback nếu có lỗi
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false } : item))
      );
    }
  };

  const hasUnread = notifications.some((item) => !item.read);

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
            <h1 className="page-hero__title">Notifications</h1>
            <EnablePushButton />
            <p className="page-hero__lede">Coach messages, milestones, and plan updates.</p>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm animate-pulse">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FeedbackState
                tone="error"
                title="Could not load notifications"
                description={error}
              />
              <button
                onClick={fetchNotifications}
                className="mt-6 px-4 py-2 bg-neutral-800 text-white rounded-md text-sm font-semibold hover:bg-neutral-700 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
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
