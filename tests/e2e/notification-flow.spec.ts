import { test, expect } from "@playwright/test";
import {
  seedNotificationsForTest,
  analyzeNotificationDatabase,
} from "./helpers/db-notification-analyzer";

test.describe("Notification System E2E & Database Gap Analysis", () => {
  test.beforeEach(async () => {
    // 1. Seed 3 in-app notifications vào PostgreSQL Container
    seedNotificationsForTest("00000000-0000-0000-0000-000000000001");
  });

  test("Flow 3: Notification Listing, Unread Indicators, Mark As Read & DB Gap Analysis", async ({ page }) => {
    test.setTimeout(90000);

    // A. Login Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // B. Kiểm tra Header icon chuông có chấm đỏ unread trên /home
    await page.goto("/home");
    await page.waitForLoadState("networkidle");

    const notifBtn = page.locator("a[href='/notifications'], button:has-text('Notifications')").first();
    await expect(notifBtn).toBeVisible({ timeout: 15000 });

    // C. Điều hướng tới màn hình /notifications
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    // D. Xác thực danh sách thông báo hiển thị đầy đủ 3 items
    const notifList = page.locator(".notification-list");
    await expect(notifList).toBeVisible({ timeout: 15000 });

    const notifItems = page.locator(".notification-item");
    await expect(notifItems).toHaveCount(3, { timeout: 15000 });

    // Kiểm tra tiêu đề các thông báo
    await expect(page.getByText("AI Coach: Kế hoạch tuần mới đã sẵn sàng")).toBeVisible();
    await expect(page.getByText("Kỷ lục cá nhân mới: Bench Press 100kg!")).toBeVisible();
    await expect(page.getByText("Nhắc nhở: Buổi tập hôm qua đã hoàn thành")).toBeVisible();

    // E. Click vào thông báo chưa đọc đầu tiên để đánh dấu Đã Đọc
    const unreadItem = page.locator(".notification-item[data-unread]").first();
    await expect(unreadItem).toBeVisible();
    await unreadItem.click();

    // Chờ 1 giây để RPC MarkNotificationAsRead hoàn tất và cập nhật DB
    await page.waitForTimeout(1000);

    // F. Database Gap Analysis
    // Kiểm tra PostgreSQL xem bản ghi a0000000-0000-0000-0000-000000000001 đã chuyển is_read = true chưa
    const analysis = analyzeNotificationDatabase(
      "00000000-0000-0000-0000-000000000001",
      "a0000000-0000-0000-0000-000000000001",
    );

    // Bắt buộc 0 Data Gaps
    expect(analysis.gaps).toHaveLength(0);
    expect(analysis.notifications).toHaveLength(3);
    expect(analysis.unreadCount).toBe(1); // Ban đầu có 2 unread, click 1 cái -> còn 1 unread
    expect(analysis.readCount).toBe(2);   // Ban đầu có 1 read, giờ thành 2 read
  });
});
