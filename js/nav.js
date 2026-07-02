// Section navigation for the scroll-first layout.
// Native scroll owns wheel and touch. This module adds: arrow-key section
// jumps, dot rail state, hash sync (pushState for discrete jumps,
// replaceState for scroll-driven changes), and focus/announcement handling.

const LEGACY_HASH_MAP = {
  "#page1": "#hero",
  "#page2": "#skills",
  "#page3": "#experience",
  "#page4": "#projects",
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let sections = [];
let dots = [];
let activeIndex = 0;
// While a programmatic smooth scroll is in flight, the IntersectionObserver
// must not rewrite the hash for every section it passes.
let navigating = false;
let navigatingTimer = 0;

function sectionIndexFromHash(hash) {
  const canonical = LEGACY_HASH_MAP[hash] || hash;
  return sections.findIndex((section) => "#" + section.id === canonical);
}

function announce(index) {
  const region = document.getElementById("live-region");
  const heading = sections[index].querySelector("h1, h2");
  if (region && heading) {
    region.textContent =
      "Section " + (index + 1) + " of " + sections.length + ": " + heading.textContent.trim();
  }
}

function setActive(index) {
  if (index === activeIndex && dots[index]?.getAttribute("aria-current") === "true") return;
  activeIndex = index;
  dots.forEach((dot, i) => {
    if (i === index) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
}

function goTo(index, { push = true, focus = true } = {}) {
  if (index < 0 || index >= sections.length || Number.isNaN(index)) return;
  const target = sections[index];

  navigating = true;
  window.clearTimeout(navigatingTimer);
  navigatingTimer = window.setTimeout(() => { navigating = false; }, 900);

  setActive(index);
  const hash = "#" + target.id;
  if (push && window.location.hash !== hash) {
    history.pushState(null, "", hash);
  }
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  if (focus) target.focus({ preventScroll: true });
  announce(index);
}

function onKeyDown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  switch (event.key) {
    case "ArrowRight":
      event.preventDefault();
      goTo(activeIndex + 1);
      break;
    case "ArrowLeft":
      event.preventDefault();
      goTo(activeIndex - 1);
      break;
    case "Home":
      event.preventDefault();
      goTo(0);
      break;
    case "End":
      event.preventDefault();
      goTo(sections.length - 1);
      break;
  }
}

function observeSections() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = sections.indexOf(entry.target);
        if (index === -1) continue;
        setActive(index);
        if (!navigating) {
          const hash = "#" + entry.target.id;
          if (window.location.hash !== hash) history.replaceState(null, "", hash);
        }
      }
    },
    { threshold: 0.55 }
  );
  sections.forEach((section) => observer.observe(section));
}

export function initNav() {
  sections = Array.from(document.querySelectorAll("main .slide"));
  dots = Array.from(document.querySelectorAll(".dot"));
  if (sections.length === 0) return;

  history.scrollRestoration = "manual";

  // Canonicalize legacy hashes from previously shared links.
  if (LEGACY_HASH_MAP[window.location.hash]) {
    history.replaceState(null, "", LEGACY_HASH_MAP[window.location.hash]);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", (event) => {
      event.preventDefault();
      const index = sectionIndexFromHash(dot.getAttribute("href"));
      goTo(index);
    });
  });

  document.addEventListener("keydown", onKeyDown);

  // Back/forward and manually edited hashes. Junk hashes go to the top.
  window.addEventListener("hashchange", () => {
    const index = sectionIndexFromHash(window.location.hash);
    goTo(index === -1 ? 0 : index, { push: false });
  });

  observeSections();

  // Deep link on load; invalid hash falls back to the first section.
  const initial = sectionIndexFromHash(window.location.hash);
  if (initial > 0) {
    goTo(initial, { push: false, focus: false });
  } else {
    setActive(0);
  }

  const hint = document.querySelector("[data-nav-hint]");
  if (hint) hint.hidden = false;
}
