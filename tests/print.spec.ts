import { test, expect, waitForHydration } from "./fixtures";

test.describe("print (the PDF path is a first-class deliverable)", () => {
  test("print media renders a linear light document with all sections", async ({ page }) => {
    // Force dark first to prove print overrides it to light tokens.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
    await page.goto("./");
    await waitForHydration(page);
    await page.emulateMedia({ media: "print" });

    // Nav chrome and interactive-only elements disappear
    for (const selector of [".theme-toggle", ".dot-rail", ".kbd-hint", ".tested-strip"]) {
      const display = await page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).display);
      expect(display, `${selector} in print`).toBe("none");
    }

    // Resume-style contact header becomes visible in print only
    const contactDisplay = await page
      .locator(".print-contact")
      .evaluate((node) => getComputedStyle(node).display);
    expect(contactDisplay).toBe("block");
    await expect(page.locator(".print-contact")).toContainText("(587) 409-6060");

    // All six sections keep their content in the flow
    await expect(page.locator("main .slide")).toHaveCount(6);
    for (const heading of [
      "Krishna Harsha Puppala",
      "Tooling chosen by risk, not fashion",
      "Shipping insurance platforms without Sev-1s",
      "Trained where defects cost recalls",
      "Proof you can run",
      "Credentials and contact",
    ]) {
      await expect(page.locator("main")).toContainText(heading);
    }

    // Print forces light background regardless of stored theme
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor
    );
    expect(background).toBe("rgb(255, 255, 255)");

    // Sections release their viewport height so pagination works
    const minHeight = await page
      .locator("#hero")
      .evaluate((node) => getComputedStyle(node).minHeight);
    // min-height: auto computes to 0px in Blink; either means "not forced to 100svh"
    expect(["auto", "0px"]).toContain(minHeight);
  });
});
