// Bootstrap order contract (PLAN.md Phase 3):
// 1. Theme was already applied by the inline head snippet (pre-paint).
// 2. Nav initializes against the static DOM and never waits on data.
// 3. Hydration fills existing sections; it never adds or removes them,
//    so slide count, dots, and hashes stay stable on partial data.
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { hydrate } from "./data.js";

initTheme();
initNav();
hydrate();
