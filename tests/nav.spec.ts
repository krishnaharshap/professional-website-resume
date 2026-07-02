import { test, expect } from "./fixtures";

async function activeSection(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const current = document.querySelector(".dot[aria-current='true']");
    return current?.getAttribute("data-section") ?? null;
  });
}

test.describe("navigation", () => {
  test("arrow keys move between sections and update the hash", async ({ page }) => {
    await page.goto("./");
    await page.locator("body").click({ position: { x: 5, y: 5 } });

    await page.keyboard.press("ArrowRight");
    await expect.poll(() => page.url()).toContain("#skills");
    expect(await activeSection(page)).toBe("skills");

    await page.keyboard.press("ArrowRight");
    await expect.poll(() => page.url()).toContain("#experience");

    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => page.url()).toContain("#skills");

    await page.keyboard.press("End");
    await expect.poll(() => page.url()).toContain("#credentials");

    await page.keyboard.press("Home");
    await expect.poll(() => page.url()).toContain("#hero");
  });

  test("dots navigate, mark current, and have 44px hit areas", async ({ page }) => {
    await page.goto("./");
    const projectsDot = page.locator(".dot[data-section='projects']");
    const box = await projectsDot.boundingBox();
    expect(box, "dot hit area").not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await projectsDot.click();
    await expect.poll(() => page.url()).toContain("#projects");
    await expect(projectsDot).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#projects")).toBeInViewport();
  });

  test("deep link lands on the section", async ({ page }) => {
    await page.goto("./#projects");
    await expect(page.locator("#projects")).toBeInViewport();
    await expect(page.locator(".dot[data-section='projects']")).toHaveAttribute("aria-current", "true");
  });

  test("legacy #pageN hashes map to new sections", async ({ page }) => {
    await page.goto("./#page2");
    await expect.poll(() => page.url()).toContain("#skills");
    await expect(page.locator("#skills")).toBeInViewport();
  });

  test("junk hash falls back to the top", async ({ page }) => {
    await page.goto("./#not-a-section");
    await expect(page.locator(".dot[data-section='hero']")).toHaveAttribute("aria-current", "true");
    await expect(page.locator("#hero")).toBeInViewport();
  });

  test("browser back returns to the previous section", async ({ page }) => {
    await page.goto("./");
    await page.locator(".dot[data-section='skills']").click();
    await expect.poll(() => page.url()).toContain("#skills");
    await page.locator(".dot[data-section='projects']").click();
    await expect.poll(() => page.url()).toContain("#projects");

    await page.goBack();
    await expect.poll(() => page.url()).toContain("#skills");
    await expect(page.locator("#skills")).toBeInViewport();
  });

  test("section changes are announced to the live region", async ({ page }) => {
    await page.goto("./");
    await page.locator(".dot[data-section='skills']").click();
    await expect(page.locator("#live-region")).toContainText("Section 2 of 6");
  });

  test("keyboard hint appears only when JS runs", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("[data-nav-hint]")).toBeVisible();
  });
});
