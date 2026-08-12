"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

import { listNotificationsAction } from "@/features/notification/server/notification-actions";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface HeaderActionsProps {
  hasNotifications?: boolean;
}

export function HeaderActions({ hasNotifications }: HeaderActionsProps) {
  const [unreadState, setUnreadState] = useState<boolean>(hasNotifications ?? false);

  useEffect(() => {
    if (typeof hasNotifications === "boolean") {
      setUnreadState(hasNotifications);
      return;
    }

    // Dynamically check if any unread notification exists
    let isMounted = true;
    listNotificationsAction(10, 0)
      .then((res) => {
        if (isMounted) {
          const hasUnread = res.notifications.some((n) => !n.isRead);
          setUnreadState(hasUnread);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUnreadState(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasNotifications]);

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
