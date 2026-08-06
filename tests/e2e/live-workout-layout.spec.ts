import { expect, test } from "@playwright/test";

// iPhone 14-ish viewport — the smallest target the spec cares about.
test.use({ viewport: { height: 844, width: 390 } });

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
    // the fade affordance must be on.
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

  // Guards DESIGN.md's One Leader Rule: the active screen spends its entire
  // accent budget on the ring arc. Any second Coral element is a regression.
  test("the ring is the screen's only accent", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".countdown-ring");

    // Sprint Coral leads the active screen and belongs to the arc alone.
    const coralElements = await page.evaluate(() => {
      const coral = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-effort")
        .trim();
      const toRgb = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const target = toRgb(coral);

      return [...document.querySelectorAll<HTMLElement>(".live-screen *")].filter((el) => {
        const style = getComputedStyle(el);
        const candidates = [
          style.backgroundColor,
          style.color,
          style.stroke,
          style.fill,
          style.outlineColor,
          style.borderTopColor,
          style.borderRightColor,
          style.borderBottomColor,
          style.borderLeftColor,
          style.textDecorationColor,
        ];
        return candidates.includes(target);
      }).length;
    });

    expect(coralElements).toBe(1);
  });
});
