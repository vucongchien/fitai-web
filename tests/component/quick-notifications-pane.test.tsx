import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  listNotificationsAction,
  markNotificationAsReadAction,
} from "@/features/notification/server/notification-actions";
import {
  notificationListStore,
  QuickNotificationsPane,
} from "@/shared/ui/side-panel/quick-notifications-pane";
import { sidePanelStore } from "@/shared/ui/side-panel/side-panel-context";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/notification/server/notification-actions", () => ({
  listNotificationsAction: vi.fn(),
  markNotificationAsReadAction: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/shared/ui/header-actions", () => ({
  notificationBadgeStore: {
    refresh: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("QuickNotificationsPane", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as never);
    sidePanelStore.open("notifications");
  });

  it("renders high-contrast action token for unread notification icon and closes panel after navigating", async () => {
    vi.mocked(listNotificationsAction).mockResolvedValue({
      notifications: [
        {
          id: "notif-1",
          title: "Nhắc nhở bữa ăn",
          body: "Sắp đến giờ ăn",
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { route: "/nutrition" },
        },
        {
          id: "notif-2",
          title: "Thông báo hệ thống",
          body: "Không có đường dẫn",
          isRead: false,
          createdAt: new Date().toISOString(),
          data: {},
        },
      ],
      totalCount: 2,
    });

    await notificationListStore.refresh();

    render(<QuickNotificationsPane />);

    const navItemButton = screen.getByText("Nhắc nhở bữa ăn").closest("button");
    expect(navItemButton).toBeTruthy();

    // Unread icon badge uses defined bg-action + text-white instead of undefined bg-brand-500
    const iconBadge = navItemButton?.querySelector("div");
    expect(iconBadge?.className).toContain("bg-action");
    expect(iconBadge?.className).toContain("text-white");
    expect(iconBadge?.className).not.toContain("bg-brand-");

    // Clicking a non-navigating notification keeps panel open
    const staticItemButton = screen.getByText("Thông báo hệ thống").closest("button");
    fireEvent.click(staticItemButton!);
    expect(pushMock).not.toHaveBeenCalled();
    expect(sidePanelStore.getSnapshot()).toBe("notifications");

    // Clicking a navigating notification navigates AND closes the panel
    fireEvent.click(navItemButton!);
    expect(pushMock).toHaveBeenCalledWith("/nutrition");
    expect(sidePanelStore.getSnapshot()).toBeNull();
    expect(markNotificationAsReadAction).toHaveBeenCalled();
  });
});
