<script lang="ts">
  import { onMount } from "svelte";

  interface AuditRow {
    id: string;
    actorId: string;
    actorType: string;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    correlationId: string | null;
    createdAt: string;
  }

  let items: AuditRow[] = [];
  let nextCursor: string | null = null;
  let total = 0;
  let facets: { actions: string[]; resourceTypes: string[] } = { actions: [], resourceTypes: [] };
  let loading = true;
  let loadingMore = false;
  let error: string | null = null;

  let actorFilter = "";
  let actionFilter = "";
  let resourceTypeFilter = "";

  let expandedId: string | null = null;

  function buildUrl(cursor?: string | null): string {
    const p = new URLSearchParams({ limit: "50" });
    if (actorFilter) p.set("actorId", actorFilter);
    if (actionFilter) p.set("action", actionFilter);
    if (resourceTypeFilter) p.set("resourceType", resourceTypeFilter);
    if (cursor) p.set("cursor", cursor);
    return `/api/v1/audit-log?${p.toString()}`;
  }

  async function load() {
    loading = true;
    error = null;
    items = [];
    nextCursor = null;
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      items = j.data?.items ?? [];
      nextCursor = j.data?.nextCursor ?? null;
      total = j.data?.total ?? 0;
      facets = j.data?.facets ?? { actions: [], resourceTypes: [] };
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
      const j = await res.json();
      items = [...items, ...(j.data?.items ?? [])];
      nextCursor = j.data?.nextCursor ?? null;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loadingMore = false;
    }
  }

  function applyFilters() {
    expandedId = null;
    load();
  }

  function clearFilters() {
    actorFilter = "";
    actionFilter = "";
    resourceTypeFilter = "";
    applyFilters();
  }

  onMount(load);

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return mins > 0 ? `${mins}m ago` : "just now";
  }

  function actionColor(action: string): string {
    const prefix = action.split(".")[0];
    const map: Record<string, string> = {
      tenant: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      user: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      policy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      incident: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      access_request: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      compliance_pack: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
      integration: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return map[prefix] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }

  function actorTypeColor(type: string): string {
    switch (type) {
      case "user":    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "system":  return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
      case "api_key": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      default:        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  }
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
    {#if !loading && !error}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} total events · tenant-scoped · immutable
      </p>
    {/if}
  </div>

  <div class="mb-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-end gap-3">
    <div class="flex-1 min-w-[200px]">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" for="f-actor">Actor</label>
      <input
        id="f-actor"
        type="text"
        bind:value={actorFilter}
        placeholder="user_id, email, or 'system'"
        class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div class="flex-1 min-w-[200px]">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" for="f-action">Action</label>
      <input
        id="f-action"
        type="text"
        bind:value={actionFilter}
        placeholder="e.g. policy.created"
        list="action-list"
        class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <datalist id="action-list">
        {#each facets.actions as a}<option value={a}>{a}</option>{/each}
      </datalist>
    </div>
    <div class="min-w-[180px]">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" for="f-rt">Resource type</label>
      <select
        id="f-rt"
        bind:value={resourceTypeFilter}
        class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
      >
        <option value="">Any</option>
        {#each facets.resourceTypes as rt}<option value={rt}>{rt}</option>{/each}
      </select>
    </div>
    <button
      on:click={applyFilters}
      class="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
    >
      Apply
    </button>
    {#if actorFilter || actionFilter || resourceTypeFilter}
      <button
        on:click={clearFilters}
        class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
      >
        Clear
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if items.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">No audit events match your filters.</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th class="px-5 py-3 font-medium">Action</th>
              <th class="px-5 py-3 font-medium">Actor</th>
              <th class="px-5 py-3 font-medium">Resource</th>
              <th class="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each items as row (row.id)}
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                on:click={() => { expandedId = expandedId === row.id ? null : row.id; }}
              >
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {actionColor(row.action)}">
                    {row.action}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-900 dark:text-white">
                  <span class="inline-flex items-center px-2 py-0.5 mr-2 rounded-full text-[10px] font-medium uppercase {actorTypeColor(row.actorType)}">
                    {row.actorType}
                  </span>
                  <span class="font-mono text-xs">{row.actorId}</span>
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs">
                  {#if row.resourceType}
                    <span class="font-mono">{row.resourceType}</span>
                    {#if row.resourceId}<span class="text-gray-400"> · {row.resourceId.slice(0, 8)}…</span>{/if}
                  {:else}
                    <span class="text-gray-400">—</span>
                  {/if}
                </td>
                <td class="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {relativeTime(row.createdAt)}
                </td>
              </tr>
              {#if expandedId === row.id}
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td colspan="4" class="px-5 py-4">
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div><dt class="font-semibold text-gray-400 uppercase">ID</dt><dd class="font-mono mt-0.5 text-gray-700 dark:text-gray-300">{row.id}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Correlation ID</dt><dd class="font-mono mt-0.5 text-gray-700 dark:text-gray-300">{row.correlationId ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Resource ID</dt><dd class="font-mono mt-0.5 text-gray-700 dark:text-gray-300 break-all">{row.resourceId ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">IP</dt><dd class="font-mono mt-0.5 text-gray-700 dark:text-gray-300">{row.ipAddress ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-gray-400 uppercase">Timestamp</dt><dd class="mt-0.5 text-gray-700 dark:text-gray-300">{new Date(row.createdAt).toLocaleString()}</dd></div>
                    </dl>
                    {#if row.details}
                      <div class="mt-3">
                        <dt class="text-xs font-semibold text-gray-400 uppercase">Details</dt>
                        <pre class="mt-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300">{JSON.stringify(row.details, null, 2)}</pre>
                      </div>
                    {/if}
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
