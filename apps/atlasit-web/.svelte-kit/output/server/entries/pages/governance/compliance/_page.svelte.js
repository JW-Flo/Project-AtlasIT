import {
  B as ensure_array_like,
  D as attr_class,
  N as bind_props,
} from "../../../../chunks/index2.js";
import { e as escape_html, a as attr } from "../../../../chunks/attributes.js";
const rtf =
  typeof Intl !== "undefined" && Intl.RelativeTimeFormat
    ? new Intl.RelativeTimeFormat(void 0, { numeric: "auto" })
    : null;
const intervals = [
  [60, 1],
  // seconds
  [3600, 60],
  // minutes
  [86400, 3600],
  // hours
  [604800, 86400],
  // days
  [2629800, 604800],
  // weeks (~month/4)
  [31557600, 2629800],
  // months (~year/12)
];
function relativeTime(iso) {
  const now = Date.now();
  const ts = normalizeInputTs(iso, now);
  const diffSeconds = Math.floor((ts - now) / 1e3);
  const abs = Math.abs(diffSeconds);
  if (!rtf) return fallbackRelative(abs, ts);
  const match = findInterval(abs, diffSeconds);
  if (match) return match;
  const years = Math.round(diffSeconds / 31557600);
  return rtf.format(years, "year");
}
function normalizeInputTs(input, now) {
  if (typeof input === "number") return input;
  if (typeof input === "string") {
    const parsed = Date.parse(input);
    return Number.isFinite(parsed) ? parsed : now;
  }
  if (input instanceof Date) return input.getTime();
  return now;
}
function fallbackRelative(abs, ts) {
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
  if (abs < 604800) return `${Math.round(abs / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
function findInterval(abs, diffSeconds) {
  for (const [threshold, divisor] of intervals) {
    if (abs < threshold) {
      const value = Math.round(diffSeconds / divisor);
      return rtf.format(value, unitForDivisor(divisor));
    }
  }
  return null;
}
function unitForDivisor(divisor) {
  switch (divisor) {
    case 1:
      return "second";
    case 60:
      return "minute";
    case 3600:
      return "hour";
    case 86400:
      return "day";
    case 604800:
      return "week";
    case 2629800:
      return "month";
    default:
      return "day";
  }
}
function robustRelativeTime(input, now = /* @__PURE__ */ new Date()) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const direction = diffMs > 0 ? "in" : "ago";
  const sec = Math.round(absMs / 1e3);
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  function formatTimeSegment(value, unit) {
    return value + unit;
  }
  if (sec < 5) return direction === "in" ? "soon" : "just now";
  if (sec < minute) return `${formatTimeSegment(sec, "s")} ${direction}`;
  const m = Math.round(sec / minute);
  if (m < 60) return `${formatTimeSegment(m, "m")} ${direction}`;
  const h = Math.round(sec / hour);
  if (h < 24) return `${formatTimeSegment(h, "h")} ${direction}`;
  const d = Math.round(sec / day);
  if (d < 7) return `${formatTimeSegment(d, "d")} ${direction}`;
  const w = Math.round(sec / week);
  if (w < 5) return `${formatTimeSegment(w, "w")} ${direction}`;
  const mo = Math.round(sec / month);
  if (mo < 12) return `${formatTimeSegment(mo, "mo")} ${direction}`;
  const y = Math.round(sec / year);
  return `${formatTimeSegment(y, "y")} ${direction}`;
}
function mapEventTypeToIcon(type) {
  if (!type) return "•";
  if (type.startsWith("policy.")) return "⚖️";
  if (type.startsWith("evidence.")) return "🧾";
  if (type.startsWith("incident.")) return "🚨";
  if (type.startsWith("workflow.")) return "🔁";
  if (type.startsWith("access.")) return "🔐";
  return "•";
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let highPriorityNotifications, latencyChips;
    let data = $$props["data"];
    let state = data;
    let lastServerFetchedAt = data.fetchedAt;
    let lastClientFetchedAt = data.fetchedAt;
    let refreshing = false;
    let coverageControls = [];
    let filteredControls = [];
    let controlsWithShare = [];
    let totalEvidence = 0;
    let filterValue = "";
    const numberFormatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    });
    const integerFormatter = new Intl.NumberFormat("en-US");
    const LATENCY_KEYS = [
      { key: "workflowExecute", label: "Workflow Execute" },
      { key: "policyGenerate", label: "Policy Generate" },
      { key: "policyEvaluate", label: "Policy Evaluate" },
    ];
    function formatLatency(bucket) {
      if (!bucket || typeof bucket !== "object") return null;
      const p50 =
        typeof bucket.p50 === "number"
          ? bucket.p50
          : typeof bucket.avg === "number"
            ? bucket.avg
            : null;
      const p95 =
        typeof bucket.p95 === "number"
          ? bucket.p95
          : typeof bucket.p90 === "number"
            ? bucket.p90
            : null;
      if (p50 === null && p95 === null) return null;
      const round = (value) => `${Math.round(value)}ms`;
      if (p50 !== null && p95 !== null) {
        return `${round(p50)} p50 / ${round(p95)} p95`;
      }
      return round(p50 ?? p95 ?? 0);
    }
    function formatPercent(value) {
      if (value === null || value === void 0 || Number.isNaN(value)) return "—";
      return `${numberFormatter.format(value)}%`;
    }
    function formatCount(value) {
      if (value === null || value === void 0 || Number.isNaN(value)) return "—";
      return integerFormatter.format(value);
    }
    function relativeTime$1(value) {
      if (!value) return "—";
      const coarse = relativeTime(value);
      return /\d{4}-\d{2}-\d{2}/.test(coarse)
        ? coarse
        : robustRelativeTime(value);
    }
    function formatTimestamp(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString();
    }
    function severityClass(severity) {
      if (!severity) return "severity-neutral";
      const normalized = severity.toLowerCase();
      if (normalized === "critical") return "severity-critical";
      if (normalized === "high") return "severity-high";
      if (normalized === "medium") return "severity-medium";
      if (normalized === "low") return "severity-low";
      return "severity-neutral";
    }
    function activityIcon(event) {
      return mapEventTypeToIcon(event.type);
    }
    const COVERAGE_PLACEHOLDER_ROWS = 5;
    if (
      data.fetchedAt !== lastServerFetchedAt &&
      data.fetchedAt !== lastClientFetchedAt
    ) {
      lastServerFetchedAt = data.fetchedAt;
      state = data;
    }
    coverageControls = state.coverage?.controls ?? [];
    totalEvidence = coverageControls.reduce(
      (total, control) => total + control.evidenceCount,
      0,
    );
    filteredControls = coverageControls;
    controlsWithShare = filteredControls.map((control) => ({
      ...control,
      percent:
        totalEvidence > 0 ? (control.evidenceCount / totalEvidence) * 100 : 0,
    }));
    highPriorityNotifications = (state.notifications ?? []).filter((item) => {
      const severity = item.severity?.toLowerCase();
      return severity === "critical" || severity === "high";
    }).length;
    latencyChips = LATENCY_KEYS.map(({ key, label }) => {
      const latencyMap = state.health?.latency ?? void 0;
      const bucket = latencyMap ? latencyMap[key] : void 0;
      const display = formatLatency(bucket);
      return display ? { label, display } : null;
    }).filter(Boolean);
    $$renderer2.push(
      `<div class="page svelte-qd118l"><header class="page-header svelte-qd118l"><div class="svelte-qd118l"><h1 class="svelte-qd118l">Compliance Dashboard</h1> <p class="timestamp svelte-qd118l">Data captured ${escape_html(
        // Use shared utilities; robustRelativeTime handles future-safe phrasing, fallback to short for long spans.
        // If coarse returns a calendar date (heuristic: contains '-') we keep it; else prefer robust variant for richer semantics.
        // TODO: Add policy/action modals
        // TODO: Integrate evidence drawer
        // TODO: Notifications panel & access requests UI
        // TODO: Add Playwright & Vitest tests
        // TODO: A11y & keyboard navigation enhancements
        formatTimestamp(state.fetchedAt),
      )}</p></div> `,
    );
    if (state.notificationsUnreadCount && state.notificationsUnreadCount > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="notifications-badge svelte-qd118l">Unread: ${escape_html(state.notificationsUnreadCount)}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      if (highPriorityNotifications > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<span class="notifications-badge svelte-qd118l">High priority: ${escape_html(highPriorityNotifications)}</span>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></header> `);
    if (state.partialError) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<div class="alert warning svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Some services did not respond.</strong> <span class="svelte-qd118l">${escape_html(state.partialError)}</span></div></div>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!state.health) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<div class="alert danger svelte-qd118l"><div class="svelte-qd118l"><strong class="svelte-qd118l">Health data unavailable</strong> <p class="svelte-qd118l">We could not reach the compliance health endpoint. Retry to request a fresh snapshot.</p> `,
      );
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(
        `<!--]--></div> <button type="button" class="retry-btn svelte-qd118l"${attr("disabled", refreshing, true)}>${escape_html("Retry")}</button></div>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <section class="metrics-grid svelte-qd118l"><div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Coverage</span> `,
    );
    if (state.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatPercent(state.coverage.coveragePercent))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Open incidents</span> `,
    );
    if (state.incidents && state.incidents.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state.incidents.length))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      if (state.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="metric-value svelte-qd118l">—</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<span class="metric-value svelte-qd118l">${escape_html(formatCount(0))}</span>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Evidence items</span> `,
    );
    if (state.health) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state.health?.evidenceCount))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(
      `<!--]--></div> <div class="metric-card svelte-qd118l"><span class="metric-label svelte-qd118l">Policy templates</span> `,
    );
    if (state.health?.policies) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<span class="metric-value svelte-qd118l">${escape_html(formatCount(state.health?.policies?.templates ?? null))}</span>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(
        `<div class="skeleton skeleton-lg svelte-qd118l"></div>`,
      );
    }
    $$renderer2.push(`<!--]--></div></section> `);
    if (latencyChips.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="latency-chips svelte-qd118l"><!--[-->`);
      const each_array = ensure_array_like(latencyChips);
      for (
        let $$index = 0, $$length = each_array.length;
        $$index < $$length;
        $$index++
      ) {
        let chip = each_array[$$index];
        $$renderer2.push(
          `<span class="latency-chip svelte-qd118l"><span class="chip-label svelte-qd118l">${escape_html(chip.label)}</span> <span class="chip-value svelte-qd118l">${escape_html(chip.display)}</span></span>`,
        );
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--> <div class="content-grid svelte-qd118l"><section class="panel coverage-panel svelte-qd118l"><header class="panel-header svelte-qd118l"><div class="svelte-qd118l"><h2 class="svelte-qd118l">Coverage Controls</h2> `,
    );
    if (state.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(
        `<p class="panel-subtitle svelte-qd118l">${escape_html(formatCount(state.coverage.totalControls))} controls tracked</p>`,
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(
      `<!--]--></div> <input class="filter-input svelte-qd118l" type="search" placeholder="Filter controls"${attr("value", filterValue)}/></header> `,
    );
    if (!state.coverage) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="panel-body svelte-qd118l"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(COVERAGE_PLACEHOLDER_ROWS));
      for (
        let $$index_1 = 0, $$length = each_array_1.length;
        $$index_1 < $$length;
        $$index_1++
      ) {
        each_array_1[$$index_1];
        $$renderer2.push(
          `<div class="table-placeholder-row svelte-qd118l" aria-hidden="true"><div class="skeleton skeleton-line svelte-qd118l"></div></div>`,
        );
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (!controlsWithShare.length) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="panel-body empty svelte-qd118l">No controls match the current filter.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="panel-body scrollable svelte-qd118l"><table class="coverage-table svelte-qd118l"><thead class="svelte-qd118l"><tr class="svelte-qd118l"><th scope="col" class="svelte-qd118l">Control</th><th scope="col" class="numeric svelte-qd118l">Evidence</th><th scope="col" class="numeric svelte-qd118l">% of framework</th></tr></thead><tbody class="svelte-qd118l"><!--[-->`,
        );
        const each_array_2 = ensure_array_like(controlsWithShare);
        for (
          let $$index_2 = 0, $$length = each_array_2.length;
          $$index_2 < $$length;
          $$index_2++
        ) {
          let control = each_array_2[$$index_2];
          $$renderer2.push(
            `<tr class="svelte-qd118l"><td class="svelte-qd118l">${escape_html(control.controlKey)}</td><td class="numeric svelte-qd118l">${escape_html(formatCount(control.evidenceCount))}</td><td class="numeric svelte-qd118l">${escape_html(formatPercent(control.percent))}</td></tr>`,
          );
        }
        $$renderer2.push(`<!--]--></tbody></table></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Open Incidents</h2></header> <div class="panel-body svelte-qd118l">`,
    );
    if (state.incidents && state.incidents.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul class="list svelte-qd118l"><!--[-->`);
      const each_array_3 = ensure_array_like(state.incidents);
      for (
        let $$index_3 = 0, $$length = each_array_3.length;
        $$index_3 < $$length;
        $$index_3++
      ) {
        let incident = each_array_3[$$index_3];
        $$renderer2.push(
          `<li class="list-item incident svelte-qd118l"><span${attr_class(`badge ${severityClass(incident.severity)}`, "svelte-qd118l")}>${escape_html(incident.severity ?? "unknown")}</span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l">${escape_html(incident.title || `Incident ${incident.id}`)}</span> <span class="item-meta svelte-qd118l">${escape_html(relativeTime$1(incident.createdAt))}</span></div></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (state.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">Unable to load incidents right now.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">No open incidents.</div>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(
      `<!--]--></div></section> <section class="panel svelte-qd118l"><header class="panel-header svelte-qd118l"><h2 class="svelte-qd118l">Recent Activity</h2></header> <div class="panel-body svelte-qd118l">`,
    );
    if (state.activity && state.activity.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul class="list svelte-qd118l"><!--[-->`);
      const each_array_4 = ensure_array_like(state.activity);
      for (
        let $$index_4 = 0, $$length = each_array_4.length;
        $$index_4 < $$length;
        $$index_4++
      ) {
        let event = each_array_4[$$index_4];
        $$renderer2.push(
          `<li class="list-item activity svelte-qd118l"><span class="badge badge-muted svelte-qd118l">${escape_html(activityIcon(event))}</span> <div class="item-body svelte-qd118l"><span class="item-title svelte-qd118l">${escape_html(event.message)}</span> <span class="item-meta svelte-qd118l">${escape_html(relativeTime$1(event.createdAt))}</span></div></li>`,
        );
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (state.allFailed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">Activity feed unavailable.</div>`,
        );
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(
          `<div class="empty svelte-qd118l">No activity recorded.</div>`,
        );
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section></div></div>`);
    bind_props($$props, { data });
  });
}
export { _page as default };
//# sourceMappingURL=_page.svelte.js.map
