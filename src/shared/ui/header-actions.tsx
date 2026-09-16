"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { listNotificationsAction } from "@/features/notification/server/notification-actions";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface HeaderActionsProps {
  hasNotifications?: boolean;
}

class NotificationBadgeStore {
  private hasUnread = false;
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

  getSnapshot = () => this.hasUnread;

  async refresh() {
    this.fetching = true;
    try {
      const res = await listNotificationsAction(10, 0);
      this.hasUnread = res.notifications.some((n) => !n.isRead);
      this.fetched = true;
      this.listeners.forEach((l) => l());
    } catch {
      this.hasUnread = false;
    } finally {
      this.fetching = false;
    }
  }
}

const notificationBadgeStore = new NotificationBadgeStore();

export function HeaderActions({ hasNotifications }: HeaderActionsProps) {
  const storeUnread = useSyncExternalStore(
    notificationBadgeStore.subscribe,
    notificationBadgeStore.getSnapshot,
    () => false,
  );

  // Derive unread badge directly during render: prop has highest precedence
  const unreadState = typeof hasNotifications === "boolean" ? hasNotifications : storeUnread;

  return (
    <div className="header-actions">
      <Link
        aria-label="Search exercises"
        className="header-actions__button"
        href="/search"
        transitionTypes={NAV_FORWARD}
      >
        <Search aria-hidden="true" size={18} strokeWidth={2} />
      </Link>
      <Link
        aria-label={unreadState ? "Notifications, unread items available" : "Notifications"}
        className="header-actions__button"
        data-badge={unreadState || undefined}
        href="/notifications"
        transitionTypes={NAV_FORWARD}
      >
        <Bell aria-hidden="true" size={18} strokeWidth={2} />
      </Link>
    </div>
  );
}
