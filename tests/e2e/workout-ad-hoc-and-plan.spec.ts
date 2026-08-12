import { expect, test } from "@playwright/test";
import { cleanUserDatabase } from "./helpers/db-cleaner";
import { analyzeWorkoutDatabase } from "./helpers/db-analyzer";

test.describe.serial("Workout Execution E2E & Database Gap Analysis", () => {
  test.setTimeout(180000);

  test.beforeAll(() => {
    // 1. Reset/Clean database before starting tests
    cleanUserDatabase();
  });

  test("Flow 1: Ad-hoc Workout (Tập tự do/Custom Plan) -> DB Analysis", { timeout: 180000 }, async ({ page }) => {
    // A. Login từ đầu với Dev New User
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Know what to train next/i })).toBeVisible();

    // Trigger dev login
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // B. Điều hướng tới Custom Ad-hoc Workout Builder
    await page.goto("/workouts/adhoc");
    await expect(page.getByRole("heading", { name: /Custom Workout Plan/i })).toBeVisible();

    // C. Thêm bài tập vào buổi tập
    const addMovementBtn = page.getByRole("button", { name: /Add movement/i });
    await expect(addMovementBtn).toBeVisible();
    await addMovementBtn.click();

    // Search sheet xuất hiện
    const searchDialog = page.getByRole("dialog", { name: /Add movement/i });
    await expect(searchDialog).toBeVisible();

    // Click nút Add của bài tập đầu tiên trong danh sách kết quả (chờ kết quả tìm kiếm tải xong)
    const firstExerciseAddBtn = searchDialog.locator(".bottom-search-sheet__item button").first();
    await expect(firstExerciseAddBtn).toBeVisible({ timeout: 20000 });
    await firstExerciseAddBtn.click();

    // Đợi sheet đóng và danh sách bài tập hôm nay hiển thị
    await expect(page.locator(".adhoc-exercise-row")).toHaveCount(1, { timeout: 10000 });

    // D. Bắt đầu buổi tập Live
    const beginBtn = page.getByRole("button", { name: /Begin session/i });
    await expect(beginBtn).toBeEnabled();
    await beginBtn.click();

    // Chuyển hướng tới màn hình Live Workout (cho phép thời gian AI khởi tạo roadmap & session plan)
    await page.waitForURL(/\/workouts\/live\/[a-zA-Z0-9_-]+$/, { timeout: 60000 });
    await expect(page.locator(".live-screen").first()).toBeVisible({ timeout: 90000 });

    // Xử lý camera / manual log fallback nếu có
    const skipCamera = page.getByRole("button", { name: /Log this set by hand|Skip the camera/i });
    try {
      await skipCamera.waitFor({ state: "visible", timeout: 3000 });
      await skipCamera.click();
    } catch {
      // Camera ready
    }

    // E. Thực hiện log set
    const doneBtn = page.getByRole("button", { name: /Done|Complete this set/i });
    await expect(doneBtn).toBeVisible({ timeout: 5000 });
    await doneBtn.click();

    // Nếu hiển thị Modal Confirm Set (chế độ Manual Log)
    const confirmSaveBtn = page.getByRole("button", { name: /Confirm & Save Set/i });
    try {
      await confirmSaveBtn.waitFor({ state: "visible", timeout: 5000 });
      await confirmSaveBtn.click();
      await page.locator(".set-confirm-dialog").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    } catch {
      // Set log completed directly
    }

    // F. Kết thúc buổi tập
    const backBtn = page.getByRole("button", { name: /^Back$/i });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    const endDialog = page.getByRole("dialog", { name: /Finish this session\?/i });
    await expect(endDialog).toBeVisible({ timeout: 10000 });

    const finishAndSaveBtn = endDialog.getByRole("button", { name: /Finish and save/i });
    await finishAndSaveBtn.click();

    // G. Xác thực màn hình Summary
    await page.waitForURL(/\/workouts\/live\/[a-zA-Z0-9_-]+\/summary$/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Session complete\./i })).toBeVisible({ timeout: 10000 });

    // H. Phân tích Database & Gap Analysis cho Luồng Ad-hoc
    const dbReport = analyzeWorkoutDatabase("Flow 1: Ad-hoc Workout");
    expect(dbReport.sessions.length).toBeGreaterThan(0);
    expect(dbReport.setLogs.length).toBeGreaterThan(0);
    expect(dbReport.sessions[0].status).toBe("COMPLETED");
  });

  test("Flow 2: Plan-based Workout (Tập theo Kế hoạch Roadmap) -> DB Analysis", { timeout: 180000 }, async ({ page }) => {
    test.setTimeout(180000);

    // A. Login với Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // Điều hướng vào Roadmap
    await page.goto("/roadmap");
    await page.waitForLoadState("networkidle");

    // Nếu chưa có Roadmap, bấm sinh Roadmap
    const generateRoadmapBtn = page.getByRole("button", { name: /Click to generate roadmap/i });
    const isGenerateVisible = await generateRoadmapBtn.isVisible().catch(() => false);
    if (isGenerateVisible) {
      await generateRoadmapBtn.click();
      await page.waitForLoadState("networkidle");
    }

    // Chọn session plan đầu tiên trong tuần
    const sessionCard = page.locator("a[href*='/roadmap/']").first();
    await expect(sessionCard).toBeVisible({ timeout: 20000 });
    await sessionCard.click();

    // Chờ vào trang preview kế hoạch, bấm Begin session
    const prepBeginBtn = page.getByRole("link", { name: /Begin session/i });
    await expect(prepBeginBtn).toBeVisible({ timeout: 20000 });
    await prepBeginBtn.click();

    // B. Màn hình Live Workout
    await page.waitForURL(/\/workouts\/live\/[a-zA-Z0-9_-]+$/, { timeout: 60000 });
    await expect(page.locator(".live-screen").first()).toBeVisible({ timeout: 90000 });

    const skipCamera = page.getByRole("button", { name: /Log this set by hand|Skip the camera/i });
    try {
      await skipCamera.waitFor({ state: "visible", timeout: 3000 });
      await skipCamera.click();
    } catch {}

    // C. Log set
    const doneBtn = page.getByRole("button", { name: /Done|Complete this set/i });
    await expect(doneBtn).toBeVisible({ timeout: 20000 });
    await doneBtn.click();

    // Nếu hiển thị Modal Confirm Set (chế độ Manual Log)
    const confirmSaveBtn = page.getByRole("button", { name: /Confirm & Save Set/i });
    try {
      await confirmSaveBtn.waitFor({ state: "visible", timeout: 5000 });
      await confirmSaveBtn.click();
      await page.locator(".set-confirm-dialog").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    } catch {
      // Set log completed directly
    }

    // D. Hoàn thành và lưu
    const backBtn = page.getByRole("button", { name: /^Back$/i });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    const endDialog = page.getByRole("dialog", { name: /Finish this session\?/i });
    await expect(endDialog).toBeVisible({ timeout: 10000 });

    await endDialog.getByRole("button", { name: /Finish and save/i }).click();

    // E. Xác thực Summary
    await page.waitForURL(/\/workouts\/live\/[a-zA-Z0-9_-]+\/summary$/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Session complete\./i })).toBeVisible({ timeout: 10000 });

    // F. Phân tích Database & Gap Analysis cho Luồng Plan
    const dbReport = analyzeWorkoutDatabase("Flow 2: Plan-based Workout");
    expect(dbReport.sessions.length).toBeGreaterThan(0);
    expect(dbReport.setLogs.length).toBeGreaterThan(0);
    expect(dbReport.sessions[0].status).toBe("COMPLETED");
  });
});
