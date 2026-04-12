<script lang="ts">
  import { onMount } from "svelte";

  interface Incident {
    id: string;
    tenantId: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low" | string;
    status: string;
    source: string | null;
    createdAt: string;
    resolvedAt: string | null;
  }

  const SEVERITIES = ["critical", "high", "medium", "low"] as const;

  let incidents: Incident[] = [];
  let nextCursor: string | null = null;
  let loading = true;
  let loadingMore = false;
  let error: string | null = null;

  let severityFilter = "all";
  let statusFilter = "all";
  let expandedId: string | null = null;

  let showForm = false;
  let formTitle = "";
  let formSeverity: "critical" | "high" | "medium" | "low" = "medium";
  let formSource = "";
  let formError: string | null = null;
  let submitting = false;

  $: total = incidents.length;
  $: openCount = incidents.filter((i) => i.status === "open").length;
  $: resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  function buildUrl(cursor?: string | null): string {
    const p = new URLSearchParams({ limit: "20" });
    if (severityFilter !== "all") p.set("severity", severityFilter);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (cursor) p.set("cursor", cursor);
    return `/api/compliance/api/v1/incidents?${p.toString()}`;
  }

  async function loadIncidents() {
    loading = true;
    error = null;
    incidents = [];
    nextCursor = null;
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`Failed to load incidents (HTTP ${res.status})`);
      const json = await res.json();
      incidents = json.data?.items ?? [];
      nextCursor = json.data?.nextCursor ?? null;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    loadingMore = true;
    try {
      const res = await fetch(buildUrl(nextCursor));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      incidents = [...incidents, ...(json.data?.items ?? [])];
      nextCursor = json.data?.nextCursor ?? null;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loadingMore = false;
    }
  }

  function applyFilters() {
    expandedId = null;
    loadIncidents();
  }

  async function createIncident() {
    if (!formTitle.trim()) return;
    submitting = true;
    formError = null;
    try {
      const body: Record<string, string> = { title: formTitle.trim(), severity: formSeverity };
      if (formSource.trim()) body.source = formSource.trim();
      const res = await fetch("/api/compliance/api/v1/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      formTitle = "";
      formSeverity = "medium";
      formSource = "";
      showForm = false;
      await loadIncidents();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      submitting = false;
    }
  }

  function severityClass(s: string): string {
    switch (s) {
      case "critical": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "high":     return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "medium":   return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      default:         return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  function statusClass(s: string): string {
    switch (s?.toLowerCase()) {
      case "open":          return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "investigating": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "resolved":      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:              return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return `${Math.floor(ms / 60000)}m ago`;
  }

  onMount(loadIncidents);
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Incidents</h1>
      {#if !loading && !error}
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Total: {total} &middot; Open: {openCount} &middot; Resolved: {resolvedCount}
        </p>
      {/if}
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = null; }}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
    >
      New Incident
    </button>
  </div>

  <div class="mb-5 flex flex-wrap items-center gap-3">
    <div class="flex gap-1">
      {#each ["all", ...SEVERITIES] as sev}
        <button
          on:click={() => { severityFilter = sev; applyFilters(); }}
          class="px-3 py-1 text-xs font-medium rounded-full border transition-colors
            {severityFilter === sev
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
        >
          {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
        </button>
      {/each}
    </div>
    <select
      bind:value={statusFilter}
      on:change={applyFilters}
      class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    >
      <option value="all">All statuses</option>
      <option value="open">Open</option>
      <option value="investigating">Investigating</option>
      <option value="resolved">Resolved</option>
    </select>
  </div>

  {#if showForm}
    <div class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">New Incident</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-title">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            id="inc-title"
            type="text"
            bind:value={formTitle}
            placeholder="Brief description of the incident"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-severity">Severity</label>
          <select
            id="inc-severity"
            bind:value={formSeverity}
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each SEVERITIES as s}
              <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            {/each}
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="inc-source">
            Source <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="inc-source"
            type="text"
            bind:value={formSource}
            placeholder="manual"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {#if formError}
        <p class="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      {/if}
      <div class="mt-4 flex gap-2 justify-end">
        <button
          on:click={() => { showForm = false; formError = null; }}
          class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={createIncident}
          disabled={submitting || !formTitle.trim()}
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
        >
          {submitting ? "Creating..." : "Create Incident"}
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3, 4] as _}
        <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={loadIncidents} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if incidents.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">No incidents</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">Click "New Incident" to create one.</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th class="px-5 py-3 font-medium">Title</th>
              <th class="px-5 py-3 font-medium">Severity</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Source</th>
              <th class="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each incidents as inc (inc.id)}
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                on:click={() => { expandedId = expandedId === inc.id ? null : inc.id; }}
              >
                <td class="px-5 py-3 font-medium text-gray-900 dark:text-white">{inc.title}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {severityClass(inc.severity)}">
                    {inc.severity}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {statusClass(inc.status)}">
                    {inc.status}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400">{inc.source ?? "—"}</td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400">{relativeTime(inc.createdAt)}</td>
              </tr>
              {#if expandedId === inc.id}
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td colspan="5" class="px-5 py-4">
                    <dl class="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <div><dt class="font-semibold text-gray-400 uppercase">ID</dt><dd class="font-mono mt-0.5">{inc.id}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Created</dt><dd class="mt-0.5">{new Date(inc.createdAt).toLocaleString()}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Resolved</dt><dd class="mt-0.5">{inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : "—"}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Source</dt><dd class="mt-0.5">{inc.source ?? "—"}</dd></div>
                    </dl>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
      {#if nextCursor}
        <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <button
            on:click={loadMore}
            disabled={loadingMore}
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Show more"}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
