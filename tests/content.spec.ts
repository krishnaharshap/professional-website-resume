import { test, expect, waitForHydration } from "./fixtures";

test.describe("content", () => {
  test("hero is complete before hydration (15-second recruiter path)", async ({ page }) => {
    // Delay the data fetch so the assertion window is pre-hydration.
    await page.route("**/data/resume-data.json*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto("./");

    await expect(page.locator("h1")).toHaveText("Krishna Harsha Puppala");
    await expect(page.locator(".hero .eyebrow")).toContainText("QA ENGINEER / SDET");
    await expect(page.locator(".value-prop")).toContainText("Walnut Insurance");
    await expect(page.locator(".value-prop")).toContainText("risk");
    await expect(page.locator(".hero-links a[href^='mailto:']")).toBeVisible();
    await expect(page.locator(".trace-panel")).toContainText("this page tests itself");
  });

  test("all sections hydrate from resume-data.json", async ({ page }) => {
    await page.goto("./");
    await waitForHydration(page);

    // Skills: Selenium and regulated groups lead
    const skills = page.locator("#skills-body");
    await expect(skills).toContainText("Selenium WebDriver");
    await expect(skills).toContainText("Playwright");
    await expect(skills).toContainText("Java");
    await expect(skills).toContainText("FDA Design Controls");
    await expect(skills).toContainText("AI-assisted test case generation");

    // Experience: Walnut current with internship label, metric-first entries
    const experience = page.locator("#experience-body");
    await expect(experience).toContainText("QA Engineer (Internship)");
    await expect(experience).toContainText("Walnut Insurance");
    await expect(experience).toContainText("June 2026 - Present");
    await expect(experience).toContainText("Sovereign General Insurance Company");
    await expect(experience.locator(".exp-metric").first()).toBeAttached();

    // Gap entry sits inline in the timeline; AppLabb belongs to software QA
    await expect(experience).toContainText("CCIS IT Bridging Program and SAIT");
    await expect(experience).toContainText("The AppLabb");

    // Regulated manufacturing QE experience
    const early = page.locator("#experience-early-body");
    await expect(early).toContainText("Fraank Systems");
    await expect(early).toContainText("Vastek Group");
    await expect(early).toContainText("Zimmer Biomet");
    await expect(early).not.toContainText("The AppLabb");

    // Projects: real repo URLs, one card per project
    const projects = page.locator("#projects-body .project-card");
    await expect(projects).toHaveCount(4);
    await expect(
      page.locator("#projects-body a[href='https://github.com/krishnaharshap/selenium-cucumber-framework']")
    ).toBeAttached();
    await expect(page.locator("#case-study .case-row")).toHaveCount(5);

    // Credentials + contact
    await expect(page.locator("#education-body")).toContainText("Materials Science");
    await expect(page.locator("#education-body")).toContainText("Metallurgical & Materials Engineering");
    await expect(page.locator("#certifications-body")).toContainText("ISTQB");
    await expect(page.locator("#contact-body")).toContainText("(587) 409-6060");
    await expect(page.locator("#last-updated")).toContainText("content v");
  });

  test("banned characters never render (anti AI-slop gate)", async ({ page }) => {
    await page.goto("./");
    await waitForHydration(page);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toContain("—"); // em dash
    expect(text).not.toMatch(/[✅✓✔]/); // checkmarks
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u); // emoji blocks
  });

  test("hydration failure degrades to fallback, contact survives", async ({ page }) => {
    // Malformed JSON exercises the same catch path as a 404 without
    // generating a resource console error.
    await page.route("**/data/resume-data.json*", (route) =>
      route.fulfill({ contentType: "application/json", body: "not json" })
    );
    await page.goto("./");

    await expect(page.locator("#data-error")).toBeVisible();
    await expect(page.locator(".skeleton")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText("Krishna Harsha Puppala");
    await expect(page.locator("#contact-body a[href^='mailto:']")).toBeAttached();
    // Section count stays stable: dots and hashes must not renumber.
    await expect(page.locator("main .slide")).toHaveCount(6);
  });
});
