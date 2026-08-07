import { expect, test } from 'vitest';
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// IPhone 14-ish viewport — the smallest target the spec cares about.
test.use({ viewport: { height: 844, width: 390 } });

// Guards DESIGN.md's One Leader Rule: the active screen spends its entire
// Accent budget on the ring arc. Any second Coral element is a regression —
// And Relay Blue is not an accent on either screen at all.
//
// The walk covers the whole `body`, not `.live-screen *`: fixed overlays
// (the framing check, the end-session dialog) are siblings of the screen, and
// Scoping the old version inside it is exactly why a solid-blue camera button
// And a scrim went unseen.
const countElementsUsing = (page: Page, token: string, skip: string[]) =>
  page.evaluate(
    ({ skipProps, tokenName }) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
      const probe = document.createElement("span");
      probe.style.color = raw;
      document.body.append(probe);
      const target = getComputedStyle(probe).color;
      probe.remove();

      const props = [
        "backgroundColor",
        "color",
        "stroke",
        "fill",
        "outlineColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
        "textDecorationColor",
      ].filter((prop) => !skipProps.includes(prop));

      return [...document.querySelectorAll<HTMLElement>("body *")].filter((el) => {
        const style = getComputedStyle(el) as unknown as Record<string, string>;
        return props.some((prop) => style[prop] === target);
      }).length;
    },
    { skipProps: skip, tokenName: token },
  );

test.describe("live workout layout", () => {
  test("the active screen fits the viewport without page scroll", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".live-screen");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("only the coaching panel scrolls", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    const panel = page.locator(".live-screen__coach");
    await panel.waitFor();

    const canScroll = await panel.evaluate((el) => el.scrollHeight > el.clientHeight);
    const bodyCanScroll = await page.evaluate(
      () => document.body.scrollHeight > document.body.clientHeight,
    );

    expect(bodyCanScroll).toBe(false);
    // The panel may or may not overflow depending on copy length; if it does,
    // The fade affordance must be on.
    if (canScroll) {
      await expect(panel).toHaveAttribute("data-scrollable", "true");
    }
  });

  test("the countdown ring clears the home indicator", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    const ring = page.locator(".countdown-ring");
    await ring.waitFor();

    const box = await ring.boundingBox();
    const viewportHeight = page.viewportSize()!.height;

    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(viewportHeight);
  });

  test("the ring is the screen's only Sprint Coral", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".countdown-ring");

    expect(await countElementsUsing(page, "--color-effort", [])).toBe(1);
  });

  test("Relay Blue is never used as an accent on the live screens", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".countdown-ring");

    // `outlineColor` is exempt for this colour alone: the global focus ring is
    // Relay Blue by design, and it is the one place DESIGN.md still allows it.
    expect(await countElementsUsing(page, "--color-action", ["outlineColor"])).toBe(0);
  });
});
