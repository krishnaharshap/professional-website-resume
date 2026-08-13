// Bootstrap order contract (PLAN.md Phase 3):
// 1. Theme was already applied by the inline head snippet (pre-paint).
// 2. Nav initializes against the static DOM and never waits on data.
// 3. Hydration fills existing sections; it never adds or removes them,
//    so slide count, dots, and hashes stay stable on partial data.
// 4. Analytics attaches after nav so the "nav:section" listener is registered
//    before the first section becomes active, and never blocks either.
// 5. Insights renders last; it is the only module allowed to fail visibly, and
//    it fails by hiding its own section.
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { hydrate } from "./data.js";
import { initAnalytics } from "./analytics.js";
import { initInsights } from "./insights.js";

initTheme();
initAnalytics();
initNav();
hydrate();
initInsights();
