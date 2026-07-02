import AxeBuilder from "@axe-core/playwright";
import { test, expect, waitForHydration } from "./fixtures";

test.describe("accessibility", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`axe scan passes in ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => {
        try {
          localStorage.setItem("theme", value);
        } catch {}
      }, theme);
      await page.goto("./");
      await waitForHydration(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const serious = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? "")
      );
      expect(
        serious.map((violation) => `${violation.id}: ${violation.help}`),
        `axe violations in ${theme} theme`
      ).toEqual([]);
    });
  }

  test("keyboard-only traversal reaches every section", async ({ page }) => {
    await page.goto("./");
    // Skip link is the first tab stop
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();

    // Arrow keys traverse all six sections; focus follows navigation
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
    }
    await expect.poll(() => page.url()).toContain("#credentials");
    await expect(page.locator("#credentials")).toBeFocused();
  });

  test("landmarks and labels exist", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("nav[aria-label='Sections']")).toBeAttached();
    await expect(page.locator("main")).toBeAttached();
    await expect(page.locator("#live-region[aria-live='polite']")).toBeAttached();
    for (const section of await page.locator("main .slide").all()) {
      expect(await section.getAttribute("aria-label")).toBeTruthy();
    }
  });
});
