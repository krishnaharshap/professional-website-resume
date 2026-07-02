import { test as base, expect } from "@playwright/test";

// Shared fixture for every spec except links.spec (@links):
// - External hosts (fonts, GitHub badge) are stubbed with empty 200s so the
//   suite never depends on the network. Aborting instead of fulfilling would
//   log "Failed to load resource" console errors and trip the error gate.
// - Console errors and page errors fail the test. A resume site that logs
//   errors is a failed test by definition.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push("pageerror: " + error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("console: " + message.text());
    });

    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.fulfill({ contentType: "text/css", body: "" })
    );
    await page.route("https://fonts.gstatic.com/**", (route) =>
      route.fulfill({ contentType: "font/woff2", body: "" })
    );
    await page.route("https://github.com/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20"></svg>',
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
