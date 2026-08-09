import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from "@bufbuild/protobuf";


import {
  ListNotificationsResponseSchema,
  MarkNotificationAsReadResponseSchema,
} from "@/shared/api/gen/contracts/generic/notification/v1/message/notification_messages_pb";

// Mock cookies từ next/headers
const mockGetCookie = vi.fn();
vi.mock<typeof import('next/headers')>(import('next/headers'), () => ({
  cookies: async () => ({
    get: mockGetCookie,
  }),
}));

// Mock gRPC Connect Client
const mockListNotifications = vi.fn();
const mockMarkNotificationAsRead = vi.fn();

vi.mock<typeof import('@connectrpc/connect')>(import('@connectrpc/connect'), () => ({
  createClient: () => ({
    listNotifications: mockListNotifications,
    markNotificationAsRead: mockMarkNotificationAsRead,
  }),
}));

// Mock Server Transport
vi.mock<typeof import('@/shared/api/server/transport')>(import('@/shared/api/server/transport'), () => ({
  createServerTransport: vi.fn(() => ({})),
}));

describe("notification Server Actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetCookie.mockReset();
    mockListNotifications.mockReset();
    mockMarkNotificationAsRead.mockReset();
  });

  describe("listNotificationsAction", () => {
    it("should throw UNAUTHENTICATED error when access token is missing", async () => {
      mockGetCookie.mockReturnValue();

      const { listNotificationsAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      await expect(listNotificationsAction()).rejects.toThrow("UNAUTHENTICATED");
    });

    it("should successfully fetch and map notifications", async () => {
      mockGetCookie.mockReturnValue({ value: "valid_access_token" });
      mockListNotifications.mockResolvedValue(
        create(ListNotificationsResponseSchema, {
          notifications: [
            {
              notificationId: "notif-1",
              title: "Test Notification",
              body: "This is a test notification body.",
              isRead: false,
              createdAt: "2026-08-08T12:00:00Z",
              data: {
                type: "coach",
              },
            },
          ],
          totalCount: 1,
        }),
      );

      const { listNotificationsAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      const result = await listNotificationsAction(10, 0);

      expect(mockListNotifications).toHaveBeenCalledWith({
        userId: "",
        limit: 10,
        offset: 0,
      });
      expect(result.totalCount).toBe(1);
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0]).toStrictEqual({
        id: "notif-1",
        title: "Test Notification",
        body: "This is a test notification body.",
        isRead: false,
        createdAt: "2026-08-08T12:00:00Z",
        data: {
          type: "coach",
        },
      });
    });

    it("should throw FAILED_TO_FETCH_NOTIFICATIONS error when gRPC client fails", async () => {
      mockGetCookie.mockReturnValue({ value: "valid_access_token" });
      mockListNotifications.mockRejectedValue(new Error("gRPC failure"));

      const { listNotificationsAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      await expect(listNotificationsAction()).rejects.toThrow("FAILED_TO_FETCH_NOTIFICATIONS");
    });
  });

  describe("markNotificationAsReadAction", () => {
    it("should throw UNAUTHENTICATED error when access token is missing", async () => {
      mockGetCookie.mockReturnValue();

      const { markNotificationAsReadAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      await expect(markNotificationAsReadAction("notif-1")).rejects.toThrow("UNAUTHENTICATED");
    });

    it("should return true when successfully marked as read", async () => {
      mockGetCookie.mockReturnValue({ value: "valid_access_token" });
      mockMarkNotificationAsRead.mockResolvedValue(
        create(MarkNotificationAsReadResponseSchema, {
          success: true,
          message: "Updated successfully",
        }),
      );

      const { markNotificationAsReadAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      const result = await markNotificationAsReadAction("notif-1");

      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith({
        userId: "",
        notificationId: "notif-1",
      });
      expect(result).toBe(true);
    });

    it("should return false when API reports failure", async () => {
      mockGetCookie.mockReturnValue({ value: "valid_access_token" });
      mockMarkNotificationAsRead.mockResolvedValue(
        create(MarkNotificationAsReadResponseSchema, {
          success: false,
          message: "Failed",
        }),
      );

      const { markNotificationAsReadAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      const result = await markNotificationAsReadAction("notif-1");

      expect(result).toBe(false);
    });

    it("should return false when gRPC call throws error", async () => {
      mockGetCookie.mockReturnValue({ value: "valid_access_token" });
      mockMarkNotificationAsRead.mockRejectedValue(new Error("gRPC crash"));

      const { markNotificationAsReadAction } = await import(
        "@/features/notification/server/notification-actions"
      );

      const result = await markNotificationAsReadAction("notif-1");

      expect(result).toBe(false);
    });
  });
});
