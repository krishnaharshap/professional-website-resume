import { test, expect, waitForHydration } from "./fixtures";

test.describe("responsive", () => {
  test("mobile 375x812: dot rail hidden, content readable, native scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator(".dot-rail")).toBeHidden();
    await expect(page.locator("h1")).toBeVisible();

    // Body text never drops below 16px (design rule)
    const bodySize = await page
      .locator(".value-prop")
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(bodySize).toBeGreaterThanOrEqual(16);
  });

  test("short laptop 1280x620: snap released so nothing clips", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 620 });
    await page.goto("./");
    const snap = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType
    );
    expect(snap).toBe("none");

    const slideMinHeight = await page
      .locator("#hero")
      .evaluate((node) => getComputedStyle(node).minHeight);
    // min-height: auto computes to 0px in Blink; either means "not forced to 100svh"
    expect(["auto", "0px"]).toContain(slideMinHeight);
  });

  test("desktop 1440x900: dot rail visible, snap active", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./");
    await expect(page.locator(".dot-rail")).toBeVisible();
    const snap = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType
    );
    expect(snap).toContain("y");
  });

  test("no horizontal overflow at any tested width", async ({ page }) => {
    for (const width of [320, 375, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("./");
      await waitForHydration(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});
