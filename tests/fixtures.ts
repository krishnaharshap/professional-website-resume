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
