import { test, expect } from "@playwright/test";
import {
  seedProfileAndRoadmapForTest,
  analyzeProfileDatabase,
} from "./helpers/db-profile-analyzer";

test.describe("Profile & Adaptive Plan Regeneration E2E & DB Gap Analysis", () => {
  test.beforeEach(async () => {
    // Seed baseline profile and roadmap with past completed & future pending sessions
    seedProfileAndRoadmapForTest("00000000-0000-0000-0000-000000000001");
  });

  test("Flow 4: Update Body Metrics, Report Injury & Database Gap Analysis", async ({ page }) => {
    test.setTimeout(120000);

    // A. Login Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // B. Điều hướng tới màn hình /profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // C. Mở Modal "Body Metrics" và cập nhật chỉ số
    const bodyMetricsBtn = page.getByRole("button", { name: /Body Metrics/i });
    await expect(bodyMetricsBtn).toBeVisible({ timeout: 15000 });
    await bodyMetricsBtn.click();

    // Điền cân nặng mới: 75kg, target 72kg, body fat 16%
    const currentWeightInput = page.locator("label:has-text('Current Weight') + input");
    await expect(currentWeightInput).toBeVisible({ timeout: 10000 });
    await currentWeightInput.fill("75");

    const targetWeightInput = page.locator("label:has-text('Target Weight') + input");
    await targetWeightInput.fill("72");

    const bodyFatInput = page.locator("label:text-is('Body Fat (%)') + input");
    await bodyFatInput.fill("16");

    // Bấm Save Changes
    const saveChangesBtn = page.getByRole("button", { name: /Save Changes/i });
    await saveChangesBtn.click();

    // Xác nhận trong Confirm Dialog
    const confirmBtn = page.getByRole("button", { name: /Confirm & Save/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Đợi Modal đóng sau khi lưu gRPC
    await page.waitForTimeout(1500);

    // D. Mở Modal "Injury Management" và báo cáo chấn thương
    const injuryMenuBtn = page.getByRole("button", { name: /Injury Management/i });
    await expect(injuryMenuBtn).toBeVisible({ timeout: 15000 });
    await injuryMenuBtn.click();

    const reportInjuryBtn = page.getByRole("button", { name: /\+ Report Injury/i });
    await expect(reportInjuryBtn).toBeVisible({ timeout: 10000 });
    await reportInjuryBtn.click();

    // Chọn nhóm cơ Shoulders
    const shoulderBtn = page.getByRole("button", { name: /^Shoulders$/i });
    await expect(shoulderBtn).toBeVisible();
    await shoulderBtn.click();

    // Nhập ghi chú chấn thương
    const notesInput = page.getByPlaceholder(/Pain during overhead press/i);
    await expect(notesInput).toBeVisible({ timeout: 5000 });
    await notesInput.fill("Shoulder strain during overhead press");

    // Submit báo cáo chấn thương
    const submitReportBtn = page.getByRole("button", { name: /Submit Report/i });
    await expect(submitReportBtn).toBeVisible();
    await submitReportBtn.click();

    // Chờ 2 giây để gRPC lưu vào DB và phát sinh event
    await page.waitForTimeout(2000);

    // Đóng modal chấn thương
    const closeBtn = page.locator("button[aria-label='Close modal']");
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }

    // E. Database Gap Analysis
    // Kiểm tra trực tiếp PostgreSQL container
    const analysis = analyzeProfileDatabase(
      "00000000-0000-0000-0000-000000000001",
      75,
      72,
      16,
      "Shoulders",
    );

    // Bắt buộc 0 Data Gaps
    expect(analysis.gaps).toHaveLength(0);
    expect(Number(analysis.latestMetrics.weight_kg)).toBe(75);
    expect(Number(analysis.user.target_weight_kg)).toBe(72);
    expect(Number(analysis.latestMetrics.body_fat_percent)).toBe(16);
    expect(analysis.injuries.length).toBeGreaterThanOrEqual(1);
    expect(analysis.pastCompletedPlans).toHaveLength(1);
    expect(analysis.pastCompletedPlans[0].status).toBe("COMPLETED");
  });
});
