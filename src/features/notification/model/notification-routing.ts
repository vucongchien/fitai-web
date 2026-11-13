import type { NotificationItemDTO } from "@/features/notification/server/notification-actions";

export type NotificationIconType = "coach" | "pr" | "plan";

export interface NotificationItemViewModel {
  id: string;
  icon: NotificationIconType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  data?: Record<string, string>;
}

const EVENT_ROUTE_MAP: Record<string, string> = {
  "contracts.core.coaching.v1.event.UpcomingWorkoutReminder": "/schedule",
  "contracts.core.coaching.v1.upcomingWorkoutReminder": "/schedule",
  "contracts.core.nutrition.v1.event.UpcomingMealReminder": "/nutrition",
  "contracts.core.nutrition.v1.upcomingMealReminder": "/nutrition",
  "contracts.core.workout_execution.v1.event.NewPersonalRecordAchieved": "/profile",
  "contracts.core.workout_execution.v1.newPersonalRecordAchieved": "/profile",
};

function isSafeInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

export function resolveNotificationHref(data?: Record<string, string>): string | null {
  if (!data) {
    return null;
  }

  const explicitTarget = data.href || data.route;
  if (explicitTarget && isSafeInternalPath(explicitTarget)) {
    return explicitTarget;
  }

  const eventType = data.eventType;
  if (eventType && eventType in EVENT_ROUTE_MAP) {
    return EVENT_ROUTE_MAP[eventType];
  }

  return null;
}

export function mergeUniqueNotifications<T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

export function formatNotificationRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    const diffMs = Date.now() - date.getTime();
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

export function getNotificationIconType(
  title: string,
  data?: Record<string, string>,
): NotificationIconType {
  const type = (data?.type || data?.icon || "").toLowerCase();
  const eventType = (data?.eventType || "").toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (
    type === "pr" ||
    eventType.includes("personalrecord") ||
    lowerTitle.includes("kỷ lục") ||
    lowerTitle.includes("record") ||
    lowerTitle.includes(" pr")
  ) {
    return "pr";
  }

  if (
    type === "coach" ||
    type === "sparkles" ||
    lowerTitle.includes("coach") ||
    lowerTitle.includes("huấn luyện")
  ) {
    return "coach";
  }

  return "plan";
}

export function mapNotificationDtoToViewModel(
  item: NotificationItemDTO,
): NotificationItemViewModel {
  return {
    id: item.id,
    icon: getNotificationIconType(item.title, item.data),
    title: item.title,
    body: item.body,
    time: formatNotificationRelativeTime(item.createdAt),
    read: item.isRead,
    data: item.data,
  };
}
