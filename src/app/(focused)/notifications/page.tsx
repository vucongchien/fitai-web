import { connection } from "next/server";

import { listNotificationsAction } from "@/features/notification/server/notification-actions";
import { NotificationsView } from "@/features/notification/ui/notifications-view";
import type { NotificationItem } from "@/features/notification/ui/notifications-view";

export const instant = false;

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return "Just now";
    }

    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

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

  if (type === "coach" || type === "sparkles" || lowerTitle.includes("coach")) {
    return "coach";
  }

  return "plan";
}

export default async function NotificationsPage() {
  await connection();
  let initialNotifications: NotificationItem[] = [];
  try {
    const result = await listNotificationsAction(50, 0);
    initialNotifications = result.notifications.map((item) => ({
      id: item.id,
      icon: getIconType(item.title, item.data),
      title: item.title,
      body: item.body,
      time: formatRelativeTime(item.createdAt),
      read: item.isRead,
    }));
  } catch (error) {
    console.error("[NotificationsPage] failed to load notifications on server:", error);
  }

  return <NotificationsView initialNotifications={initialNotifications} />;
}
