import { expect, test } from "@playwright/test";

test("login opens the guided onboarding flow", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Know what to train next." })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole("heading", { name: "What should training make easier?" }),
  ).toBeVisible();
});

test("home leads into a manual workout and summary", async ({ page }) => {
  await page.goto("/home");

  await expect(page.getByRole("heading", { name: "Upper-body control" })).toBeVisible();
  await page.getByRole("link", { name: "Begin session" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Upper-body control" })).toBeVisible();

  await page.getByRole("link", { name: "Begin session" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Incline push-up" })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Rest Time Remaining", { exact: true })).toBeVisible();

  // Back is navigation, not a guillotine: it must ask before it ends the
  // session, because ending it clears the resume draft irreversibly.
  await page.getByRole("button", { name: "Back" }).click();
  const endDialog = page.getByRole("dialog", { name: "Workout completed" });
  await expect(endDialog).toBeVisible();
  await expect(page.getByRole("heading", { name: "Session complete." })).toBeHidden();

  await endDialog.getByRole("button", { name: "Next Challenge" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Session complete." })).toBeVisible();
});

test("mobile product routes keep the primary navigation available", async ({ page }) => {
  await page.goto("/roadmap");

  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your four-week route" })).toBeVisible();
});
