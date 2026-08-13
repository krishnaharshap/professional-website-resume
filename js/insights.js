// Renders the #insights dashboard from data/analytics.json.
//
// Hand-rolled SVG, no chart library. Three reasons that matter:
//
// - Theming. Every stroke and fill comes from a CSS class, so var(--accent)
//   resolves live and a theme toggle recolors the charts with no redraw. A
//   canvas chart bakes its colors at draw time and js/theme.js emits no event,
//   so it would silently keep the stale palette.
// - Weight. Chart.js is ~200KB against a Lighthouse budget that gates CI at
//   0.90, on a site whose whole posture is zero external requests.
// - The site's design law (css/styles.css:1) allows one accent color. Chart
//   libraries assume a categorical multi-hue palette. Series here are separated
//   by position and weight instead, never by hue.
//
// Everything is built with createElement/textContent. Nothing here ever touches
// innerHTML, matching js/data.js.

import { refreshNav } from "./nav.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function pct(value) {
  return Math.round(value * 100) + "%";
}

/**
 * Screen readers get nothing from an SVG. Every chart ships the same numbers as
 * a real table so the a11y gate (>= 0.95, axe on every browser) is met by
 * actually being accessible rather than by an aria-label that summarizes away
 * the data.
 */
function dataTable(caption, headers, rows) {
  const table = el("table", "visually-hidden");
  const cap = el("caption", null, caption);
  table.appendChild(cap);

  const thead = el("thead");
  const hr = el("tr");
  headers.forEach((h) => hr.appendChild(el("th", null, h)));
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach((row) => {
    const tr = el("tr");
    row.forEach((cell) => tr.appendChild(el("td", null, String(cell))));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function figure(title, description, chartNode, table) {
  const fig = el("figure", "chart");
  const cap = el("figcaption", "chart-title mono", title);
  fig.appendChild(cap);
  chartNode.setAttribute("role", "img");
  chartNode.setAttribute("aria-label", description);
  fig.appendChild(chartNode);
  if (table) fig.appendChild(table);
  return fig;
}

/** Builds an SVG path, breaking the line wherever a value is null so a leading
 *  gap in the rolling mean is a gap rather than a line to zero. */
function linePath(values, width, height, max) {
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const scale = max > 0 ? height / max : 0;
  let d = "";
  let pen = "M";
  values.forEach((value, i) => {
    if (value === null || value === undefined) {
      pen = "M";
      return;
    }
    d += `${pen}${(i * step).toFixed(1)},${(height - value * scale).toFixed(1)} `;
    pen = "L";
  });
  return d.trim();
}

function timeSeriesChart(series) {
  const width = 720;
  const height = 180;
  const pad = { top: 8, right: 4, bottom: 20, left: 4 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const max = Math.max(1, ...series.sessions.filter((n) => typeof n === "number"));

  const node = svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    preserveAspectRatio: "none",
  });

  const plot = svg("g", { transform: `translate(${pad.left}, ${pad.top})` });

  plot.appendChild(
    svg("line", { class: "chart-axis", x1: 0, y1: plotH, x2: plotW, y2: plotH })
  );

  // Raw daily sits behind at low opacity; the 7-day mean is the line you are
  // meant to read. Same hue, different weight - see the design law above.
  plot.appendChild(
    svg("path", { class: "chart-line-raw", d: linePath(series.sessions, plotW, plotH, max) })
  );
  plot.appendChild(
    svg("path", { class: "chart-line-mean", d: linePath(series.sessionsMean7, plotW, plotH, max) })
  );

  node.appendChild(plot);

  const first = svg("text", { class: "chart-label mono", x: 0, y: height - 6 });
  first.textContent = series.days[0] ?? "";
  const last = svg("text", {
    class: "chart-label mono",
    x: width,
    y: height - 6,
    "text-anchor": "end",
  });
  last.textContent = series.days[series.days.length - 1] ?? "";
  node.appendChild(first);
  node.appendChild(last);

  const peak = svg("text", { class: "chart-label mono", x: 0, y: 12 });
  peak.textContent = "peak " + max;
  node.appendChild(peak);

  return node;
}

function sparkline(values) {
  const width = 200;
  const height = 40;
  const max = Math.max(1, ...values);
  const node = svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "spark-svg",
    preserveAspectRatio: "none",
  });
  node.appendChild(
    svg("path", { class: "chart-line-mean", d: linePath(values, width, height - 2, max) })
  );
  return node;
}

function sourcesPanel(sources) {
  const wrap = el("div", "insights-sources");
  const heading = el("h3", "chart-title mono", "Where visits come from");
  wrap.appendChild(heading);

  const grid = el("div", "sources-grid");
  sources.forEach((source) => {
    const cell = el("div", "source-cell");
    cell.appendChild(el("span", "source-key mono", source.key));
    cell.appendChild(el("span", "source-total mono", String(source.total)));
    // The upstream summary only publishes a window total per source, not a
    // daily series, so the sparkline is omitted rather than drawn from a
    // single point. A flat line at one value would look like data; it is not.
    if (Array.isArray(source.series) && source.series.length > 1) {
      cell.appendChild(
        figure(
          "",
          `${source.key}: ${source.total} sessions over the window`,
          sparkline(source.series),
          null
        )
      );
    }
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);

  wrap.appendChild(
    dataTable(
      "Sessions by traffic source",
      ["Source", "Sessions"],
      sources.map((s) => [s.key, s.total])
    )
  );
  return wrap;
}

/**
 * Read-through is a proportion, so it is an estimate rather than a count. Below
 * the sample threshold it shows nothing rather than a number that a +/-15 point
 * confidence interval would make meaningless.
 */
function readThroughPanel(readThrough, sampleMet, minSample) {
  const wrap = el("div", "insights-funnel");
  wrap.appendChild(el("h3", "chart-title mono", "How far people read"));

  if (!sampleMet) {
    wrap.appendChild(
      el(
        "p",
        "insights-gate mono",
        `Not enough data yet. Rates appear once the window holds at least ${minSample} sessions.`
      )
    );
    return wrap;
  }

  const list = el("ol", "funnel");
  readThrough.forEach((step) => {
    const item = el("li", "funnel-step");
    item.appendChild(el("span", "funnel-label mono", step.label));

    const track = el("span", "funnel-track");
    const fill = el("span", "funnel-fill");
    fill.style.width = pct(step.rate);
    track.appendChild(fill);
    item.appendChild(track);

    item.appendChild(el("span", "funnel-value mono", pct(step.rate)));
    list.appendChild(item);
  });
  wrap.appendChild(list);

  wrap.appendChild(
    dataTable(
      "Share of sessions reaching each section",
      ["Section", "Sessions", "Share"],
      readThrough.map((s) => [s.label, s.sessions, pct(s.rate)])
    )
  );
  return wrap;
}

function kpiStrip(kpi, sampleMet) {
  const wrap = el("dl", "kpi-strip");

  const add = (label, value, hint) => {
    const item = el("div", "kpi");
    item.appendChild(el("dt", "kpi-label mono", label));
    item.appendChild(el("dd", "kpi-value mono", value));
    // A second <dd>, not a <p>. A <div> inside a <dl> may contain only dt/dd
    // groups, and axe flags anything else as a serious violation.
    if (hint) item.appendChild(el("dd", "kpi-hint mono", hint));
    wrap.appendChild(item);
  };

  // windowDays comes from the upstream summary rather than being assumed, so
  // the label always states the real window instead of a hardcoded number
  // that could silently go stale if the source pipeline's window changes.
  const days = kpi.windowDays ?? 28;
  // The upstream summary is a single rolling window with no comparison to a
  // prior period, so no delta is fabricated. sessionsDelta is only shown when
  // the source actually provides one.
  const hasDelta = typeof kpi.sessionsDelta === "number";
  const sign = hasDelta && kpi.sessionsDelta > 0 ? "+" : "";
  const hint = hasDelta ? `${sign}${kpi.sessionsDelta} vs prior ${days}d` : null;

  // Counts are facts and always show. Rates are estimates and wait for sample.
  add(`Sessions, ${days}d`, String(kpi.sessionsWindow), hint);
  add(`Resume opens, ${days}d`, String(kpi.pdfDownloads));
  add("Top source", kpi.topSource || "n/a");
  add("Read-through", sampleMet ? pct(kpi.readThroughRate) : "--");
  add("Mobile", sampleMet ? pct(kpi.mobileShare) : "--");

  return wrap;
}

/** Rejects anything that is not the exact shape we expect. A malformed file
 *  leaves the section hidden rather than rendering a broken chart. */
function valid(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.generatedAt === "string" &&
    data.series &&
    Array.isArray(data.series.days) &&
    Array.isArray(data.series.sessions) &&
    Array.isArray(data.series.sessionsMean7) &&
    data.series.days.length === data.series.sessions.length &&
    Array.isArray(data.sources) &&
    Array.isArray(data.readThrough) &&
    data.kpi &&
    typeof data.kpi.sessionsWindow === "number" &&
    typeof data.kpi.pdfDownloads === "number"
  );
}

function render(data) {
  const body = document.getElementById("insights-body");
  const note = document.getElementById("insights-note");
  if (!body) return;

  const sampleMet = data.sampleMet === true;

  body.textContent = "";
  body.appendChild(kpiStrip(data.kpi, sampleMet));
  body.appendChild(
    figure(
      "Sessions per day, 7-day average",
      `Daily sessions from ${data.series.days[0]} to ${
        data.series.days[data.series.days.length - 1]
      }, peaking at ${Math.max(1, ...data.series.sessions)}.`,
      timeSeriesChart(data.series),
      dataTable(
        "Sessions per day",
        ["Day", "Sessions"],
        data.series.days.map((d, i) => [d, data.series.sessions[i]])
      )
    )
  );
  body.appendChild(sourcesPanel(data.sources));
  body.appendChild(readThroughPanel(data.readThrough, sampleMet, data.minSample ?? 30));

  const generated = Date.parse(data.generatedAt);
  const stale = Number.isFinite(generated) && Date.now() - generated > STALE_AFTER_MS;
  if (note) {
    // The undercount is stated rather than hidden. Ad blockers are common in
    // this audience, so an unqualified number here would be a number I could
    // not defend.
    note.textContent =
      `Updated ${data.generatedAt.slice(0, 10)}. ` +
      "Counts exclude anyone using an ad blocker, so treat them as a floor. " +
      "No cookies, no IP addresses, no user-agent strings. A random per-tab key " +
      "lives at most 24 hours to avoid double-counting, then is destroyed; only " +
      "daily totals are kept.";
  }
  if (stale) {
    document.getElementById("insights")?.classList.add("is-stale");
  }
}

export async function initInsights() {
  const section = document.getElementById("insights");
  if (!section) return;

  try {
    // The file changes at most once a day, so a date-stamped buster is exact.
    // Deliberately not data-content-version, which js/data.js depends on.
    const version = new Date().toISOString().slice(0, 10);
    const response = await fetch("data/analytics.json?v=" + version);
    if (!response.ok) return;

    const data = await response.json();
    if (!valid(data)) return;

    render(data);

    section.hidden = false;
    const dot = document.querySelector('[data-dot-for="insights"]');
    if (dot) dot.hidden = false;
    // Nav collected the deck before this section existed, so tell it to re-read.
    refreshNav();
  } catch {
    // Offline, 404, malformed JSON, blocked request. The section stays hidden;
    // nothing else on the page is affected.
  }
}
