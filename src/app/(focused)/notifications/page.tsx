import { connection } from "next/server";

import {
  mapNotificationDtoToViewModel,
  type NotificationItemViewModel,
} from "@/features/notification/model/notification-routing";
import { listNotificationsAction } from "@/features/notification/server/notification-actions";
import { NotificationsView } from "@/features/notification/ui/notifications-view";

export const instant = false;

const INITIAL_PAGE_SIZE = 20;

export default async function NotificationsPage() {
  await connection();
  let initialNotifications: NotificationItemViewModel[] = [];
  let initialTotalCount = 0;

  try {
    const result = await listNotificationsAction(INITIAL_PAGE_SIZE, 0);
    initialNotifications = result.notifications.map(mapNotificationDtoToViewModel);
    initialTotalCount = result.totalCount;
  } catch (error) {
    console.error("[NotificationsPage] failed to load notifications on server:", error);
  }

  return (
    <NotificationsView
      initialNotifications={initialNotifications}
      initialTotalCount={initialTotalCount}
      pageSize={INITIAL_PAGE_SIZE}
    />
  );
}
