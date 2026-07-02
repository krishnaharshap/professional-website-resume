import { test, expect } from "@playwright/test";

// @links - scheduled/manual only, never a PR gate (external hosts rate-limit
// and rot on their own clock). Run with: RUN_LINKS=1 npm run test:links
// Uses the raw Playwright test (no fixtures): the network must be real here.

// Hosts that reject bots but serve humans fine.
const HOST_POLICY: Record<string, number[]> = {
  "www.linkedin.com": [200, 302, 403, 999],
  "linkedin.com": [200, 302, 403, 999],
};

const DEFAULT_OK = (status: number) => status >= 200 && status < 400;

test.describe("external links @links", () => {
  test("every external href resolves under its host policy", async ({ page, request }) => {
    test.setTimeout(120_000);
    await page.goto("./");
    await expect(page.locator("#skills-body .skill-group").first()).toBeAttached();

    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href^='https://']"))
        .map((anchor) => (anchor as HTMLAnchorElement).href)
        .filter((href, index, all) => all.indexOf(href) === index)
    );
    expect(hrefs.length).toBeGreaterThan(5);

    const failures: string[] = [];
    for (const href of hrefs) {
      const host = new URL(href).hostname;
      const allowed = HOST_POLICY[host];
      try {
        const response = await request.get(href, {
          timeout: 15_000,
          headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) link-check" },
          maxRedirects: 5,
        });
        const status = response.status();
        const ok = allowed ? allowed.includes(status) : DEFAULT_OK(status);
        if (!ok) failures.push(`${href} -> HTTP ${status}`);
      } catch (error) {
        failures.push(`${href} -> ${String(error).slice(0, 120)}`);
      }
    }
    expect(failures, "rotten links").toEqual([]);
  });
});
