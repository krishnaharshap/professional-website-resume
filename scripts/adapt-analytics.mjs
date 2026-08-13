// Reshapes the portfolio-analytics repo's published site/summary.json into the
// exact shape js/insights.js reads. This is a pure reshape, not a second
// aggregation implementation: every count, every k-anonymity suppression, and
// the anomaly/integrity gate all happen once, upstream, in that repo. Nothing
// here recomputes a number from raw events - it only renames fields, derives
// display-only values (a rolling mean, a max-by lookup) from numbers already
// published, and fills in honest gaps (null, not a guess) where the upstream
// summary does not provide something the older shape used to have.
//
// Usage: node scripts/adapt-analytics.mjs <summary.json> <out.json>
// Exit 0 wrote or left unchanged, 1 bad input.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const MIN_SAMPLE = 30;
const SECTION_LABELS = {
  0: "Intro",
  1: "Skills",
  2: "Experience",
  3: "Regulated QE",
  4: "Projects",
  5: "Contact",
};

const [, , summaryPath, outPath] = process.argv;
if (!summaryPath || !outPath) {
  console.error("usage: adapt-analytics.mjs <summary.json> <out.json>");
  process.exit(1);
}

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, "utf8"));
} catch (error) {
  console.error("Could not parse the upstream summary: " + error.message);
  process.exit(1);
}

if (
  !summary ||
  typeof summary.generatedAt !== "string" ||
  !summary.traffic ||
  !Array.isArray(summary.traffic.sessionsSeries) ||
  !summary.breakdowns ||
  !summary.contact
) {
  console.error("Upstream summary is missing required fields.");
  process.exit(1);
}

// ---- time series --------------------------------------------------------

const days = summary.traffic.sessionsSeries.map((d) => d.day);
const sessions = summary.traffic.sessionsSeries.map((d) => d.value);

// Trailing 7-day mean, a display-layer smoothing over numbers already
// published upstream. Not a recomputation of any count.
const sessionsMean7 = sessions.map((_, i) => {
  if (i < 6) return null;
  const window = sessions.slice(i - 6, i + 1);
  return Math.round((window.reduce((a, b) => a + b, 0) / 7) * 100) / 100;
});

// ---- sample gate ---------------------------------------------------------
// windowDays reflects the real length of the upstream window rather than an
// assumed number, so the dashboard's label can never silently drift from what
// was actually measured.
const windowDays = days.length;
const sampleMet = summary.traffic.sessions28d >= MIN_SAMPLE;

// ---- sources --------------------------------------------------------------
// Upstream publishes a window total per source, already k-anonymity suppressed
// (a cell below the threshold arrives as value: 0). No per-day series exists
// at this layer, so none is fabricated; js/insights.js omits the sparkline
// when a source has no series rather than drawing one from a single point.
const sources = (summary.breakdowns.source ?? [])
  .map((cell) => ({ key: cell.dim, total: cell.value }))
  .filter((source) => source.total > 0);

const topSource = sources.length
  ? sources.slice().sort((a, b) => b.total - a.total)[0].key
  : "";

// ---- read-through -----------------------------------------------------
// sectionReach cells are already suppressed counts, not rates. The rate is
// computed here by dividing by the published session total, which is the
// same division the old build script did - a display derivation, not a new
// aggregation.
const readThrough = (summary.breakdowns.sectionReach ?? [])
  .map((cell) => {
    const index = Number(cell.dim);
    return {
      index,
      label: SECTION_LABELS[index] ?? cell.dim,
      sessions: cell.value,
      rate:
        summary.traffic.sessions28d > 0
          ? Math.round((cell.value / summary.traffic.sessions28d) * 1000) / 1000
          : 0,
    };
  })
  .filter((step) => Number.isInteger(step.index))
  .sort((a, b) => a.index - b.index);

// ---- mobile share ---------------------------------------------------------

const deviceCells = summary.breakdowns.device ?? [];
const deviceTotal = deviceCells.reduce((sum, c) => sum + c.value, 0);
const mobileShare =
  deviceTotal > 0
    ? (deviceCells.find((c) => c.dim === "mobile")?.value ?? 0) / deviceTotal
    : 0;

// ---- output ---------------------------------------------------------------

const output = {
  generatedAt: summary.generatedAt,
  minSample: MIN_SAMPLE,
  sampleMet,
  series: { days, sessions, sessionsMean7 },
  sources,
  readThrough,
  kpi: {
    sessionsWindow: summary.traffic.sessions28d,
    windowDays,
    // Upstream is a single rolling window with no comparison to a prior
    // period, so no delta is invented. null, not a fabricated number.
    sessionsDelta: null,
    readThroughRate: readThrough.length ? readThrough[readThrough.length - 1].rate : 0,
    topSource,
    pdfDownloads: summary.contact.pdfDownloads28d,
    mobileShare: Math.round(mobileShare * 1000) / 1000,
  },
};

// ---- validate our own output before writing --------------------------
// The file is committed and auto-deployed with no human in the loop, so this
// is the last place a malformed payload can be stopped.

if (
  output.series.days.length !== output.series.sessions.length ||
  output.series.days.length !== output.series.sessionsMean7.length ||
  !Number.isFinite(output.kpi.sessionsWindow)
) {
  console.error("REFUSED: adapted payload failed its own shape check.");
  process.exit(1);
}

// Byte-compare ignoring generatedAt so an unchanged upstream produces no commit.
const stripTimestamp = (json) => JSON.stringify({ ...JSON.parse(json), generatedAt: null });
const next = JSON.stringify(output, null, 2) + "\n";

if (existsSync(outPath)) {
  try {
    const current = readFileSync(outPath, "utf8");
    if (stripTimestamp(current) === stripTimestamp(next)) {
      console.log("UNCHANGED: upstream summary produced no new data.");
      process.exit(0);
    }
  } catch {
    // Existing file is unreadable or is the seed. Fall through and overwrite.
  }
}

writeFileSync(outPath, next);
console.log(
  `WROTE ${outPath}: ${output.kpi.sessionsWindow} sessions over ${windowDays}d, ` +
    `sampleMet=${sampleMet}.`
);
