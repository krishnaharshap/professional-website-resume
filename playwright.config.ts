import { defineConfig, devices } from "@playwright/test";

// BASE_URL lets CI point the same suite at the live GitHub Pages URL
// (which lives under a /professional-website-resume/ subpath), so specs
// navigate with page.goto("./") and baseURL always ends with "/".
const rawBaseUrl = process.env.BASE_URL || "http://localhost:4173";
const baseURL = rawBaseUrl.endsWith("/") ? rawBaseUrl : rawBaseUrl + "/";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Local Windows machines crash the headless shell above ~2 parallel
  // browsers; CI (ubuntu) takes the default worker count.
  workers: process.env.CI ? undefined : 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // links.spec (@links) is scheduled/manual only: external hosts rate-limit
  // and rot on their own clock, so it must never gate a push.
  grep: process.env.RUN_LINKS ? /@links/ : undefined,
  grepInvert: process.env.RUN_LINKS ? undefined : /@links/,
  use: {
    baseURL,
    // Deterministic navigation: reduced motion makes scrolls instant and
    // disables entrance animation, so specs assert positions, not physics.
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run serve",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
