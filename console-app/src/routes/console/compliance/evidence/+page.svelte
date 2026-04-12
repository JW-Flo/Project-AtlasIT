<script lang="ts">
  import { onMount } from "svelte";

  interface EvidenceMeta {
    impact?: "positive" | "neutral" | "negative";
    eventType?: string;
    reasoning?: string;
    confidence?: number;
    auditAction?: string;
    [key: string]: unknown;
  }

  interface EvidenceItem {
    id: string;
    tenantId: string;
    framework: string | null;
    controlId: string | null;
    controlName: string | null;
    evidenceType: string | null;
    source: string | null;
    sourceId: string | null;
    actor: string | null;
    metadata: EvidenceMeta | null;
    createdAt: string;
  }

  const FRAMEWORKS = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"] as const;
  const SOURCES = ["okta", "platform", "adapter", "manual"] as const;
  const IMPACTS = ["positive", "neutral", "negative"] as const;

  let allItems: EvidenceItem[] = [];
  let nextCursor: string | null = null;
  let total = 0;
  let loading = true;
  let loadingMore = false;
  let error: string | null = null;

  let frameworkFilter = "all";
  let sourceFilter = "all";
  let impactFilter = "all";
  let controlSearch = "";
  let expandedId: string | null = null;

  $: filtered = allItems.filter((item) => {
    if (frameworkFilter !== "all" && item.framework !== frameworkFilter) return false;
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
    if (impactFilter !== "all" && (item.metadata?.impact ?? "neutral") !== impactFilter) return false;
    if (controlSearch.trim()) {
      const q = controlSearch.trim().toLowerCase();
      const inId = (item.controlId ?? "").toLowerCase().includes(q);
      const inName = (item.controlName ?? "").toLowerCase().includes(q);
      if (!inId && !inName) return false;
    }
    return true;
  });

  function buildUrl(cursor?: string | null): string {
    const p = new URLSearchParams({ limit: "50" });
    if (cursor) p.set("cursor", cursor);
    return `/api/compliance/api/v1/evidence?${p.toString()}`;
  }

  async function loadEvidence() {
    loading = true;
    error = null;
    allItems = [];
    nextCursor = null;
    total = 0;
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`Failed to load evidence (HTTP ${res.status})`);
      const json = await res.json();
      allItems = json.data?.items ?? [];
      nextCursor = json.data?.nextCursor ?? null;
      total = json.data?.total ?? allItems.length;
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
      allItems = [...allItems, ...(json.data?.items ?? [])];
      nextCursor = json.data?.nextCursor ?? null;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loadingMore = false;
    }
  }

  function impactClass(impact: string | undefined): string {
    switch (impact) {
      case "positive": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "negative": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:         return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return mins > 0 ? `${mins}m ago` : "just now";
  }

  function truncate(s: string | null | undefined, n = 80): string {
    if (!s) return "—";
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  onMount(loadEvidence);
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Compliance Evidence</h1>
    {#if !loading && !error}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Total {total} evidence records &middot; showing {filtered.length} after filters
      </p>
    {/if}
  </div>

  <!-- Filter bar -->
  <div class="mb-5 flex flex-wrap items-center gap-3">
    <!-- Framework filter -->
    <div class="flex gap-1 flex-wrap">
      <button
        on:click={() => { frameworkFilter = "all"; expandedId = null; }}
        class="px-3 py-1 text-xs font-medium rounded-full border transition-colors
          {frameworkFilter === 'all'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
      >All frameworks</button>
      {#each FRAMEWORKS as fw}
        <button
          on:click={() => { frameworkFilter = fw; expandedId = null; }}
          class="px-3 py-1 text-xs font-medium rounded-full border transition-colors
            {frameworkFilter === fw
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
        >{fw}</button>
      {/each}
    </div>

    <!-- Source filter -->
    <select
      bind:value={sourceFilter}
      on:change={() => { expandedId = null; }}
      class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    >
      <option value="all">All sources</option>
      {#each SOURCES as s}
        <option value={s}>{s}</option>
      {/each}
    </select>

    <!-- Impact filter -->
    <select
      bind:value={impactFilter}
      on:change={() => { expandedId = null; }}
      class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    >
      <option value="all">All impacts</option>
      {#each IMPACTS as imp}
        <option value={imp}>{imp}</option>
      {/each}
    </select>

    <!-- Control ID search -->
    <input
      type="text"
      bind:value={controlSearch}
      on:input={() => { expandedId = null; }}
      placeholder="Search control ID…"
      class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <!-- Loading skeleton -->
  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5, 6] as _}
        <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>

  <!-- Error state -->
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button
        on:click={loadEvidence}
        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
      >Retry</button>
    </div>

  <!-- Empty state -->
  {:else if filtered.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
      {#if allItems.length === 0}
        <p class="text-gray-500 dark:text-gray-400 text-sm">No evidence records found.</p>
        <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">Evidence is collected automatically as compliance events flow through the platform.</p>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 text-sm">No records match the current filters.</p>
        <button
          on:click={() => { frameworkFilter = "all"; sourceFilter = "all"; impactFilter = "all"; controlSearch = ""; }}
          class="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >Clear filters</button>
      {/if}
    </div>

  <!-- Table -->
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th class="px-5 py-3 font-medium">Control ID</th>
              <th class="px-5 py-3 font-medium">Framework</th>
              <th class="px-5 py-3 font-medium">Event Type</th>
              <th class="px-5 py-3 font-medium">Impact</th>
              <th class="px-5 py-3 font-medium">Source</th>
              <th class="px-5 py-3 font-medium">Actor</th>
              <th class="px-5 py-3 font-medium">Reasoning</th>
              <th class="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filtered as item (item.id)}
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                on:click={() => { expandedId = expandedId === item.id ? null : item.id; }}
              >
                <td class="px-5 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {item.controlId ?? "—"}
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">
                  {item.framework ?? "—"}
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                  {item.metadata?.eventType ?? item.evidenceType ?? "—"}
                </td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {impactClass(item.metadata?.impact)}">
                    {item.metadata?.impact ?? "neutral"}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {item.source ?? "—"}
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[120px] truncate" title={item.actor ?? ""}>
                  {item.actor ?? "—"}
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px]">
                  {truncate(item.metadata?.reasoning)}
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {relativeTime(item.createdAt)}
                </td>
              </tr>

              {#if expandedId === item.id}
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td colspan="8" class="px-5 py-4">
                    <div class="grid gap-4 sm:grid-cols-2">
                      <dl class="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">ID</dt>
                          <dd class="font-mono mt-0.5 break-all">{item.id}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Control</dt>
                          <dd class="mt-0.5">{item.controlId ?? "—"} {item.controlName ? `— ${item.controlName}` : ""}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Framework</dt>
                          <dd class="mt-0.5">{item.framework ?? "—"}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Evidence Type</dt>
                          <dd class="mt-0.5">{item.evidenceType ?? "—"}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Source / Source ID</dt>
                          <dd class="mt-0.5">{item.source ?? "—"}{item.sourceId ? ` · ${item.sourceId}` : ""}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Actor</dt>
                          <dd class="mt-0.5">{item.actor ?? "—"}</dd>
                        </div>
                        <div>
                          <dt class="font-semibold text-gray-400 uppercase text-[10px]">Created</dt>
                          <dd class="mt-0.5">{new Date(item.createdAt).toLocaleString()}</dd>
                        </div>
                        {#if item.metadata?.confidence !== undefined}
                          <div>
                            <dt class="font-semibold text-gray-400 uppercase text-[10px]">Confidence</dt>
                            <dd class="mt-0.5">{Math.round((item.metadata.confidence as number) * 100)}%</dd>
                          </div>
                        {/if}
                        {#if item.metadata?.auditAction}
                          <div>
                            <dt class="font-semibold text-gray-400 uppercase text-[10px]">Audit Action</dt>
                            <dd class="mt-0.5">{item.metadata.auditAction}</dd>
                          </div>
                        {/if}
                      </dl>
                      <div>
                        <dt class="font-semibold text-gray-400 uppercase text-[10px] text-xs">Full Metadata</dt>
                        <pre class="mt-1 text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-auto max-h-48 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">{JSON.stringify(item.metadata, null, 2)}</pre>
                      </div>
                    </div>
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
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
