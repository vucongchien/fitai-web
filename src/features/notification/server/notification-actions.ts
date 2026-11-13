"use server";

import { createClient } from "@connectrpc/connect";

import type { GetNotificationSettingsResponse } from "@/shared/api/gen/contracts/generic/notification/v1/message/notification_messages_pb";
import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

export type NotificationSettings = Pick<
  GetNotificationSettingsResponse,
  "enablePush" | "enableEmail" | "enableSms" | "quietHoursStart" | "quietHoursEnd"
>;

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
      data: Object.fromEntries(Object.entries(item.data || {}).map(([k, v]) => [k, String(v)])),
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
    console.error(
      `[markNotificationAsReadAction] Failed to mark ${notificationId} as read:`,
      error,
    );
    return false;
  }
}

const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeOrEmpty(value: string): boolean {
  return value === "" || TIME_OF_DAY_REGEX.test(value);
}

export async function getNotificationSettingsAction(): Promise<NotificationSettings> {
  const { accessToken, userId } = await getAuthenticatedSession();
  if (!accessToken || !userId) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(NotificationService, transport);

    const response = await client.getNotificationSettings({ userId });

    return {
      enablePush: response.enablePush,
      enableEmail: response.enableEmail,
      enableSms: response.enableSms,
      quietHoursStart: response.quietHoursStart,
      quietHoursEnd: response.quietHoursEnd,
    };
  } catch (error) {
    console.error("[getNotificationSettingsAction] Failed to get notification settings:", error);
    throw new Error("FAILED_TO_FETCH_NOTIFICATION_SETTINGS", { cause: error });
  }
}

export async function updateNotificationSettingsAction(
  input: NotificationSettings,
): Promise<{ success: boolean; message?: string }> {
  const { accessToken, userId } = await getAuthenticatedSession();
  if (!accessToken || !userId) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!isValidTimeOrEmpty(input.quietHoursStart) || !isValidTimeOrEmpty(input.quietHoursEnd)) {
    return {
      success: false,
      message: "Quiet hours must be in HH:MM format.",
    };
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(NotificationService, transport);

    const response = await client.updateNotificationSettings({
      userId,
      enablePush: input.enablePush,
      enableEmail: input.enableEmail,
      enableSms: input.enableSms,
      quietHoursStart: input.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd,
    });

    return {
      success: response.success,
      message: response.message || undefined,
    };
  } catch (error) {
    console.error("[updateNotificationSettingsAction] Failed to update settings:", error);
    return {
      success: false,
      message: "Failed to save notification settings.",
    };
  }
}
