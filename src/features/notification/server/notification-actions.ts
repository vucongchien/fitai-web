"use server";

import { createClient } from "@connectrpc/connect";

import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

import { getAuthenticatedSession } from "@/shared/auth/session";

export interface NotificationItemDTO {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, string>;
}

export async function listNotificationsAction(
  limit: number = 50,
  offset: number = 0,
): Promise<{ notifications: NotificationItemDTO[]; totalCount: number }> {
  const { accessToken, userId } = await getAuthenticatedSession();
  if (!accessToken || !userId) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(NotificationService, transport);

    const response = await client.listNotifications({
      userId,
      limit,
      offset,
    });

    const notifications = response.notifications.map((item) => ({
      id: item.notificationId,
      title: item.title,
      body: item.body,
      isRead: item.isRead,
      createdAt: item.createdAt,
      data: Object.fromEntries(
        Object.entries(item.data || {}).map(([k, v]) => [k, String(v)]),
      ),
    }));

    return {
      notifications,
      totalCount: response.totalCount,
    };
  } catch (error) {
    console.error("[listNotificationsAction] Failed to list notifications:", error);
    throw new Error("FAILED_TO_FETCH_NOTIFICATIONS", { cause: error });
  }
}

export async function markNotificationAsReadAction(notificationId: string): Promise<boolean> {
  const { accessToken, userId } = await getAuthenticatedSession();
  if (!accessToken || !userId) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(NotificationService, transport);

    const response = await client.markNotificationAsRead({
      userId,
      notificationId,
    });

    return response.success;
  } catch (error) {
    console.error(`[markNotificationAsReadAction] Failed to mark ${notificationId} as read:`, error);
    return false;
  }
}
