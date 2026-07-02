<!-- /autoplan restore point: ~/.gstack/projects/professional-website-resume/main-autoplan-restore-20260701-175152.md -->
# PLAN: Interactive Resume Portfolio v2 — professional-website-resume

Rebuild of https://krishnaharshap.github.io/professional-website-resume/ as an
interactive, slide-based resume site for QA/SDET positioning. Static site,
GitHub Pages, no build step. User (Krishna) reviews and pushes; agent only
stages local commits.

## Premises (confirmed at gate, 2026-07-01)

- P1: Content strategy is MERGE: the Pason docx supplies the newest experience
  (Walnut Insurance) and refined bullets, but the portfolio keeps the broader,
  universal skill framing already on the site (not per-JD tailored). Selenium
  and Java background must be prominently covered. Business value (metrics,
  savings, reliability) stated everywhere. Phone is the office number
  (587) 409-6060 for privacy; personal number never appears. Education stays
  as currently published on the site. Walnut is shown as "QA Engineer,
  Walnut Insurance, June 2026 - Present" (no internship label).
- P2: The positioning niche is "risk-based testing mindset" grounded in
  regulated manufacturing QE experience (medical device V&V at Fraank/Vastek).
  The summary and skills framing lead with this.
- P3: Stack stays vanilla HTML/CSS/JS with a JSON data file. No framework, no
  build step. GitHub Pages serves it directly. This matches the existing repo
  and keeps content updates a one-file edit.
- P4: Navigation model is a horizontal deck of full-viewport sections:
  keyboard arrows (front/back), touchpad horizontal swipe, touch swipe,
  browser back/forward via URL hash sync, plus visible prev/next controls and
  section dots.
- P5: Visual language: purple/rich color theme, large readable type, generous
  whitespace, subtle motion only. Hard bans: emoji, checkmark glyphs, stock
  icons/images/gifs, em dashes, over-polished AI-slop patterns.
- P6: The site itself demonstrates QA credibility: tested (Playwright smoke
  suite + GitHub Actions CI), accessible, cross-browser, responsive.

## Section split (deck order — 6 slides, confirmed at gate)

1. Hero + Risk-Based Mindset: name, "QA Engineer | SDET", value prop anchored
   on risk-based testing from regulated manufacturing QE, contact links,
   short mindset narrative (FDA design controls, traceability, CAPA applied
   to SaaS QE).
2. Skills: grid grouped by category (Automation incl. Selenium and
   Playwright, Languages incl. Java and Python, Frameworks & Patterns,
   Test Types, CI/CD & Tooling, Regulated & Compliance, AI-assisted testing).
3. Experience A: Walnut Insurance (current) + Sovereign General Insurance
   (SGIC), scrolls vertically inside the slide if needed.
4. Experience B: The AppLabb + regulated QE (Fraank Systems, Vastek).
5. Projects: 3-4 cards with repo links; live Allure report link from
   selenium-cucumber-framework CI.
6. Education + Certifications + Contact (email, LinkedIn, GitHub,
   view-source link to this repo).

## Architecture

- index.html: semantic sections, one `<section>` per deck slide, ARIA roles.
- css/styles.css: custom properties for theme tokens; light/dark via
  prefers-color-scheme + manual toggle; clamp()-based fluid type;
  prefers-reduced-motion respected.
- js/data.js: fetch + validate resume-data.json, render into templates.
- js/nav.js: deck navigation. Keyboard (ArrowLeft/Right, PageUp/Down,
  Home/End), wheel events with deltaX for touchpad swipe (debounced/
  threshold), pointer events for touch swipe, hash sync (#section-id) so
  browser back/forward and deep links work, focus management per slide.
- data/resume-data.json: extended schema (positioning block, experience with
  highlight metrics, projects, certs).
- tests/: Playwright smoke tests (deck navigation, content render, a11y
  checks, responsive viewports). .github/workflows/ci.yml runs them on push.
- assets/: resume PDF for download.

## Content refinement

Bullet points from the Pason docx get broadened for web (skills/tools
coverage rather than per-JD tailoring), per the user's instruction. Metrics
kept: 1,000+ test cases, 30% pre-release defect detection lift, 99%
integration reliability, 80% pre-UAT defect detection, zero Sev-1 releases.

## Extras (confirmed at gate)

- IN: Playwright smoke suite + GitHub Actions CI.
- IN: Dark/light theme toggle (system default + manual override).
- IN: Hidden find-the-bug easter egg with a "how I would test for it" note.
- OUT: PDF resume download (declined at gate — privacy; no personal phone
  artifacts published).

## NOT in scope (initial)

- Next.js/React rebuild (rejected: build step, overkill for a resume deck).
- Bruno Simon-style 3D (rejected: spectacle over clarity for QA recruiters).
- Live GitHub Actions API status widget (deferred: rate limits/unauth calls;
  static badge acceptable).
- Per-JD tailored resume variants on the site (deferred).
- PDF download button (declined at premise gate).

## Verification

- Playwright smoke suite green locally and in CI.
- Manual matrix: Chrome, Edge, Firefox (local); mobile viewport via devtools.
- Lighthouse pass: a11y >= 95, performance >= 90.
- Content diff against Pason docx: every docx section represented.

---

# PHASE 1: CEO REVIEW (via /autoplan, mode: SELECTIVE EXPANSION)

## Step 0A: Premise Challenge

Premises P1-P6 were confirmed by the user at the premise gate (2026-07-01).
Remaining challenges evaluated:

1. Right problem? The stated outcome is interviews, not a website. The site is
   one channel. This plan wins only if it converts a recruiter's 30-60 second
   skim into "this person tests things properly." Verdict: the plan's tested-
   site-as-proof angle (Playwright + CI + easter egg) is the direct path to
   that outcome, not just decoration. Premise holds.
2. Deck vs scroll risk: recruiters skim; a horizontal deck can hide content
   behind interactions they will not perform. Mitigations required (carried
   into Section 11): hash deep links, visible prev/next and dots, mobile
   falls back to vertical scroll-snap, and a print stylesheet that lays all
   slides out linearly. Flagged for the dual voices; if both models push
   scroll-first, that is a USER CHALLENGE (user explicitly chose the deck).
3. Do nothing? Live site is stale: missing Walnut, "Senior QA Analyst" title
   framing, four-page book with hardcoded page count and no keyboard/touch
   support. Real pain, not hypothetical.

## Step 0B: Existing Code Leverage

| Sub-problem | Existing code | Reuse? |
|---|---|---|
| Data-driven content | data/resume-data.json + js/script.js renderers | Keep pattern, extend schema, rewrite renderers with HTML escaping |
| Paged navigation | script.js translateX book (totalPages=4 hardcoded, 25% magic number, buttons only) | Concept reused; implementation replaced (derive count from DOM) |
| Theme | css/styles.css | Replaced by token-based system with dark/light |
| Live test report | selenium-cucumber-framework Allure page on GitHub Pages | Linked from Projects slide |
| Discoverability | krishnaharshap.github.io landing page already links this repo URL | Keep repo name and URL stable |

Nothing is rebuilt that could be refactored cheaper: the nav rewrite is
justified because the current one cannot express keyboard/swipe/hash behavior
without replacing its core transform math anyway.

## Step 0C: Dream State

```
CURRENT STATE                  THIS PLAN                       12-MONTH IDEAL
Static 4-page book,     --->   6-slide interactive deck,  ---> Portfolio hub: live CI
stale content, no              merged content w/ Walnut,       dashboards, AI-assisted
tests, no keyboard/            keyboard+swipe+hash nav,        testing demos, per-JD
touch, hardcoded nav           purple theme, dark/light,       resume variants,
                               Playwright+CI, easter egg       downloadable artifacts
```
Delta: the plan lands ~80% of the 12-month ideal's foundation; remaining 20%
(live dashboards, variants) builds on the same JSON schema and CI pipeline.

## Step 0C-bis: Implementation Alternatives

```
APPROACH A: Incremental patch of existing book
  Summary: Keep current index/script, add keyboard+wheel handlers and Walnut.
  Effort: S   Risk: Low   Completeness: 5/10
  Pros: smallest diff; no visual regression risk
  Cons: inherits hardcoded page math; cannot express 6-slide layout, theming,
        or per-slide scroll without rewriting anyway
  Reuses: everything

APPROACH B: Full rebuild, vanilla HTML/CSS/JS + JSON data (RECOMMENDED)
  Summary: New semantic slide DOM, token CSS, modular JS (data/nav/theme),
           extended JSON schema, Playwright tests + CI.
  Effort: M (human ~3 days / CC ~1.5 h)   Risk: Low-Med   Completeness: 9/10
  Pros: expresses all confirmed premises; no build step; testable; keeps
        data-driven update flow
  Cons: full visual replacement needs the test suite to catch regressions
  Reuses: JSON data pattern, repo URL, Allure live page

APPROACH C: Next.js/React rebuild
  Summary: Component framework + static export to Pages.
  Effort: L   Risk: Med   Completeness: 9/10
  Pros: componentization; ecosystem
  Cons: build step on a resume site; violates confirmed premise P3;
        heavier maintenance for a single-page artifact
  Reuses: content only
```
AUTO-DECIDED: Approach B. P1 (completeness 9 vs 5), P5 (explicit vanilla over
framework cleverness), and premise P3 was already user-confirmed. Not a taste
decision: A loses on capability, C was excluded by a confirmed premise.

## Step 0D: Selective Expansion Analysis

Complexity check: ~10 files touched (index, css, 3 js, json, 2-3 test files,
workflow, README). Acceptable for a rebuild; no parallel structures created.
Minimum set achieving the goal: index.html + css + js + json (tests/CI are
user-confirmed scope, not padding).

Expansion candidates (auto-decided per P2 blast-radius rule):
| # | Candidate | Effort | Decision | Why |
|---|---|---|---|---|
| E1 | SEO/OG meta + JSON-LD Person schema | S | ACCEPTED | index.html only; recruiters share links; free discoverability |
| E2 | Print stylesheet (linear all-slides layout) | S | ACCEPTED | css only; recruiters print; also the privacy-safe stand-in for the declined PDF button |
| E3 | Section dots + labeled progress indicator | S | ACCEPTED | nav.js; deck orientation cue; mitigates premise-2 risk |
| E4 | Custom 404 page with testing-mindset note | S | ACCEPTED | 1 file; pairs with easter egg persona |
| E5 | CI broken-link check (excluding the deliberate easter-egg bug, documented) | S | ACCEPTED | test file only; strong QA signal; exclusion note is itself a talking point |
| E6 | Lighthouse CI job | S-M | TASTE DECISION | external action dependency; value real but adds CI surface |
| E7 | Privacy-friendly analytics | M | DEFERRED to TODOS | external service, privacy trade-off user should weigh |
| E8 | French/bilingual version | L | DEFERRED to TODOS | outside blast radius |
| E9 | Live GitHub Actions status badge/widget | M | DEFERRED to TODOS | unauth API rate limits; broken badge looks worse than none |
| E10 | Copy-email affordance | S | SKIPPED | clutter vs AI-slop ban; mailto suffices |

## Step 0E: Temporal Interrogation

```
HOUR 1 (foundations): Purple token palette + Inter font locked in plan (below).
  Slide DOM: <main> > <section class="slide" id="...">, count derived from DOM.
HOUR 2-3 (core logic): Touchpad wheel handling is the hard part. Decisions NOW:
  only treat events where |deltaX| > |deltaY| as slide intent; accumulate
  delta against a threshold (~80px); 450ms lockout after a transition to
  swallow macOS momentum tails; ignore all wheel input mid-animation.
HOUR 4-5 (integration): Slides 3-4 scroll vertically inside; wheel deltaY
  scrolls content, deltaX changes slides; touch swipe uses angle detection
  (>30deg from horizontal = scroll, else swipe). Hash sync must not fight
  scroll restoration: use history.replaceState for nav-driven changes,
  hashchange listener for user/back-button-driven changes.
HOUR 6+ (polish/tests): Playwright needs a local static server (npx serve or
  python -m http.server) — wire into playwright.config webServer. Easter egg
  must be excluded from link-check spec via documented allowlist.
```
Human ~3 days compresses to CC ~1.5-2 h.

## Step 0F: Mode

SELECTIVE EXPANSION (autoplan override), Approach B. Committed.

## Sections 1-11 (CEO deep review)

### Section 1: Architecture
```
index.html (static shell: hero content inline, OG/meta, slide sections)
   |-- css/styles.css (design tokens, themes, print stylesheet, motion)
   |-- js/data.js  --fetch--> data/resume-data.json --render--> slide DOM
   |-- js/nav.js   (keyboard / wheel / pointer / hash / dots / buttons)
   |-- js/theme.js (system pref + toggle + localStorage)
tests/*.spec.ts --Playwright--> local static server --CI--> GitHub Actions
```
Data flow (fetch resume-data.json): happy = render slides; nil (404) = keep
inline hero content + visible error note + contact links still work; empty/
malformed JSON = same fallback (JSON.parse caught); upstream = GitHub Pages
CDN, no auth. FINDING A1 (auto-accepted): hero name/title/summary and contact
must be static HTML, not fetched — fixes no-JS, link unfurls, and SEO in one
move. Only below-the-fold slides hydrate from JSON.
State machine (nav): idle -> animating -> idle; guards: input ignored while
animating; invalid hash -> slide 0; first/last slide clamp. Coupling: nav
derives slide count from DOM (kills the totalPages=4 hardcode bug class).
SPOF: Google Fonts (font-display: swap + system fallback). Scaling: N/A
(static). Rollback: git revert; Pages redeploys in ~1 min.

### Section 2: Error & Rescue Map
```
CODEPATH             | WHAT CAN GO WRONG          | HANDLING            | USER SEES
---------------------|----------------------------|---------------------|-----------
data.js fetch        | 404 / network fail         | catch, fallback UI  | inline hero + "content failed to load" note + working contact links
data.js JSON.parse   | malformed JSON             | catch, same         | same
render(data)         | missing/extra fields       | per-field defaults  | section omitted, no crash
theme.js localStorage| private mode throws        | try/catch, memory   | toggle works, not persisted
nav.js hash          | junk hash (#xyz)           | validate, slide 0   | hero slide
Google Fonts         | blocked network            | font-display swap   | system font
wheel handler        | momentum event floods      | threshold + lockout | one slide per gesture
```
GAPS: none unrescued; every failure path has a user-visible or silent-safe
outcome, and the fetch-fail path is Playwright-tested (route abort).

### Section 3: Security & Threat Model
Static site, no backend, no secrets, no user input. Findings:
- S3.1 (auto-accepted): current script.js injects JSON via innerHTML template
  strings. Content is repo-controlled (low likelihood) but escaping is free:
  render via textContent/createElement or an escapeHtml helper. Med impact,
  low likelihood, mitigated.
- S3.2 (auto-accepted): all target="_blank" links get rel="noopener".
- S3.3 (auto-accepted): pin GitHub Actions to major versions; workflow gets
  contents:read permissions only.
- Data classification: deliberately public resume data; office phone only
  (user-confirmed); personal phone never in repo history of new files.

### Section 4: Data Flow & Interaction Edge Cases
```
INTERACTION       | EDGE CASE                        | HANDLED?
------------------|----------------------------------|---------------------------
Slide navigation  | key spam during animation        | Y lockout
                  | wheel momentum tail (macOS)      | Y threshold+450ms lockout
                  | horizontal wheel = browser back  | RISK: see W1 below
                  | junk/legacy hash deep link       | Y validate -> slide 0
                  | browser back/forward             | Y hashchange listener
                  | resize / orientation change      | Y recompute, snap to current
                  | 320px width                      | Y vertical scroll-snap mode
Vertical-in-slide | deltaY scrolls content, deltaX   | Y axis-dominance check
scroll (slides    | swipes; diagonal touch gesture   | Y >30deg angle = scroll
3-4)              |                                  |
Theme toggle      | double click / system change     | Y idempotent, listener
No JS             | fetch never runs                 | Y inline hero + noscript note
Print             | deck hides 5 of 6 slides         | Y print CSS linearizes all
```
W1 (WARNING, carried to gate): intercepting wheel deltaX conflicts with the
macOS two-finger back/forward gesture. Mitigation chosen: preventDefault only
when the deck can actually advance in that direction AND the event target is
not inside a horizontally-scrollable element; never preventDefault on the
first/last slide edge in the exit direction. Keyboard, buttons, dots, touch
remain primary. Residual risk stays visible at the final gate because the
user explicitly requested touchpad swipe.

### Section 5: Code Quality
- DRY: one render helper per section type; escapeHtml shared; no duplicated
  nav math (single goTo(index) entry point).
- Naming: goTo, slideCount, activeIndex — behavior names, not mechanism.
- Over-engineering check: no classes/frameworks; three small modules is the
  floor, not abstraction for its own sake.
- Under-engineering check: the current site's hardcoded 25% translate and
  totalPages=4 is the anti-pattern this rebuild removes; derive everything
  from DOM.
- Complexity: wheel handler is the only branch-heavy function; cap at one
  exported function with named guard helpers.

### Section 6: Test Review (diagram -> coverage)
```
NEW UX FLOWS                         TEST (Playwright E2E)
arrow-key navigation                 nav.spec: ArrowRight/Left/Home/End
button + dot navigation              nav.spec: click each, aria-current
touch swipe                          nav.spec: touchscreen swipe emulation
wheel swipe                          nav.spec: dispatch wheel deltaX burst
hash deep link + back button         nav.spec: goto #projects, go back
theme toggle + persistence           theme.spec: toggle, reload, assert
content render (Walnut present,      content.spec: JSON fields vs DOM,
 SGIC metrics, no em dashes)          incl. banned-character scan
fetch failure fallback               content.spec: route abort -> fallback
responsive (375/768/1280)            responsive.spec: snap mode on mobile
links valid (except easter egg,      links.spec: HEAD each href, documented
 allowlisted with comment)            allowlist for the deliberate bug
a11y basics                          a11y.spec: roles, labels, focus, contrast
no console errors                    global fixture assertion
```
2am-Friday test: content.spec fetch-abort + nav clamp tests. Hostile-QA test:
links.spec + banned-character scan (catches AI-slop regressions). Chaos test:
wheel event flood spec. Pyramid: E2E-heavy by nature of a static site —
acknowledged inversion, justified (no units of logic beyond guards; guards
get targeted specs). Flakiness: wheel/momentum specs use synthetic events
(deterministic); no time/random/external deps except links.spec (network) —
run links.spec on a schedule + PR label, not every push, to avoid flaky reds.

### Section 7: Performance
No build, no images, two font weights max, CSS+JS under ~30KB total. Use
transform: translate3d for slide movement (compositor-only), will-change on
the track, no layout reads in handlers (cache measurements on resize).
Preconnect to fonts.gstatic.com. Lighthouse perf >= 90 is realistic.

### Section 8: Observability
CI runs on every push = the observability plane. Console-error assertion in
every spec. links.spec scheduled weekly catches rot (dead repo links, moved
Allure page). 404.html catches bad deep links with a friendly note. Analytics
deferred (E7) — without it there is no visitor signal; deliberate, revisit at
gate. Debuggability: static site + git history is fully reconstructable.

### Section 9: Deployment & Rollout
GitHub Pages serves main directly (no build step = no deploy pipeline to
break). Rollout: user reviews locally (python -m http.server or npx serve),
then pushes. Rollback: git revert, push. Deploy risk window: none (atomic
file swap on Pages CDN). Post-deploy check: CI smoke run against the live
URL (workflow_dispatch job with BASE_URL=live) — included in workflow.
Old-URL compatibility: legacy #page1-4 hashes from any shared links map to
nearest new slide.

### Section 10: Long-Term Trajectory
Debt introduced: none structural; the JSON schema extension is additive.
Reversibility: 4/5 (restore point captured; git revert works). Docs: README
rewrite documents architecture + "how to update your resume in one file" +
how to run tests — the 3-month-later Krishna is the maintainer persona.
Path dependency: JSON schema + CI pipeline directly support the 12-month
ideal (per-JD variants, live dashboards). 1-year read: obvious.

### Section 11: Design & UX (CEO-level)
Information hierarchy (slide 1): name -> title -> risk-based value prop ->
contact. The recruiter's 15-second retention target: "regulated-QE roots,
Selenium/Java + Playwright, Calgary, currently at Walnut."
```
STATE COVERAGE     LOADING          EMPTY           ERROR            SUCCESS
content hydrate    inline hero      section omitted fallback note    slides
theme              system pref      n/a             memory-only      persisted
nav                slide 0          n/a             hash->0          hash sync
```
User journey arc: hook (who + why different) -> proof (skills) -> depth
(experience) -> artifacts (projects + live report + tested-site strip) ->
credentials -> CTA. Mobile: vertical scroll-snap, deck gestures off — scroll
is the native skim gesture. AI-slop bans enforced by test (banned-character
scan). Accessibility: slides are sections with aria-labels, off-screen slides
inert (visibility + tabindex management), aria-current on dots, live region
announces slide changes, prefers-reduced-motion drops transitions to opacity.
Recommendation absorbed: visible "How this site is tested" strip (CI badge
image + links to workflow, spec files, Allure report) on the Projects slide —
makes P6 audience-visible instead of repo trivia.

## Failure Modes Registry (CEO)

```
CODEPATH        | FAILURE MODE           | RESCUED? | TEST? | USER SEES?        | LOGGED?
----------------|------------------------|----------|-------|-------------------|--------
data.js fetch   | 404/network fail       | Y        | Y     | fallback note     | console
data.js parse   | malformed JSON         | Y        | Y     | fallback note     | console
render          | missing fields         | Y        | Y     | section omitted   | console.warn
nav hash        | invalid hash           | Y        | Y     | hero slide        | n/a
nav wheel       | momentum flood         | Y        | Y     | single transition | n/a
nav wheel       | macOS back-gesture     | PARTIAL  | Y     | edge passthrough  | n/a (W1, gate)
theme storage   | localStorage throws    | Y        | Y     | session-only theme| n/a
fonts           | CDN blocked            | Y        | N     | system font       | n/a
links           | external link rot      | Y (CI)   | Y     | weekly CI red     | CI
```
No CRITICAL GAP rows (no silent+untested+unrescued combination). W1 is the
only PARTIAL and is surfaced at the final gate.

## What already exists (summary)
See Step 0B table. Reused: JSON data pattern, repo URL, Allure live page.
Replaced: nav implementation, CSS, renderers (with escaping).

## Dream state delta
See Step 0C. This plan lands the foundation (schema + CI + tested deck);
deferred lakes: analytics, variants, live dashboards.

## CEO Implementation Tasks
- [ ] **T1 (P1, human: ~4h / CC: ~20min)** — content — Rebuild resume-data.json: merge docx + site (broader universal framing), add Walnut (QA Engineer, June 2026 - Present), office phone, inline SAIT gap entry, qualified metrics, real per-project repo URLs, LinkedIn URL
  - Surfaced by: Premise gate + outside-voice findings 6, 7, 10, 12
  - Files: data/resume-data.json
  - Verify: content.spec assertions
- [ ] **T2 (P1, human: ~1d / CC: ~30min)** — markup/style — New index.html (static hero, OG/meta/JSON-LD, 6 slide sections) + token CSS (purple light/dark, fluid type, print stylesheet, reduced motion)
  - Surfaced by: Sections 1, 11, E1, E2
  - Files: index.html, css/styles.css, 404.html
  - Verify: responsive.spec, a11y.spec, print preview
- [ ] **T3 (P1, human: ~1d / CC: ~30min)** — behavior — js/data.js (fetch+escape+render, fallback), js/nav.js (keys, wheel w/ W1 guards, touch, hash, dots), js/theme.js
  - Surfaced by: Sections 1, 2, 4, 5
  - Files: js/data.js, js/nav.js, js/theme.js
  - Verify: nav.spec, theme.spec, content.spec
- [ ] **T4 (P1, human: ~4h / CC: ~20min)** — tests/CI — Playwright suite (nav, content, theme, responsive, a11y, links w/ easter-egg allowlist, console-error fixture) + GitHub Actions workflow
  - Surfaced by: Section 6, E5
  - Files: tests/*.spec.ts, playwright.config.ts, package.json, .github/workflows/ci.yml
  - Verify: npx playwright test green locally and in CI
- [ ] **T5 (P2, human: ~1h / CC: ~10min)** — content — "How this site is tested" strip + easter egg + hidden note + README rewrite
  - Surfaced by: Section 11, outside-voice findings 9, 11
  - Files: index.html, README.md
  - Verify: links.spec allowlist documented

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Approach B (vanilla rebuild) | Mechanical | P1,P5 | completeness 9 vs 5; premise P3 user-confirmed | A, C |
| 2 | CEO | E1 static hero + OG/JSON-LD accepted | Mechanical | P1,P2 | in blast radius, fixes no-JS/unfurl/SEO | - |
| 3 | CEO | E2 print stylesheet accepted | Mechanical | P2 | css-only; recruiters print; PDF declined at gate | - |
| 4 | CEO | E3 labeled dots accepted | Mechanical | P2 | deck orientation | - |
| 5 | CEO | E4 404 page accepted | Mechanical | P2 | 1 file | - |
| 6 | CEO | E5 link-check CI accepted | Mechanical | P1 | QA signal; allowlists deliberate bug | - |
| 7 | CEO | E6 Lighthouse CI | TASTE (gate) | P3 vs P1 | external action dependency vs free a11y/perf regression net | - |
| 8 | CEO | E7 analytics deferred | TASTE (gate) | P3 | privacy trade-off is the user's call; outside voice pushed for it | - |
| 9 | CEO | E8 bilingual deferred | Mechanical | P2 | outside blast radius | - |
| 10 | CEO | E9 partial: static badge strip in, live widget deferred | Mechanical | P3,P5 | badge.svg is reliable; API widget is fragile | - |
| 11 | CEO | E10 copy-email skipped | Mechanical | P5 | clutter; mailto suffices | - |
| 12 | CEO | Absorb gap-narrative inline SAIT entry | Mechanical | P1 | closes 7-month gap question where it arises | - |
| 13 | CEO | Hero frames SDET as deliberate lateral | Mechanical | P1 | prevents down-level read of Senior->Engineer | - |
| 14 | CEO | Qualify "millions annually" metric with mechanism | Mechanical | P1 | QA audience distrusts unfalsifiable claims | - |
| 15 | CEO | W1 wheel-swipe hardening (guarded preventDefault) | TASTE (gate) | P1 | user asked for touchpad swipe; macOS gesture conflict is real | removal |
| 16 | CEO | Skip standalone spec-review subagent loop for CEO plan artifact | Mechanical | P3 | dual outside voices already reviewed the same content adversarially this run | - |
| 17 | CEO | E11 visible test-strategy case study block accepted | Mechanical | P1,P2 | both voices: strong SDET portfolios show proof depth, not tool lists; content-only change | - |
| 18 | CEO | UC1 deck vs scroll -> USER CHALLENGE at gate | User Challenge | - | both voices recommend scroll-first; user explicitly chose deck | - |
| 19 | CEO | UC2 PDF download -> USER CHALLENGE at gate | User Challenge | - | both voices: sanitized PDF is what recruiters need; user declined | - |
| 20 | CEO | UC3 easter egg -> USER CHALLENGE at gate | User Challenge | - | both voices: negative EV, invert to visible case study; user chose it | - |
| 21 | CEO | UC4 Walnut title accuracy -> USER CHALLENGE at gate | User Challenge | - | subagent (critical): integrity risk if role is an internship; codex: down-level optics need hero framing | - |
| 22 | CEO | E7 analytics elevated to TASTE at gate | TASTE (gate) | P1 vs privacy | both voices push measurement; privacy is user's call | - |

## CEO DUAL VOICES — CONSENSUS TABLE

```
Dimension                              Claude   Codex    Consensus
------------------------------------- -------- -------- ------------------
1. Premises valid?                     NO (P4)  NO (P4)  CONFIRMED CONCERN -> UC1
2. Right problem to solve?             PARTIAL  PARTIAL  CONFIRMED: funnel > artifact; site is one channel
3. Scope calibration correct?          LEAN IT  LEAN IT  CONFIRMED: gimmicks flagged (easter egg, 404 tone) -> UC3
4. Alternatives sufficiently explored? NO       NO       CONFIRMED GAP: scroll one-pager now has a decision record (UC1)
5. Competitive risks covered?          NO       NO       CONFIRMED GAP -> E11 case study accepted
6. 6-month trajectory sound?           RISK     RISK     CONFIRMED CONCERN: title integrity (UC4), effort allocation
```
Key voice findings absorbed without user conflict: static hero HTML + OG
tags (A1), SAIT gap entry (#12), SDET-lateral hero framing (#13), qualified
metrics (#14), real per-project repo URLs, verified LinkedIn URL, visible
tested-site strip, case study block (E11). Funnel items outside this repo
(LinkedIn rewrite, profile README, pinned repos) -> TODOS.

PHASE 1 COMPLETE. Codex: 17 concerns. Claude subagent: 14 findings.
Consensus: 0/6 clean confirms, 6/6 shared concerns -> 4 user challenges +
2 taste decisions surfaced at the final gate. Premise gate passed
(interview D1-D4). Passing to Phase 2 (Design).

---

# PHASE 2: DESIGN REVIEW (via /autoplan)

## Step 0: Design Scope Assessment

0A Initial rating: 5/10. The plan has structure (6 slides, states table,
a11y intentions, reduced motion) but "purple theme, large type, huge
whitespace" is vibes, not decisions. A 10 names the palette values with
contrast ratios, the type scale, the spacing scale, the transition curve,
the dot component spec, and the focus states.
0B DESIGN.md: none exists — gap noted; using universal principles + the
specification below (which becomes the de facto design system).
0C Existing leverage: current site uses Inter + centered container; the
landing page (krishnaharshap.github.io) is a conventional card portfolio.
Nothing worth carrying except the data-driven render pattern.
0D Focus areas: all 7 passes (autoplan override).

## Design Specification (added by Pass 1/2/4/5/6 fixes)

Classifier: HYBRID — hero/mindset slides follow landing-page rules
(composition-first, brand-forward); skills/experience slides follow app-UI
rules (calm, dense-but-readable, utility language).

Tokens (css custom properties):
```
LIGHT                          DARK
--bg:        #faf9fc           #14101f
--surface:   #ffffff           #1d1730
--text:      #1f1a2e (~15:1)   #ece8f5 (~14:1)
--text-2:    #554d6b (~7:1)    #a89fc0 (~7:1)
--accent:    #6d28d9 (~6.3:1)  #a78bfa (~7:1)
--accent-2:  #4c1d95           #c4b5fd
--border:    #e6e1f2           #322a4a
```
Purple discipline (anti-AI-slop): purple appears only as accent — section
eyebrows, link underlines, active dot, metric highlights, thin rules. NO
purple/blue gradients, NO gradient backgrounds, NO icon-in-circle, NO
uniform bubbly radius (radius: 0 on sections, 4px max on chips), NO
centered-everything (left-aligned editorial layout), no decorative shadows.

Type: IBM Plex Sans (400/600/700) body + display; IBM Plex Mono (400/500)
for eyebrows, metrics, keyboard hints, code-flavored labels. Two families,
one superfamily. Scale: h1 clamp(2.5rem,6vw,4.25rem)/1.05; h2
clamp(1.6rem,3.2vw,2.5rem); body clamp(1rem,1.05vw,1.1875rem)/1.65; mono
labels 0.8125rem uppercase +0.08em tracking. Body text never below 16px.

Space: 8px scale; slide padding clamp(2rem,7vw,6.5rem); max content width
68ch for prose, 1100px for grids. The "huge whitespace" premise lives here.

Motion: slide track transform 480ms cubic-bezier(0.22,1,0.36,1); dot/label
color 160ms; hero content staggers in once on load (120ms steps, translateY
8px + opacity, landing-page rule: 2-3 intentional motions). Reduced motion:
crossfade 150ms opacity only, no stagger.

Navigation chrome: bottom-center dot rail (desktop) — 6 dots, 44px hit
areas, mono label of active section beside rail, prev/next chevrons at
viewport edges (44px targets); mobile: 2px progress bar top + native
vertical scroll-snap sections (deck gestures off). Focus: 2px solid
--accent outline, 3px offset, never removed. Keyboard hint on hero in mono.

## Design additions absorbed from dual voices (Pass fixes, round 2)

- Per-slide hierarchy + fixed headline slot (voices: slides 2-6 had no
  reading order). Every slide: mono eyebrow -> headline (same position and
  scale) -> primary element -> detail. Headline strings locked:
  1 "Krishna Puppala" (eyebrow: QA ENGINEER / SDET - CALGARY)
  2 "Tooling chosen by risk, not fashion"
  3 "Shipping insurance platforms without Sev-1s"
  4 "Trained where defects cost recalls"
  5 "Proof you can run"
  6 "Credentials and contact"
  Experience entries LEAD with their metric (mono, accent); project cards
  LEAD with outcome, then stack, then link.
- Hero visual anchor (both voices: litmus 2 failed). A terminal-styled
  traceability panel in mono: requirement -> risk -> test -> CI signal, one
  real line from the site's own suite (e.g. "RISK: content drift -> SPEC:
  content.spec.ts -> CI: passing"). Communicates testing judgment; no
  images, no gradients. Doubles as the slide-1 proof element so the
  differentiator no longer waits until slide 5.
- Slide-1 mindset line names Fraank/Vastek + FDA V&V explicitly (claim and
  evidence co-located).
- Skills = weighted plain lists per category, NOT card boxes (anti badge
  wall). Automation (Selenium, Playwright) and Regulated groups get first
  position and largest weight per P1.
- Hydration skeleton: slides 2-6 render static skeleton blocks (min-height
  100svh, pulsing rule lines, reduced-motion-safe) from initial HTML; dots
  render from static DOM, never from JSON; zero layout shift on hydrate.
- Sections are NEVER removed on partial data — inner content degrades,
  slide count/dots/hashes/print stay stable.
- Overflow affordance for in-slide scroll (slides 3-4): bottom gradient
  fade + mono "scroll" cue + chevron; disappears at scroll end.
- Short-viewport policy: below 700px height, slides switch to internal
  scroll with the same affordance; responsive.spec adds 1280x620.
- Focus spec: on navigate, focus moves to section[tabindex="-1"]; off-slide
  content inert (inert attr + visibility fallback); live region announces
  "Slide 3 of 6 - Shipping insurance platforms without Sev-1s"; announce
  once, aria-live=polite (no spam).
- Component-state matrix required in CSS: default/hover/focus-visible/
  active/disabled/aria-current for dots, chevrons, links, toggle. Chevrons
  hidden on first/last edge (not disabled-gray).
- Print spec: force light tokens, linear order 1-6, break-inside avoid on
  entries/cards, print URLs after contact links, hide nav chrome/toggle.
- Legacy hash mapping table: #page1->#hero, #page2->#skills,
  #page3->#experience, #page4->#projects (tested).
- Badge fallback: fixed dimensions + alt text; strip does not collapse if
  badge blocked.
- Reduced motion removes slide travel entirely (crossfade), not shortened.

## DESIGN DUAL VOICES — LITMUS SCORECARD

```
Check                              Claude   Codex    Consensus
---------------------------------- -------- -------- -----------------
1. Person unmistakable first screen YES      YES      CONFIRMED PASS
2. One strong visual anchor         NO       NO       CONFIRMED FAIL -> terminal traceability panel added
3. Scannable by headlines only      NO       NO       CONFIRMED FAIL -> fixed headline slot + strings; residual deck risk lives in UC1
4. Each section has one job         NO       PARTIAL  slide 1 dual-job accepted (user merged hero+mindset at gate); slide 6 framed as single job "close the loop"
5. Cards actually necessary         NO(skills) NO(skills) CONFIRMED -> skills become weighted lists; cards only for projects
6. Motion improves hierarchy        NO       NO       CONFIRMED -> motion minimal: transport + hero stagger only
7. Premium without shadows          UNVERIF  NEEDS POLICY spec now bans decorative shadows; borders carry structure
Hard rejections triggered:          none against the spec'd design (card-grid risk neutralized)
```

Mockups: skipped — gstack designer requires an OpenAI API key (run design
setup to enable). Text spec + litmus consensus used instead.

## Decision Audit Trail (Phase 2 additions)

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 23 | Design | Full token spec written into plan (palette, type, space, motion) | Mechanical | P1,P5 | both voices: CRITICAL — vibes are how slop happens | - |
| 24 | Design | IBM Plex Sans + Plex Mono replace Inter | TASTE (gate, low stakes) | P5 | hard rule bans default stacks; Plex reads technical; trivially reversible | Inter |
| 25 | Design | Terminal traceability panel as hero anchor | Mechanical | P1 | litmus 2 failed in both voices; anchor must communicate testing judgment | gradient art |
| 26 | Design | Skills as weighted lists, not cards | Mechanical | P5 | both voices: badge-wall/card-grid is slop tell | card grid |
| 27 | Design | Hydration skeletons + stable slide count | Mechanical | P1 | blank-slide-2 on slow fetch; dot renumbering breaks hashes | - |
| 28 | Design | Short-viewport internal-scroll policy + 1280x620 test | Mechanical | P1 | recruiter laptops are 1366x768 with chrome | - |
| 29 | Design | Focus/inert/live-region concrete spec | Mechanical | P1 | keyboard is primary nav after W1 demotion | - |
| 30 | Design | Print spec hardened (first-class deliverable) | Mechanical | P1 | E2 is the declined-PDF stand-in | - |

PHASE 2 COMPLETE. Codex: 14 concern areas. Claude subagent: 17 findings.
Litmus consensus: 1/7 pass, 4/7 confirmed fail (all fixed in spec),
2/7 partial. 0 new user challenges (easter-egg discovery UX folded into
UC3; deck scannability folded into UC1). 1 low-stakes taste decision (#24
typography). Passing to Phase 3 (Eng).

---

# PHASE 3: ENG REVIEW (via /autoplan)

## Section 1: Architecture (eng-level)

- Module format: native ES modules (script type="module", defer semantics).
  Init order contract: (1) inline head snippet (NOT a module) reads
  localStorage/system pref and sets data-theme on <html> before first paint
  — kills theme FOUC; (2) nav.js initializes against STATIC slide DOM
  (slides and dots exist in index.html, so nav never waits on data);
  (3) data.js hydrates slide content into existing sections. Nav and
  hydration are order-independent by construction — no race.
- Data freshness: GitHub Pages serves with max-age=600. resume-data.json is
  fetched with cache: "no-store" (file <10KB) so content edits appear on
  next load; index.html itself still rides the 10-min CDN window —
  acceptable for a resume.
- 404.html: GitHub Pages project sites serve /<repo>/404.html for unknown
  paths under the repo path. Works without config.
- inert attribute: baseline since 2023 in all evergreen browsers; paired
  visibility+tabindex fallback retained for safety.
- Distribution: no artifacts; Pages serves the working tree on main. CI is
  verification-only, never a deploy dependency (site cannot be broken by a
  red CI, only flagged — deliberate, since Pages has no build gate here).
- Production failure scenario per integration point: fonts CDN blocked
  (system fallback), Pages CDN stale (10-min window), badge endpoint down
  (fixed-size img alt), Allure link rot (weekly links.spec).

## Section 2: Code quality (eng-level)

- Renderers use createElement/textContent exclusively (no innerHTML with
  data), one escape-free path — kills the injection class at the pattern
  level rather than by escaping discipline.
- Single goTo(index) entry; wheel/touch/key handlers are thin adapters that
  call it. Guard helpers named (canAdvance, isAnimating, dominantAxis).
- JSON schema documented at top of resume-data.json (comment key "_schema")
  so the maintainer edits confidently.
- No classes, no state machine library: activeIndex + animating flag is the
  whole state. Explicit over clever.

## Section 3: Test coverage diagram

```
CODE PATHS (all NEW — no existing tests)          PLANNED SPEC
[+] js/nav.js
  ├── goTo clamp/first/last edges                 nav.spec [→E2E]
  ├── key handlers (6 keys + spam guard)          nav.spec [→E2E]
  ├── wheel: axis dominance, threshold, lockout   nav.spec synthetic wheel [→E2E]
  ├── touch: angle detection                      nav.spec touchscreen [→E2E]
  ├── hash: valid/junk/legacy mapping, back/fwd   nav.spec [→E2E]
  └── focus/inert/live-region on navigate         a11y.spec [→E2E]
[+] js/data.js
  ├── happy hydrate (all sections)                content.spec
  ├── fetch 404/abort -> fallback                 content.spec route-abort
  ├── malformed JSON -> fallback                  content.spec route-fulfill
  └── partial data -> stable slide count          content.spec
[+] js/theme.js + inline head snippet
  ├── system pref initial, toggle, persist        theme.spec
  └── localStorage throws -> session-only         theme.spec (init script stub)
[+] css: responsive modes                         responsive.spec (375, 768, 1280x620, 1440)
[+] print                                         print.spec (media emulation)
[+] content integrity                             content.spec: Walnut present, metrics
                                                  qualified, banned-character scan
[+] links (external)                              links.spec (scheduled + label-gated,
                                                  easter-egg allowlist documented)
USER FLOWS
  15-second recruiter path (static hero pre-JS)   content.spec JS-disabled variant
  full traversal keyboard/dots/swipe              nav.spec
COVERAGE TARGET: every path above has a spec BEFORE ship; regression class
N/A (full replacement; content parity asserted against resume-data.json).
Flake control: synthetic events only, links.spec isolated from PR gate,
webServer managed by playwright.config (npx serve), no time/random deps.
```
Test plan artifact: ~/.gstack/projects/professional-website-resume/
krish-main-eng-review-test-plan-20260701-183500.md (written).

## Section 4: Performance (eng-level)

No N+1/DB class. Compositor-only transforms; measurements cached on resize;
fonts: two families, preconnect + font-display swap, subset weights
(400/500/600/700 only as used); total JS budget <15KB unminified; zero
images. Lighthouse perf >= 90 realistic; a11y >= 95 depends on contrast
tokens already specified.

## Worktree parallelization

| Step | Modules touched | Depends on |
|------|-----------------|------------|
| T1 content rebuild | data/ | — |
| T2 markup/style | index.html, css/, 404.html | headline strings (design spec) |
| T3 behavior | js/ | T2 DOM contract |
| T4 tests/CI | tests/, .github/ | T2+T3 selectors |
| T5 strip/egg/README | index.html, README | T2 |

Lane A: T1 (independent). Lane B: T2 -> T3 -> T4 -> T5 (sequential, shared
DOM contract). Launch A and B in parallel; single-implementer reality:
mostly sequential — no worktree split needed for a repo this size.

## Eng hardening absorbed from dual voices

- History model locked: pushState for user-initiated slide changes (real
  back/forward entries), replaceState only for initial canonicalization and
  legacy #pageN mapping; listen on popstate AND hashchange.
- Wheel deltas normalized by deltaMode (pixel/line/page: multiply line by
  ~16, page by viewport) before threshold accumulation; unit-style specs for
  the normalization and lockout guards; synthetic wheel E2E stays narrow;
  manual Safari/Firefox wheel check documented in README verification list.
- Wheel listener registered with { passive: false } + event.cancelable
  guard; spec asserts no passive-preventDefault console warning.
- touch-action CSS declared: pan-y on the deck track (desktop), custom
  swipe disabled entirely in mobile vertical mode (native scroll owns it).
- Single main.js bootstrap orders: static-DOM nav init -> hydrate -> focus/
  inert wiring; hydration fills existing section nodes, never replaces them.
  (Theme runs earlier as inline head snippet — no module race window.)
- Data cache strategy revised: fetch data/resume-data.json?v=<contentVersion>
  where contentVersion is a constant in index.html bumped with content
  edits — beats no-store because it also busts the Pages CDN edge, and HTML
  + JSON version move atomically in one commit.
- inert fallback made explicit: aria-hidden + tabindex=-1 on focusable
  descendants with restore-on-activate; not just visibility.
- 404.html uses repo-prefixed absolute links (/professional-website-resume/)
  and gets a Playwright check against a missing path on the live smoke run.
- links.spec: HEAD with ranged-GET fallback, short timeout, known-host
  exceptions, scheduled/manual runs only (never PR-gating).
- CI workflow: triggers push + pull_request + workflow_dispatch;
  permissions contents:read; never pull_request_target; npm cache via
  actions/setup-node; npx playwright install --with-deps; third-party
  actions pinned to commit SHA.
- Local/CI server unified: one npm script (npx serve pinned as devDep)
  wired into playwright.config webServer — identical headers both places.

## Eng hardening round 2 (Claude subagent uniques)

- History model refined per input type: discrete intents (dots, chevrons,
  keys, in-page links) push history; continuous gestures (wheel, touch)
  replaceState — back/forward works without gesture history spam.
  hashchange handler no-ops when target index == activeIndex (loop guard).
  history.scrollRestoration = "manual".
- Mobile snap mode is a first-class mode state machine (enum deck|snap,
  enter/exit hooks, shared activeIndex, listener teardown/re-register,
  transform reset). Breakpoint crossing mid-session gets its own
  responsive.spec case. Snap mode: hash updates only via IntersectionObserver
  + replaceState; hash-driven nav uses scrollIntoView, never hash assignment.
- Hydration dispatches a resume:hydrated event; nav re-measures overflow
  affordances on it and on resize (skeleton-height staleness fix). Nav init
  never depends on fetch success (decouples the current script.js bug class
  where initNavigation only runs after a successful fetch).
- Touch: pointercancel accepted as "native scroll won"; decide swipe-vs-
  scroll on first pointermove; overscroll-behavior: contain on inner
  scrollers.
- URL safety: anchors built via createElement + protocol allowlist
  (https:, mailto:) — escaping alone does not stop javascript: URLs.
- links.spec policy: GET with browser UA, per-host accepted statuses
  (linkedin.com 999/403 = pass), retry with backoff, fail only on
  DNS/404/410/5xx.
- Scheduled-workflow decay: GitHub auto-disables cron workflows after 60
  days of repo inactivity. Mitigation: workflow_dispatch always available +
  README note; a keepalive is over-engineering for a resume repo (accepted
  limitation, documented).
- Live smoke run triggers on workflow_run of pages-build-deployment (not on
  push) to avoid racing the CDN.
- Playwright reality checks: cross-browser projects chromium+firefox+webkit;
  browser binaries cached on Playwright version; swipe testing via CDP
  helper (Chromium project only), Firefox/WebKit swipe stays in the manual
  matrix; wheel accumulator/threshold/lockout extracted as pure functions
  unit-tested with Firefox-line-mode and macOS-momentum delta streams;
  hidden-slide content asserted via textContent (not toBeVisible);
  page.emulateMedia print check; external hosts (fonts, badge) route-stubbed
  in a shared fixture for all specs except links.spec.
- a11y.spec uses @axe-core/playwright (real contrast checking; also
  de-risks the E6 Lighthouse taste decision).
- Print CSS explicitly resets visibility/inert styling on off-slides.
- Observability claim corrected: 404.html catches bad PATHS only; bad
  #hash deep links are caught by the JS validate->slide-0 path (tested).

## ENG DUAL VOICES — CONSENSUS TABLE

```
Dimension                        Claude       Codex        Consensus
-------------------------------- ------------ ------------ -----------------
1. Architecture sound?           W/ FIXES     W/ FIXES     CONFIRMED: bootstrap + init contract required (absorbed)
2. Test coverage sufficient?     NO AS WRITTEN NO AS WRITTEN CONFIRMED: matrix, caching, swipe/wheel realism, axe (absorbed)
3. Performance risks addressed?  YES          YES          CONFIRMED PASS (static, budgeted)
4. Security threats covered?     MOSTLY       MOSTLY       CONFIRMED: SHA-pin actions, URL allowlist (absorbed)
5. Error paths handled?          YES W/ ADDS  YES W/ ADDS  CONFIRMED: FOUC, cache skew, pointercancel added
6. Deployment risk manageable?   YES W/ ADDS  YES W/ ADDS  CONFIRMED: live-smoke race + cron decay documented
```
Cross-model overlap (both voices independently): theme FOUC inline script,
pushState vs replaceState contradiction, deltaMode normalization,
passive:false, touch-action, JSON cache versioning, links.spec brittleness,
CI hardening. High-confidence signal; all absorbed.

## Decision Audit Trail (Phase 3 additions)

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 31 | Eng | main.js bootstrap + init order contract | Mechanical | P5 | both voices: module race is a near-certain failure | implicit order |
| 32 | Eng | Inline head theme snippet (FOUC kill) | Mechanical | P1 | both voices high severity | deferred theme.js |
| 33 | Eng | pushState discrete / replaceState continuous | Mechanical | P1,P5 | plan contradicted its own back/forward premise | replaceState-only |
| 34 | Eng | deltaMode normalization + pure-function specs | Mechanical | P1 | Firefox line-mode never crosses an 80px threshold | raw deltas |
| 35 | Eng | ?v= content version for JSON fetch | Mechanical | P1,P3 | busts CDN edge; HTML+JSON move atomically | no-store |
| 36 | Eng | Mode state machine deck/snap | Mechanical | P1 | dual nav is two implementations, not a CSS toggle | one-row resize note |
| 37 | Eng | links.spec per-host policy + non-gating schedule | Mechanical | P1,P3 | LinkedIn 999s would cry wolf weekly | HEAD-only gate |
| 38 | Eng | Cron-decay accepted + documented (no keepalive) | Mechanical | P3,P5 | keepalive is over-engineering for a resume repo | keepalive bot |
| 39 | Eng | axe-core in a11y.spec | Mechanical | P1 | "contrast" without tooling becomes roles-only | hand-rolled |
| 40 | Eng | SHA-pinned actions | Mechanical | P1 | tags are mutable; stated posture should be real | tag pinning |

PHASE 3 COMPLETE. Codex: 15 findings (5 high). Claude subagent: 20 findings.
Consensus: 6/6 dimensions confirmed after absorption; 0 new user
challenges; 0 unabsorbed disagreements. DX scope: NOT detected (audience is
recruiters, product is not a developer tool; maintainer DX covered by README
task + JSON schema comment). Phase 3.5 skipped. Passing to Phase 4 (Final
Gate).

---

# PHASE 4: COMPLETION SUMMARIES

```
+=====================================================================+
| CEO REVIEW (Phase 1) — SELECTIVE EXPANSION                          |
| Step 0: premise challenge run; approach B locked; 11 expansion      |
|   candidates: 7 accepted, 3 deferred, 1 skipped                     |
| S1 Arch: 1 finding (A1 static hero) | S2 Errors: 7 paths, 0 gaps    |
| S3 Security: 3 findings, 0 high after mitigation                    |
| S4 Data/UX: 14 edge cases mapped, 1 PARTIAL (W1, at gate)           |
| S5 Quality: current-site anti-patterns named | S6 Tests: full map   |
| S7 Perf: 0 issues | S8 Observ: cron-decay noted | S9 Deploy: 0 risk |
| S10 Future: reversibility 4/5, 0 debt | S11 Design: handed to Ph2   |
| Voices: codex 17 concerns / subagent 14 findings -> 4 USER          |
|   CHALLENGES + 2 taste; funnel work -> TODOS                        |
+=====================================================================+
| DESIGN REVIEW (Phase 2)                                             |
| Initial 5/10 -> post-spec: IA 9, States 9, Journey 8, Slop 9,       |
|   System 8, Responsive/A11y 9; litmus 4/7 confirmed-fail all fixed  |
| Voices: codex 14 areas / subagent 17 findings; mockups skipped      |
|   (designer needs OpenAI key); full token spec now in plan          |
+=====================================================================+
| ENG REVIEW (Phase 3) — FULL_REVIEW                                  |
| Arch: 5 issues (all absorbed) | Quality: 2 | Tests: 12 gaps closed  |
|   in plan | Perf: 0 | Failure modes: 9 rows, 0 CRITICAL GAPS        |
| Test plan artifact written; parallelization: 2 lanes (mostly seq)   |
| Voices: codex 15 / subagent 20; overlap = high-confidence signal    |
+=====================================================================+
```

## Cross-Phase Themes

- Theme: THE DECK ITSELF — flagged independently in Phase 1 (both CEO
  voices: hides content from skimmers) and Phase 2 (litmus 3 fail: not
  scannable by headlines). Highest-confidence signal of the whole run.
  Lives at the gate as UC1.
- Theme: SPECIFICITY BEATS VIBES — Phase 2 (tokens were vibes) and Phase 3
  (gesture/history handling was adjectives). Both phases converted vibes to
  numbers; the plan is now implementable without taste guesses.
- Theme: PROOF VISIBILITY — Phase 1 (tested-site strip, case study) and
  Phase 2 (traceability anchor on slide 1): the QA credibility story must
  be visible content, not repo trivia.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open (gate) | 11 proposals, 7 accepted, 3 deferred; 4 user challenges pending |
| Codex Review | `/codex review` | Independent 2nd opinion | 3 | ran (all phases) | CEO 17 / Design 14 / Eng 15 concerns, absorbed or at gate |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 35 findings absorbed, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score 5/10 -> 8.7/10, 8 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | skipped | no developer-facing scope |

- **CROSS-MODEL:** codex and claude subagents overlapped on the deck risk,
  FOUC, history model, deltaMode, cache skew, and links flakiness —
  cross-model consensus treated as high-confidence and absorbed; the four
  disagreements with the USER's stated direction are held as challenges,
  never auto-decided.
- **VERDICT:** ENG + DESIGN CLEARED; CEO gated on 4 user challenges + 4
  taste decisions at the final approval gate.

## FINAL GATE RESOLUTION (user, 2026-07-01)

- UC1 -> "whichever is recruiter/hiring-manager friendly" = scroll-first
  one-pager with section snapping. Arrow keys (left/right AND up/down),
  dots, and native touchpad/touch scrolling all navigate sections — the
  original keyboard front/back and swipe requirements survive, vertically.
  CONSEQUENCE: wheel interception is deleted (native scroll owns it), so
  W1, deltaMode normalization, the deck/snap mode state machine, and the
  gesture history split all collapse into ONE mode: snap sections +
  IntersectionObserver hash sync (replaceState) + pushState on discrete
  jumps. Taste item T3 is moot.
- UC2 -> ACCEPTED: sanitized PDF (office phone only) generated from the
  print layout via Playwright, shipped at assets/, linked in hero.
- UC3 -> ACCEPTED: easter egg dropped; visible "How this site is tested"
  case study carries the message. Link-check allowlist no longer needed.
- UC4 -> ACCEPTED: "QA Engineer (Internship), June 2026 - Present".
- T1 Lighthouse CI: INCLUDED (default stood). T2 analytics: DEFERRED to
  TODOS (default stood). T4 typography: IBM Plex (default stood).

STATUS: APPROVED — all decisions resolved.

NO UNRESOLVED DECISIONS

```
Pass 1 Info Architecture   6 -> 9   Hero answers who/what/where/proof/CTA in
                                    one viewport; slide order = hook, skills,
                                    trust, proof, credentials, action.
Pass 2 State Coverage      7 -> 9   States table in Section 11 + noscript,
                                    print, fetch-fail, theme-persist states.
Pass 3 Journey/Arc         6 -> 8   recognition -> competence -> trust ->
                                    proof -> validation -> action. Weak point:
                                    deck requires the recruiter to advance;
                                    mitigated by UC1 gate decision.
Pass 4 AI Slop Risk        4 -> 9   Purple-gradient tell neutralized by
                                    accent discipline; banned-character CI
                                    scan; no slop layout patterns; specific
                                    typography (not Inter-default).
Pass 5 Design System       3 -> 8   No DESIGN.md existed; the spec above is
                                    now the recorded system. Follow-up TODO:
                                    promote to DESIGN.md in repo.
Pass 6 Responsive/A11y     6 -> 9   Mobile = scroll-snap not "stacked"; 44px
                                    targets; contrast ratios stated; focus
                                    spec; aria-current dots; live region.
Pass 7 Unresolved          -        Palette family + type family are taste-
                                    adjustable at gate; all other decisions
                                    recorded above.
```
