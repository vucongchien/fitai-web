import { test, expect } from "@playwright/test";
import {
  seedProfileAndRoadmapForTest,
  seedActiveInjury,
  analyzeProfileDatabase,
  analyzeInjuryRecovery,
  analyzeWorkoutAbortAndHistory,
} from "./helpers/db-profile-analyzer";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

test.describe("Profile & Adaptive Plan Regeneration E2E & DB Gap Analysis", () => {
  test.beforeEach(async () => {
    // Seed baseline profile and roadmap with 1 past completed & 1 future pending session
    seedProfileAndRoadmapForTest(TEST_USER_ID);
  });

  test("Flow 4.1: Update Body Metrics, Anti-Overwrite Check & ProfileUpdated Outbox Event", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // 2. Navigate to /profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // 3. Open "Body Metrics" Modal & update metrics
    const bodyMetricsBtn = page.getByRole("button", { name: /Body Metrics/i });
    await expect(bodyMetricsBtn).toBeVisible({ timeout: 15000 });
    await bodyMetricsBtn.click();

    // Fill new weight: 75kg, target: 72kg, body fat: 16%
    const currentWeightInput = page.locator("label:has-text('Current Weight') + input");
    await expect(currentWeightInput).toBeVisible({ timeout: 10000 });
    await currentWeightInput.fill("75");

    const targetWeightInput = page.locator("label:has-text('Target Weight') + input");
    await targetWeightInput.fill("72");

    const bodyFatInput = page.locator("label:text-is('Body Fat (%)') + input");
    await bodyFatInput.fill("16");

    // Save changes
    const saveChangesBtn = page.getByRole("button", { name: /Save Changes/i });
    await saveChangesBtn.click();

    // Confirm in dialog
    const confirmBtn = page.getByRole("button", { name: /Confirm & Save/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Wait for modal to close and DB to persist
    await page.waitForTimeout(2000);

    // 4. Database Gap Analysis
    const analysis = analyzeProfileDatabase(
      TEST_USER_ID,
      75,
      72,
      16,
    );

    // Assert 0 Data Gaps
    expect(analysis.gaps).toHaveLength(0);
    expect(Number(analysis.latestMetrics.weight_kg)).toBe(75);
    expect(Number(analysis.user.target_weight_kg)).toBe(72);
    expect(Number(analysis.latestMetrics.body_fat_percent)).toBe(16);
    expect(analysis.pastCompletedPlans).toHaveLength(1);
    expect(analysis.pastCompletedPlans[0].status).toBe("COMPLETED");
  });

  test("Flow 4.2: Report Active Injury (Shoulders) & Verify InjuryReported Event", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // 2. Navigate to /profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // 3. Open "Injury Management" modal
    const injuryMenuBtn = page.getByRole("button", { name: /Injury Management/i });
    await expect(injuryMenuBtn).toBeVisible({ timeout: 15000 });
    await injuryMenuBtn.click();

    // Click "+ Report Injury"
    const reportInjuryBtn = page.getByRole("button", { name: /\+ Report Injury/i });
    await expect(reportInjuryBtn).toBeVisible({ timeout: 10000 });
    await reportInjuryBtn.click();

    // Select "Shoulders"
    const shoulderBtn = page.getByRole("button", { name: /Shoulders/i }).first();
    await expect(shoulderBtn).toBeVisible();
    await shoulderBtn.click();

    // Fill notes
    const notesInput = page.getByPlaceholder(/Pain during overhead press/i);
    await expect(notesInput).toBeVisible({ timeout: 5000 });
    await notesInput.fill("Shoulder strain during overhead press");

    // Submit report
    const submitReportBtn = page.getByRole("button", { name: /Submit Report/i });
    await expect(submitReportBtn).toBeVisible();
    await submitReportBtn.click();

    // Confirm in dialog
    const confirmBtn = page.getByRole("button", { name: /Confirm & Recalibrate|Confirm/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Wait for submission to complete and report form to close
    await expect(reportInjuryBtn).toBeVisible({ timeout: 10000 });

    // 4. Verify AI Adjustment Banner appears on /home with real data
    await page.goto("/home");
    const aiBanner = page.getByRole("status").filter({ hasText: /AI Coach/i }).first();
    await expect(aiBanner).toBeVisible({ timeout: 5000 });
    await expect(aiBanner).toContainText("Shoulders");

    // 5. Database Gap Analysis
    const analysis = analyzeProfileDatabase(
      TEST_USER_ID,
      undefined,
      undefined,
      undefined,
      "Shoulders",
    );

    expect(analysis.gaps).toHaveLength(0);
    expect(analysis.injuries.length).toBeGreaterThanOrEqual(1);
    const shoulderInjury = analysis.injuries.find((i) => i.muscle_group?.toUpperCase() === "SHOULDERS");
    expect(shoulderInjury).toBeDefined();
    expect(shoulderInjury.is_recovered).toBe(false);
  });

  test("Flow 4.3: Recover Injury & Verify InjuryRecovered Event", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Seed an active Knee injury in DB
    seedActiveInjury(TEST_USER_ID, "22222222-2222-2222-2222-222222222222", "Knee");

    // 2. Login & Navigate to /profile
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // 3. Open "Injury Management" modal
    const injuryMenuBtn = page.getByRole("button", { name: /Injury Management/i });
    await expect(injuryMenuBtn).toBeVisible({ timeout: 15000 });
    await injuryMenuBtn.click();

    // Look for "Mark as Recovered" button
    const recoverBtn = page.getByRole("button", { name: "Mark as Recovered" }).first();
    await expect(recoverBtn).toBeVisible({ timeout: 10000 });
    await recoverBtn.click();

    // Confirm in modal dialog
    const confirmBtn = page.getByRole("button", { name: /Confirm Recovery|Confirm/i }).first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait 2s for gRPC execution & DB update
    await page.waitForTimeout(2000);

    // 4. Database Gap Analysis for Recovery
    const recoveryReport = analyzeInjuryRecovery(TEST_USER_ID, "Knee");
    expect(recoveryReport.gaps).toHaveLength(0);
    expect(recoveryReport.recoveredInjury).toBeDefined();
    expect(recoveryReport.recoveredInjury.is_recovered).toBe(true);
    expect(recoveryReport.outboxEvent).toBeDefined();
  });

  test("Flow 4.4: Live Workout Pain-Stop & History Preservation (Rule D3)", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login Dev New User
    await page.goto("/api/auth/dev-login?target=new");
    await page.waitForLoadState("networkidle");

    // 2. Open Live Workout page for the pending session
    const pendingSessionId = `sp_e2e_prof_pending_${TEST_USER_ID}`;
    await page.goto(`/workouts/live/${pendingSessionId}`);
    await page.waitForLoadState("domcontentloaded");

    // 3. Skip camera if prompt appears
    const skipCamera = page.getByRole("button", { name: /Log this set by hand|Skip the camera/i });
    if (await skipCamera.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipCamera.click();
    }

    // 4. Trigger "Report pain" or "End Session"
    const reportPainBtn = page.getByRole("button", { name: /Report pain/i });
    if (await reportPainBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportPainBtn.click();
    } else {
      const endSessionBtn = page.locator("button:has-text('End Session'), button[aria-label='End Session'], button:has-text('Exit')").first();
      if (await endSessionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await endSessionBtn.click();
        const painReasonBtn = page.locator("button:has-text('Pain'), [data-reason='pain']").first();
        if (await painReasonBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await painReasonBtn.click();
          const confirmAbortBtn = page.getByRole("button", { name: /End Workout|Confirm|End Session/i }).first();
          if (await confirmAbortBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmAbortBtn.click();
          }
        }
      }
    }

    // Wait 2s for state/persistence
    await page.waitForTimeout(2000);

    // 5. Database Gap Analysis for D3 Invariant
    const d3Report = analyzeWorkoutAbortAndHistory(TEST_USER_ID, pendingSessionId);
    expect(d3Report.gaps).toHaveLength(0);
    expect(d3Report.pastCompletedSessions).toHaveLength(1);
    expect(d3Report.pastCompletedSessions[0].status).toBe("COMPLETED");
  });
});
