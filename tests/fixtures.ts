import { test as base, expect } from "@playwright/test";

// Shared fixture for every spec except links.spec (@links):
// - Console errors and page errors fail the test. A resume site that logs
//   errors is a failed test by definition. Fonts and links are all
//   same-origin or plain <a> tags now, so no network stubbing is needed.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push("pageerror: " + error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("console: " + message.text());
    });

    // The live analytics collector is a real cross-origin host now that
    // index.html carries data-collector. Its Origin check correctly rejects
    // localhost, and Chromium logs that as a console error, which would fail
    // every test in this suite for a reason that has nothing to do with the
    // test itself. Stub it here so beacon delivery is a no-op unless a test
    // (tests/analytics.spec.ts) deliberately injects its own fake collector
    // URL and asserts against it.
    await page.route("**/portfolio-analytics.krishnaharshap11.workers.dev/e", (route) =>
      route.fulfill({ status: 204, body: "" })
    );

    // data/analytics.json is committed real data now that the Publish
    // analytics workflow runs daily, so its generatedAt is no longer reliably
    // null the way tests outside tests/analytics.spec.ts assume. Every other
    // spec navigates expecting exactly 6 sections with #insights hidden;
    // stub the file inert by default so that stays true regardless of what
    // the repo's live analytics data looks like on any given day.
    // tests/analytics.spec.ts registers its own page.route on this same URL
    // per test via serveAnalytics(), which is added after this one and so
    // takes priority for that suite.
    await page.route("**/data/analytics.json*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ generatedAt: null }),
      })
    );

    await use(page);

    expect(errors, "page must not log console or page errors").toEqual([]);
  },
});

export { expect };

/** Wait until JSON hydration has filled the dynamic sections. */
export async function waitForHydration(page: import("@playwright/test").Page) {
  await expect(page.locator("#skills-body .skill-group").first()).toBeAttached();
  await expect(page.locator(".skeleton")).toHaveCount(0);
}
