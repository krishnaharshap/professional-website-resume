// First-party analytics beacon.
//
// Three rules govern everything here:
//
// 1. It must never affect the page. Analytics is not in the render path, so
//    every failure is swallowed. A dead collector must look identical to a live
//    one from the visitor's side.
// 2. It sends two requests per session, not one per event. Events accumulate in
//    memory and flush on pagehide.
// 3. It reads section depth from the "nav:section" event that js/nav.js already
//    emits, rather than starting a second IntersectionObserver over the same
//    elements.
//
// The collector URL comes from data-collector on <html>. With the attribute
// absent the module is inert, which is what keeps the site shippable before the
// Worker exists and keeps the Playwright suite hermetic.

const SESSION_KEY = "kp-analytics-session";

// Canonical depth order, deliberately NOT the live DOM index. #insights reveals
// itself after load, which would shift every later section by one and make the
// same visit report depth 5 on one day and 6 on the next. Ordering the funnel
// against a fixed list keeps a day of history comparable to the next.
// #insights is absent on purpose: it is the dashboard itself, so its position
// is unstable and "did they read my analytics" is not a question worth asking.
const SECTION_ORDER = [
  "hero",
  "skills",
  "experience",
  "experience-early",
  "projects",
  "credentials",
];

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|ecosia|yahoo|brave|startpage)\./;
const LINKEDIN_HOSTS = /(^|\.)(linkedin\.com|lnkd\.in)$/;
const GITHUB_HOSTS = /(^|\.)(github\.com|github\.io)$/;
const SOURCES = ["linkedin", "github", "search", "direct", "other"];

const state = {
  endpoint: null,
  token: null,
  source: "direct",
  device: "desktop",
  depth: 0,
  pdf: 0,
  sent: false,
};

/** Per-tab, dies with the tab, never a persistent identity. Only ever used to
 *  avoid double-counting one visit, and the server discards it nightly. */
function sessionToken() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Private mode, storage disabled, or no crypto.randomUUID. A per-load token
    // still works; it just counts a reload as a new session.
    try { return crypto.randomUUID(); } catch { return null; }
  }
}

/**
 * Where this visit came from. The UTM tag wins because it is a link we control,
 * and LinkedIn's in-app browser and lnkd.in shim frequently strip the referrer.
 */
function detectSource() {
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm && SOURCES.includes(utm.toLowerCase())) return utm.toLowerCase();

    if (!document.referrer) return "direct";
    const host = new URL(document.referrer).hostname.toLowerCase();

    // Internal navigation is not a referral.
    if (host === window.location.hostname) return "direct";
    if (LINKEDIN_HOSTS.test(host)) return "linkedin";
    if (GITHUB_HOSTS.test(host)) return "github";
    if (SEARCH_HOSTS.test(host)) return "search";
    return "other";
  } catch {
    return "direct";
  }
}

/** Viewport width only. Never the user-agent string, which is personal data the
 *  moment it is read. */
function detectDevice() {
  const w = window.innerWidth || document.documentElement.clientWidth || 1280;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function send(phase) {
  if (!state.endpoint || !state.token) return;
  const payload = JSON.stringify({
    t: state.token,
    s: state.source,
    d: state.device,
    p: phase,
    x: state.depth,
    f: state.pdf,
  });

  try {
    // sendBeacon only, deliberately. A fetch fallback would log a console error
    // whenever the request is blocked, and an ad blocker eating the beacon is
    // the expected case, not an exception. This repo treats a console error as
    // a test failure, so the quiet path is the correct one: sendBeacon returns
    // false rather than throwing or logging.
    //
    // text/plain keeps this a CORS simple request: no preflight, and the
    // response is never read, so no CORS response headers are needed either.
    if (!navigator.sendBeacon) return;
    navigator.sendBeacon(state.endpoint, new Blob([payload], { type: "text/plain" }));
  } catch {
    // Blocked by an extension, offline, CSP. Not our problem to solve.
  }
}

function flush() {
  if (state.sent) return;
  state.sent = true;
  send("unload");
}

export function initAnalytics() {
  try {
    const endpoint = document.documentElement.getAttribute("data-collector");
    if (!endpoint) return;

    state.endpoint = endpoint;
    state.token = sessionToken();
    if (!state.token) return;

    state.source = detectSource();
    state.device = detectDevice();

    // Reuses the observer already running in js/nav.js. Resolved against
    // SECTION_ORDER by id, never by the event's live DOM index.
    document.addEventListener("nav:section", (event) => {
      const rank = SECTION_ORDER.indexOf(event.detail?.id);
      if (rank > state.depth) state.depth = rank;
    });

    // Delegated so it survives hydration replacing the contact block.
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.('a[href$=".pdf"]');
      if (link) state.pdf = 1;
    }, true);

    // pagehide is the reliable one; iOS Safari does not fire beforeunload or a
    // final visibilitychange on tab close. The flush latch makes the overlap
    // between these two harmless.
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });

    send("load");
  } catch {
    // Never let instrumentation break the page it is measuring.
  }
}
