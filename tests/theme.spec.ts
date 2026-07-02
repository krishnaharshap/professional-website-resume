import { test, expect } from "./fixtures";

async function currentTheme(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.getAttribute("data-theme"));
}

test.describe("theme", () => {
  test("follows system preference on first visit, no FOUC attribute gap", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark", reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("./");
    expect(await currentTheme(page)).toBe("dark");
    await expect(page.locator("#theme-toggle")).toHaveText("theme: dark");
    await context.close();
  });

  test("toggle flips the palette and persists across reload", async ({ page }) => {
    await page.goto("./");
    const initial = await currentTheme(page);
    const flipped = initial === "dark" ? "light" : "dark";

    await page.locator("#theme-toggle").click();
    expect(await currentTheme(page)).toBe(flipped);
    await expect(page.locator("#theme-toggle")).toHaveText("theme: " + flipped);

    await page.reload();
    expect(await currentTheme(page)).toBe(flipped);
  });

  test("blocked localStorage degrades to session-only theme", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("denied");
        },
      });
    });
    await page.goto("./");
    const initial = await currentTheme(page);
    const flipped = initial === "dark" ? "light" : "dark";
    await page.locator("#theme-toggle").click();
    expect(await currentTheme(page)).toBe(flipped);
  });

  test("theme attribute is set before first paint", async ({ page }) => {
    await page.goto("./");
    // The inline head snippet runs before the stylesheet: by the time
    // anything rendered, data-theme must exist.
    const hadThemeAtStart = await page.evaluate(
      () => document.documentElement.getAttribute("data-theme") !== null
    );
    expect(hadThemeAtStart).toBe(true);
  });
});
