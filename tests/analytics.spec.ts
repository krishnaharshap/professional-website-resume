import AxeBuilder from "@axe-core/playwright";
import { test, expect, waitForHydration } from "./fixtures";
import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

const COLLECTOR = "https://collector.test/e";

/**
 * The collector endpoint is read from data-collector on <html>, which is absent
 * in the shipped file so the site is inert before the Worker is deployed and so
 * the rest of the suite stays hermetic. Injecting it here is the only way to
 * exercise the beacon, and rewriting the document is deterministic in a way
 * that addInitScript ordering is not.
 */
async function enableCollector(page: Page) {
  // Predicate rather than a pattern: baseURL varies between the local server
  // and the live Pages subpath, and query strings must not defeat the match.
  const isDocument = (url: URL) =>
    url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

  await page.route(isDocument, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      '<html lang="en"',
      `<html data-collector="${COLLECTOR}" lang="en"`
    );
    await route.fulfill({ response, body, contentType: "text/html; charset=utf-8" });
  });
}

// Must be awaited. An unawaited page.route is a race against the first beacon,
// which Chromium happens to win and WebKit does not.
//
// A null entry means "a beacon fired but its body was not readable". WebKit's
// Playwright build returns null from postData, postDataBuffer AND postDataJSON
// for a Blob-based sendBeacon, so recording the null keeps "did a beacon fire"
// assertable in every browser while body assertions declare their requirement.
async function captureBeacons(page: Page) {
  const beacons: Array<Record<string, unknown> | null> = [];
  await page.route(COLLECTOR, async (route) => {
    const raw = route.request().postData();
    if (raw === null || raw === undefined) {
      beacons.push(null);
    } else {
      try {
        beacons.push(JSON.parse(raw));
      } catch {
        beacons.push(null);
      }
    }
    await route.fulfill({ status: 204, body: "" });
  });
  return beacons;
}

/**
 * sendBeacon is best-effort by specification and the browser decides when to
 * dispatch. WebKit in particular queues beacons and flushes them when the page
 * hides rather than sending on the spot, so no test here may assume the load
 * beacon has landed while the page is still visible. Every assertion runs after
 * hidePage(), against the delivered set, which is all the contract promises.
 */
async function waitForBeacons(beacons: unknown[], count: number) {
  await expect
    .poll(() => beacons.length, { timeout: 20000 })
    .toBeGreaterThanOrEqual(count);
}

function findBeacon(beacons: Array<Record<string, unknown> | null>, phase: string) {
  return beacons.find((b) => b !== null && b.p === phase) ?? undefined;
}

/** Deterministic stand-in for the real pagehide, which races the router. */
async function hidePage(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function analyticsFixture(overrides: Record<string, unknown> = {}) {
  const days = Array.from({ length: 30 }, (_, i) =>
    new Date(Date.UTC(2026, 6, 1 + i)).toISOString().slice(0, 10)
  );
  const sessions = days.map((_, i) => (i % 5) + 1);
  return {
    generatedAt: new Date().toISOString(),
    minSample: 30,
    sampleMet: true,
    series: {
      days,
      sessions,
      sessionsMean7: sessions.map((_, i) => (i < 6 ? null : 3)),
    },
    sources: [
      { key: "linkedin", total: 52, series: sessions },
      { key: "direct", total: 18, series: sessions },
    ],
    readThrough: [
      { index: 0, label: "Intro", sessions: 100, rate: 1 },
      { index: 1, label: "Skills", sessions: 61, rate: 0.61 },
      { index: 4, label: "Projects", sessions: 24, rate: 0.24 },
    ],
    kpi: {
      sessionsWindow: 41,
      windowDays: 30,
      // The real upstream summary is a single rolling window with no
      // comparison to a prior period, so this stays null rather than a
      // fabricated delta. The dashboard must render correctly without it.
      sessionsDelta: null,
      readThroughRate: 0.42,
      topSource: "linkedin",
      pdfDownloads: 5,
      mobileShare: 0.34,
    },
    ...overrides,
  };
}

async function serveAnalytics(page: Page, body: unknown, status = 200) {
  await page.route("**/data/analytics.json*", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

test.describe("analytics beacon", () => {
  // Runs everywhere: delivery is the part that must hold in every browser.
  test("delivers a beacon on load and again when the page hides", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./");
    await hidePage(page);
    await waitForBeacons(beacons, 2);

    // Two per session, not one per event. That is the whole batching design.
    expect(beacons.length).toBe(2);
  });
});

// Body assertions only. WebKit does not expose the payload of a Blob-based
// sendBeacon to Playwright at all, so these cannot run there. The delivery test
// above and the resilience tests below still cover WebKit.
test.describe("analytics beacon payload", () => {
  test.skip(
    ({ browserName }) => browserName === "webkit",
    "WebKit returns null for postData/postDataBuffer/postDataJSON on Blob beacons"
  );

  test("sends a load beacon with source and device", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./?utm_source=linkedin");
    await hidePage(page);
    await waitForBeacons(beacons, 1);

    const load = findBeacon(beacons, "load");
    expect(load).toMatchObject({ p: "load", s: "linkedin", d: "desktop", x: 0, f: 0 });
    expect(String(load?.t)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  test("falls back to referrer classification when no UTM tag is present", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./");
    await hidePage(page);
    await waitForBeacons(beacons, 1);

    // No referrer in a direct Playwright navigation.
    expect(findBeacon(beacons, "load")?.s).toBe("direct");
  });

  test("reuses one session token across both beacons", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./");
    await hidePage(page);
    await waitForBeacons(beacons, 2);

    const load = findBeacon(beacons, "load");
    const unload = findBeacon(beacons, "unload");
    expect(load).toBeDefined();
    expect(unload).toBeDefined();
    // One session, one token: this is what stops a visit counting twice.
    expect(unload?.t).toBe(load?.t);
  });

  test("reports the deepest section reached, sourced from the nav observer", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./");
    await waitForHydration(page);

    // Driven through nav's own keyboard path rather than a raw scroll, so this
    // asserts the nav:section contract instead of IntersectionObserver timing.
    await page.keyboard.press("End");
    await expect(page.locator('.dot[data-section="credentials"]')).toHaveAttribute(
      "aria-current",
      "true"
    );

    await hidePage(page);
    await waitForBeacons(beacons, 2);
    expect(Number(findBeacon(beacons, "unload")?.x)).toBe(5);
  });

  test("flags a resume download", async ({ page }) => {
    await enableCollector(page);
    const beacons = await captureBeacons(page);

    await page.goto("./");
    await page.evaluate(() => {
      document.querySelector<HTMLAnchorElement>('a[href$=".pdf"]')?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    await hidePage(page);
    await waitForBeacons(beacons, 2);
    expect(findBeacon(beacons, "unload")?.f).toBe(1);
  });
});

test.describe("analytics resilience", () => {
  test("sends nothing when the collector is not configured", async ({ page }) => {
    const beacons = await captureBeacons(page);
    await page.goto("./");
    await waitForHydration(page);
    await hidePage(page);
    expect(beacons).toHaveLength(0);
  });

  // Uses the base test, not the shared fixture, and the exception is deliberate.
  // A network-level failure makes Chromium log "Failed to load resource" itself;
  // that log comes from the browser, not from our code, and no amount of
  // swallowing on our side suppresses it. Ad blockers produce the same line on
  // every analytics-bearing site. What matters is that the page is unaffected,
  // which is what this asserts.
  base("a dead collector does not break the page", async ({ page }) => {
    await enableCollector(page);
    await page.route(COLLECTOR, (route) => route.abort("failed"));

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("./");
    await expect(page.locator("#skills-body .skill-group").first()).toBeAttached();
    await hidePage(page);

    await expect(page.locator("h1")).toHaveText("Krishna Harsha Puppala");
    await expect(page.locator("#contact-body a[href^='mailto:']")).toBeAttached();
    await expect(page.locator(".skeleton")).toHaveCount(0);
    // Our own code must still never throw.
    expect(pageErrors).toEqual([]);
  });
});

/**
 * The seam that breaks silently: the analytics repo publishes summary.json in
 * its own shape, scripts/adapt-analytics.mjs reshapes it, and js/insights.js
 * consumes the result. A synthetic fixture in the renderer's own shape would
 * only prove the fixture matches the renderer. This runs the real adapter
 * script over a summary.json shaped exactly like the analytics repo's actual
 * output (see portfolio-analytics/pipeline/render/build-summary.ts) and
 * renders whatever the adapter produces.
 */
test.describe("collector-to-dashboard contract", () => {
  test("the real adapter output renders", async ({ page }, testInfo) => {
    const { execFileSync } = await import("node:child_process");
    const { writeFileSync, readFileSync, mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");

    const dir = mkdtempSync(join(tmpdir(), "analytics-contract-"));
    const day = (n: number) =>
      new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

    const sessionsSeries: Array<{ day: string; value: number }> = [];
    for (let i = 27; i >= 0; i--) sessionsSeries.push({ day: day(i), value: 3 + (i % 4) });
    const sessions28d = sessionsSeries.reduce((a, b) => a + b.value, 0);

    // Shaped exactly like portfolio-analytics/site/summary.json, including a
    // suppressed cell (value forced to 0, per the k-anonymity gate), to prove
    // the adapter never surfaces a suppressed number.
    const summary = {
      generatedAt: new Date().toISOString(),
      today: day(0),
      threshold: 5,
      hasData: true,
      contact: { pdfDownloads28d: 5, sessions28d, conversionPct: 4.9 },
      traffic: {
        sessions7d: sessionsSeries.slice(-7).reduce((a, b) => a + b.value, 0),
        sessions28d,
        pageviews28d: sessions28d + 20,
        sessionsSeries,
      },
      breakdowns: {
        source: [
          { dim: "linkedin", value: 52, suppressed: false },
          { dim: "direct", value: 0, suppressed: true },
          { dim: "github", value: 12, suppressed: false },
        ],
        device: [
          { dim: "desktop", value: 80, suppressed: false },
          { dim: "mobile", value: 23, suppressed: false },
        ],
        country: [{ dim: "CA", value: sessions28d, suppressed: false }],
        sectionReach: [
          { dim: "0", value: sessions28d, suppressed: false },
          { dim: "1", value: 61, suppressed: false },
          { dim: "2", value: 40, suppressed: false },
          { dim: "3", value: 20, suppressed: false },
          { dim: "4", value: 15, suppressed: false },
          { dim: "5", value: 8, suppressed: false },
        ],
      },
      repo: {},
    };

    const summaryPath = join(dir, "summary.json");
    const outPath = join(dir, "analytics.json");
    writeFileSync(summaryPath, JSON.stringify(summary));

    execFileSync(
      process.execPath,
      [
        join(testInfo.project.testDir, "..", "scripts", "adapt-analytics.mjs"),
        summaryPath,
        outPath,
      ],
      { stdio: "pipe" }
    );

    const built = JSON.parse(readFileSync(outPath, "utf8"));
    // The suppressed source must never appear, not even at value 0.
    expect(built.sources.some((s: { key: string }) => s.key === "direct")).toBe(false);

    await serveAnalytics(page, built);
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator("#insights")).toBeVisible();
    await expect(page.locator("#insights .kpi")).toHaveCount(5);
    await expect(page.locator("#insights .funnel-step")).toHaveCount(6);
    await expect(page.locator("#insights .source-cell")).toHaveCount(2);
    await expect(page.locator("#insights .chart-line-mean").first()).toBeAttached();
  });
});

test.describe("insights dashboard", () => {
  // No 404 case here, matching the precedent in content.spec.ts: a 404 emits a
  // resource console error, which the shared fixture treats as a failure.
  // Malformed JSON exercises the identical catch path without the noise.
  test("stays hidden on malformed data rather than rendering a broken chart", async ({ page }) => {
    await serveAnalytics(page, "not json at all");
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator("#insights")).toBeHidden();
    await expect(page.locator('[data-dot-for="insights"]')).toBeHidden();
  });

  test("stays hidden when the shape is wrong", async ({ page }) => {
    await serveAnalytics(page, { generatedAt: new Date().toISOString(), series: { days: [1, 2] } });
    await page.goto("./");
    await waitForHydration(page);
    await expect(page.locator("#insights")).toBeHidden();
  });

  test("stays hidden for the shipped seed file", async ({ page }) => {
    // The committed data/analytics.json has generatedAt null on purpose.
    await page.goto("./");
    await waitForHydration(page);
    await expect(page.locator("#insights")).toBeHidden();
  });

  test("renders charts, KPIs and the funnel on valid data", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture());
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator("#insights")).toBeVisible();
    await expect(page.locator("#insights .kpi")).toHaveCount(5);
    await expect(page.locator("#insights .chart-line-mean").first()).toBeAttached();
    await expect(page.locator("#insights .funnel-step")).toHaveCount(3);
    await expect(page.locator("#insights .source-cell")).toHaveCount(2);
  });

  test("joins the dot rail and keyboard navigation once revealed", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture());
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator('[data-dot-for="insights"]')).toBeVisible();
    await page.locator('.dot[data-section="insights"]').click();
    await expect(page.locator("#insights")).toBeInViewport();
  });

  test("withholds rates below the sample threshold but still shows counts", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture({ sampleMet: false }));
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator("#insights")).toBeVisible();
    await expect(page.locator("#insights .insights-gate")).toContainText("Not enough data yet");
    await expect(page.locator("#insights .funnel-step")).toHaveCount(0);
    // Counts are facts and still render; only the estimates are withheld.
    await expect(page.locator("#insights .kpi-value").first()).toContainText("41");
    await expect(page.locator("#insights .kpi-value").nth(3)).toHaveText("--");
  });

  test("marks data older than 48 hours as stale", async ({ page }) => {
    const old = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
    await serveAnalytics(page, analyticsFixture({ generatedAt: old }));
    await page.goto("./");
    await waitForHydration(page);

    await expect(page.locator("#insights")).toHaveClass(/is-stale/);
  });

  test("discloses the ad-blocker undercount and the retention window", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture());
    await page.goto("./");
    await waitForHydration(page);

    const note = page.locator("#insights-note");
    await expect(note).toContainText("ad blocker");
    await expect(note).toContainText("No cookies, no IP addresses");
    await expect(note).toContainText("24 hours");
  });

  test("ships an accessible table alongside every chart", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture());
    await page.goto("./");
    await waitForHydration(page);

    // SVG is invisible to a screen reader, so the numbers exist as real tables.
    await expect(page.locator("#insights table.visually-hidden")).toHaveCount(3);
    await expect(page.locator("#insights table caption").first()).not.toBeEmpty();
  });

  test("never emits a hardcoded color - charts inherit the theme", async ({ page }) => {
    await serveAnalytics(page, analyticsFixture());
    await page.goto("./");
    await waitForHydration(page);

    const strokeFor = () =>
      page
        .locator("#insights .chart-line-mean")
        .first()
        .evaluate((node) => getComputedStyle(node).stroke);

    const light = await strokeFor();
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const dark = await strokeFor();

    // Same element, no redraw, different resolved color: proof the chart reads
    // var(--accent) live rather than baking a value at draw time.
    expect(light).not.toBe(dark);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe scan passes with the dashboard rendered in ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => {
        try {
          localStorage.setItem("theme", value);
        } catch {}
      }, theme);
      await serveAnalytics(page, analyticsFixture());
      await page.goto("./");
      await waitForHydration(page);
      await expect(page.locator("#insights")).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? "")
      );
      expect(
        serious.map((violation) => `${violation.id}: ${violation.help}`),
        `axe violations with #insights in ${theme}`
      ).toEqual([]);
    });
  }
});
