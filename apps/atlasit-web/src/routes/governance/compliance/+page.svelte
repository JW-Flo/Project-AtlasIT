<script lang="ts">
  import { browser } from "$app/environment";
  import type {
    ComplianceDashboardData,
    CoverageControl,
    ActivityEvent,
  } from "$lib/api/types";
  import type { NormalizedApiError } from "$lib/api/client";
  import {
    relativeTime as shortRelativeTime,
    robustRelativeTime,
  } from "$lib/utils/relativeTime";

  export let data: ComplianceDashboardData;

  let state: ComplianceDashboardData = data;
  let lastServerFetchedAt = data.fetchedAt;
  let lastClientFetchedAt = data.fetchedAt;
  let refreshing = false;
  let refreshError: string | null = null;

  let coverageControls: CoverageControl[] = [];
  let filteredControls: CoverageControl[] = [];
  let controlsWithShare: Array<CoverageControl & { percent: number }> = [];
  let totalEvidence = 0;
  let filterValue = "";
  let debouncedFilter = "";

  const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  });
  const integerFormatter = new Intl.NumberFormat("en-US");
  const LATENCY_KEYS = [
    { key: "workflowExecute", label: "Workflow Execute" },
    { key: "policyGenerate", label: "Policy Generate" },
    { key: "policyEvaluate", label: "Policy Evaluate" },
  ] as const;

  const debounce = <T extends (...args: any[]) => void>(fn: T, wait = 150) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  const applyFilter = debounce((value: string) => {
    debouncedFilter = value.trim().toLowerCase();
  }, 150);

  function onFilterInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    filterValue = value;
    applyFilter(filterValue);
  }

  $: if (
    data.fetchedAt !== lastServerFetchedAt &&
    data.fetchedAt !== lastClientFetchedAt
  ) {
    lastServerFetchedAt = data.fetchedAt;
    state = data;
  }

  $: coverageControls = state.coverage?.controls ?? [];
  $: totalEvidence = coverageControls.reduce(
    (total, control) => total + control.evidenceCount,
    0
  );
  $: filteredControls = debouncedFilter
    ? coverageControls.filter((control) =>
        control.controlKey.toLowerCase().includes(debouncedFilter)
      )
    : coverageControls;
  $: controlsWithShare = filteredControls.map((control) => ({
    ...control,
    percent:
      totalEvidence > 0 ? (control.evidenceCount / totalEvidence) * 100 : 0,
  }));

  $: highPriorityNotifications = (state.notifications ?? []).filter((item) => {
    const severity = item.severity?.toLowerCase();
    return severity === "critical" || severity === "high";
  }).length;

  $: latencyChips = LATENCY_KEYS.map(({ key, label }) => {
    const latencyMap = state.health?.latency ?? undefined;
    const bucket = latencyMap
      ? (latencyMap as Record<string, any>)[key]
      : undefined;
    const display = formatLatency(bucket);
    return display ? { label, display } : null;
  }).filter(Boolean) as Array<{ label: string; display: string }>;

  function formatLatency(bucket: any): string | null {
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
    const round = (value: number) => `${Math.round(value)}ms`;
    if (p50 !== null && p95 !== null) {
      return `${round(p50)} p50 / ${round(p95)} p95`;
    }
    return round(p50 ?? p95 ?? 0);
  }

  function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value))
      return "—";
    return `${numberFormatter.format(value)}%`;
  }

  function formatCount(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value))
      return "—";
    return integerFormatter.format(value);
  }

  // Use shared utilities; robustRelativeTime handles future-safe phrasing, fallback to short for long spans.
  function relativeTime(value: string | null | undefined): string {
    if (!value) return "—";
    const coarse = shortRelativeTime(value);
    // If coarse returns a calendar date (heuristic: contains '-') we keep it; else prefer robust variant for richer semantics.
    return /\d{4}-\d{2}-\d{2}/.test(coarse)
      ? coarse
      : robustRelativeTime(value);
  }

  function formatTimestamp(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function severityClass(severity?: string | null): string {
    if (!severity) return "severity-neutral";
    const normalized = severity.toLowerCase();
    if (normalized === "critical") return "severity-critical";
    if (normalized === "high") return "severity-high";
    if (normalized === "medium") return "severity-medium";
    if (normalized === "low") return "severity-low";
    return "severity-neutral";
  }

  import { mapEventTypeToIcon } from "$lib/utils/iconMaps";
  function activityIcon(event: ActivityEvent): string {
    return mapEventTypeToIcon(event.type);
  }

  function isNormalizedError(error: unknown): error is NormalizedApiError {
    return (
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error
    );
  }

  async function refresh() {
    if (!browser || refreshing) return;
    refreshing = true;
    refreshError = null;
    try {
      const res = await fetch(`${window.location.pathname}.json`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
        );
      }
      const json = (await res.json()) as ComplianceDashboardData;
      state = json;
      lastClientFetchedAt = json.fetchedAt;
    } catch (error) {
      refreshError = isNormalizedError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unable to refresh";
    } finally {
      refreshing = false;
    }
  }

  const COVERAGE_PLACEHOLDER_ROWS = 5;

  // TODO: Add policy/action modals
  // TODO: Integrate evidence drawer
  // TODO: Notifications panel & access requests UI
  // TODO: Add Playwright & Vitest tests
  // TODO: A11y & keyboard navigation enhancements
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>Compliance Dashboard</h1>
      <p class="timestamp">Data captured {formatTimestamp(state.fetchedAt)}</p>
    </div>
    {#if state.notificationsUnreadCount && state.notificationsUnreadCount > 0}
      <span class="notifications-badge"
        >Unread: {state.notificationsUnreadCount}</span
      >
    {:else if highPriorityNotifications > 0}
      <span class="notifications-badge"
        >High priority: {highPriorityNotifications}</span
      >
    {/if}
  </header>

  {#if state.partialError}
    <div class="alert warning">
      <div>
        <strong>Some services did not respond.</strong>
        <span>{state.partialError}</span>
      </div>
    </div>
  {/if}

  {#if !state.health}
    <div class="alert danger">
      <div>
        <strong>Health data unavailable</strong>
        <p>
          We could not reach the compliance health endpoint. Retry to request a
          fresh snapshot.
        </p>
        {#if refreshError}
          <p class="detail">{refreshError}</p>
        {/if}
      </div>
      <button
        type="button"
        class="retry-btn"
        on:click={refresh}
        disabled={refreshing}
      >
        {refreshing ? "Retrying..." : "Retry"}
      </button>
    </div>
  {/if}

  <section class="metrics-grid">
    <div class="metric-card">
      <span class="metric-label">Coverage</span>
      {#if state.coverage}
        <span class="metric-value"
          >{formatPercent(state.coverage.coveragePercent)}</span
        >
      {:else}
        <div class="skeleton skeleton-lg"></div>
      {/if}
    </div>
    <div class="metric-card">
      <span class="metric-label">Open incidents</span>
      {#if state.incidents && state.incidents.length}
        <span class="metric-value">{formatCount(state.incidents.length)}</span>
      {:else if state.allFailed}
        <span class="metric-value">—</span>
      {:else}
        <span class="metric-value">{formatCount(0)}</span>
      {/if}
    </div>
    <div class="metric-card">
      <span class="metric-label">Evidence items</span>
      {#if state.health}
        <span class="metric-value"
          >{formatCount(state.health?.evidenceCount)}</span
        >
      {:else}
        <div class="skeleton skeleton-lg"></div>
      {/if}
    </div>
    <div class="metric-card">
      <span class="metric-label">Policy templates</span>
      {#if state.health?.policies}
        <span class="metric-value"
          >{formatCount(state.health?.policies?.templates ?? null)}</span
        >
      {:else}
        <div class="skeleton skeleton-lg"></div>
      {/if}
    </div>
  </section>

  {#if latencyChips.length}
    <div class="latency-chips">
      {#each latencyChips as chip}
        <span class="latency-chip">
          <span class="chip-label">{chip.label}</span>
          <span class="chip-value">{chip.display}</span>
        </span>
      {/each}
    </div>
  {/if}

  <div class="content-grid">
    <section class="panel coverage-panel">
      <header class="panel-header">
        <div>
          <h2>Coverage Controls</h2>
          {#if state.coverage}
            <p class="panel-subtitle">
              {formatCount(state.coverage.totalControls)} controls tracked
            </p>
          {/if}
        </div>
        <input
          class="filter-input"
          type="search"
          placeholder="Filter controls"
          bind:value={filterValue}
          on:input={onFilterInput}
        />
      </header>

      {#if !state.coverage}
        <div class="panel-body">
          {#each Array(COVERAGE_PLACEHOLDER_ROWS) as _}
            <div class="table-placeholder-row" aria-hidden="true">
              <div class="skeleton skeleton-line"></div>
            </div>
          {/each}
        </div>
      {:else if !controlsWithShare.length}
        <div class="panel-body empty">
          No controls match the current filter.
        </div>
      {:else}
        <div class="panel-body scrollable">
          <table class="coverage-table">
            <thead>
              <tr>
                <th scope="col">Control</th>
                <th scope="col" class="numeric">Evidence</th>
                <th scope="col" class="numeric">% of framework</th>
              </tr>
            </thead>
            <tbody>
              {#each controlsWithShare as control (control.controlKey)}
                <tr>
                  <td>{control.controlKey}</td>
                  <td class="numeric">{formatCount(control.evidenceCount)}</td>
                  <td class="numeric">{formatPercent(control.percent)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="panel">
      <header class="panel-header">
        <h2>Open Incidents</h2>
      </header>
      <div class="panel-body">
        {#if state.incidents && state.incidents.length}
          <ul class="list">
            {#each state.incidents as incident (incident.id)}
              <li class="list-item incident">
                <span class={`badge ${severityClass(incident.severity)}`}
                  >{incident.severity ?? "unknown"}</span
                >
                <div class="item-body">
                  <span class="item-title"
                    >{incident.title || `Incident ${incident.id}`}</span
                  >
                  <span class="item-meta"
                    >{relativeTime(incident.createdAt)}</span
                  >
                </div>
              </li>
            {/each}
          </ul>
        {:else if state.allFailed}
          <div class="empty">Unable to load incidents right now.</div>
        {:else}
          <div class="empty">No open incidents.</div>
        {/if}
      </div>
    </section>

    <section class="panel">
      <header class="panel-header">
        <h2>Recent Activity</h2>
      </header>
      <div class="panel-body">
        {#if state.activity && state.activity.length}
          <ul class="list">
            {#each state.activity as event (event.id)}
              <li class="list-item activity">
                <span class="badge badge-muted">{activityIcon(event)}</span>
                <div class="item-body">
                  <span class="item-title">{event.message}</span>
                  <span class="item-meta">{relativeTime(event.createdAt)}</span>
                </div>
              </li>
            {/each}
          </ul>
        {:else if state.allFailed}
          <div class="empty">Activity feed unavailable.</div>
        {:else}
          <div class="empty">No activity recorded.</div>
        {/if}
      </div>
    </section>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.75rem;
  }

  .page-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .timestamp {
    color: #9ca3af;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .notifications-badge {
    background: #1f2937;
    border: 1px solid #f97316;
    color: #f97316;
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .metrics-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .metric-card {
    background: #1e1e1e;
    border: 1px solid #2d2d2d;
    border-radius: 8px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9ca3af;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .latency-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .latency-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
    color: #d1d5db;
  }

  .latency-chip .chip-label {
    font-weight: 500;
    color: #f9fafb;
  }

  .latency-chip .chip-value {
    color: #9ca3af;
  }

  .content-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .coverage-panel {
    grid-column: 1 / -1;
  }

  .panel {
    background: #111;
    border: 1px solid #1f2933;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #1f2933;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1rem;
  }

  .panel-subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .panel-body {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .panel-body.scrollable {
    max-height: 22rem;
    overflow-y: auto;
  }

  .filter-input {
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #e5e7eb;
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    width: 220px;
    font-size: 0.85rem;
  }

  .filter-input:focus {
    outline: 2px solid #2563eb;
    outline-offset: 1px;
  }

  .coverage-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 100%;
  }

  .coverage-table th,
  .coverage-table td {
    text-align: left;
    padding: 0.55rem 0.35rem;
    border-bottom: 1px solid #1f2933;
    font-size: 0.85rem;
  }

  .coverage-table th {
    color: #9ca3af;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
  }

  .coverage-table td.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .coverage-table tbody tr:hover {
    background: #131c2b;
  }

  .table-placeholder-row {
    display: flex;
    gap: 1rem;
    padding: 0.35rem 0;
  }

  .table-placeholder-row .skeleton {
    height: 1.25rem;
    flex: 1;
  }

  .alert {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border-radius: 8px;
    border: 1px solid;
    font-size: 0.9rem;
  }

  .alert strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .alert.warning {
    background: #2f2612;
    border-color: #f59e0b;
    color: #fcd34d;
  }

  .alert.danger {
    background: #331414;
    border-color: #f87171;
    color: #fecaca;
  }

  .alert .detail {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .retry-btn {
    background: #ef4444;
    border: none;
    color: #fff;
    border-radius: 6px;
    padding: 0.45rem 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }

  .retry-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .list-item .badge {
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .badge-muted {
    background: #1f2937;
    color: #9ca3af;
    border: 1px solid #273549;
  }

  .item-body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .item-title {
    font-size: 0.9rem;
    color: #f9fafb;
  }

  .item-meta {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .severity-critical {
    background: #7f1d1d;
    color: #fecaca;
    border: 1px solid #f87171;
  }

  .severity-high {
    background: #7c2d12;
    color: #fcd34d;
    border: 1px solid #f97316;
  }

  .severity-medium {
    background: #3f3d1d;
    color: #fef3c7;
    border: 1px solid #eab308;
  }

  .severity-low {
    background: #1e3a8a;
    color: #bfdbfe;
    border: 1px solid #3b82f6;
  }

  .severity-neutral {
    background: #1f2937;
    color: #d1d5db;
    border: 1px solid #334155;
  }

  .empty {
    color: #9ca3af;
    font-size: 0.85rem;
    padding: 0.5rem 0;
  }

  .panel-body.empty {
    padding: 2rem 1.25rem;
    text-align: center;
  }

  .skeleton {
    position: relative;
    overflow: hidden;
    background: #1f2937;
    border-radius: 4px;
  }

  .skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.12) 45%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-100%);
    animation: shimmer 1.4s infinite;
  }

  .skeleton-line {
    height: 1rem;
    width: 100%;
  }

  .skeleton-lg {
    height: 1.8rem;
    width: 70%;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  @media (max-width: 960px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .metrics-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .filter-input {
      width: 100%;
    }

    .panel-header {
      align-items: stretch;
    }

    .notifications-badge {
      width: 100%;
      text-align: center;
    }
  }
</style>
