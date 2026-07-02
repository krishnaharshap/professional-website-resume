const STORAGE_KEY = "theme";

function storedTheme() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function applyTheme(theme, persist) {
  document.documentElement.setAttribute("data-theme", theme);
  const button = document.getElementById("theme-toggle");
  if (button) button.textContent = "theme: " + theme;
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* session-only */ }
  }
}

export function initTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current, false);

  const button = document.getElementById("theme-toggle");
  if (button) {
    button.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  // Follow OS changes only while the user has no explicit preference.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light", false);
  });
}
