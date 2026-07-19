# professional-website-resume

Resume site for QA Engineer / SDET positioning, built as its own test subject.
Live at https://krishnaharshap.github.io/professional-website-resume/

[![CI](https://github.com/krishnaharshap/professional-website-resume/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnaharshap/professional-website-resume/actions/workflows/ci.yml)

## What this is

A scroll-first one-pager with six snap sections (intro, skills, current
experience, regulated QE experience, projects, credentials). Arrow keys, the
dot rail, and native scrolling all navigate; every section is hash
deep-linkable, including legacy `#page1`-`#page4` links from the old site.
Light and dark purple themes follow the system preference with a manual
toggle. The print stylesheet produces a clean linear document, and the same
layout generates the downloadable PDF.

The point of the repo is the test suite: a QA portfolio site that ships with
its own Playwright suite, accessibility scans, and CI is the proof, not the
claim.

## Architecture

- `index.html` - static hero (complete before any JS runs), six sections,
  OG/JSON-LD metadata, inline pre-paint theme snippet
- `css/styles.css` - design tokens (dual theme with stated contrast ratios),
  IBM Plex Sans/Mono, snap sections, print stylesheet, reduced motion
- `js/main.js` - bootstrap order contract: theme (inline, pre-paint), nav
  (static DOM, never waits on data), then hydration
- `js/theme.js` - toggle button, localStorage persistence, follows OS
  `prefers-color-scheme` changes only while no explicit choice is stored
- `js/data.js` - fetches `data/resume-data.json`, renders with
  createElement/textContent only, URL protocol allowlist, graceful fallback
- `js/nav.js` - keyboard section jumps, dot rail, IntersectionObserver hash
  sync, focus management, live-region announcements
- `tests/` - Playwright specs: content parity, navigation, theme,
  responsive, axe-core accessibility, print, scheduled link checks

## Updating the resume

Edit `data/resume-data.json`, then bump `data-content-version` on the
`<html>` tag in `index.html` (this busts the GitHub Pages CDN cache).
Regenerate the PDF with `npm run pdf`. The hero identity block is static in
`index.html`; update both if name/title/value prop change.

## Running locally

```
npm install
npx playwright install
npm run serve          # http://localhost:4173
npm test               # full suite (3 browsers)
npm run test:chromium  # faster local loop
npm run pdf            # regenerate assets/Krishna_Puppala_Resume.pdf
```

Requires Node 20+.

## CI

- `ci.yml` - Playwright across Chromium, Firefox, and WebKit plus Lighthouse
  budgets (performance >= 0.90, accessibility >= 0.95) on every push and PR
- `links.yml` - weekly link-rot check against the live site with per-host
  status policies (kept out of the PR gate so it cannot cry wolf). GitHub
  disables cron workflows after 60 days of repo inactivity; trigger manually
  from the Actions tab if the badge goes quiet
- `live-smoke.yml` - smoke run against the production URL after each Pages
  deployment finishes, plus a custom-404 check

Manual test matrix (not automatable in CI): trackpad and touch swipe feel on
macOS Safari and Firefox, real print output, screen reader pass.
