<script lang="ts">
  import { onMount } from "svelte";
  import { relativeTime } from "$lib/utils/time";

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
      const raw = j.data?.items ?? [];
      items = raw.map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ''),
        actorId: String(r.actor_id ?? r.actorId ?? ''),
        actorType: String(r.actor_type ?? r.actorType ?? ''),
        action: String(r.action ?? ''),
        resourceType: (r.resource_type ?? r.resourceType ?? null) as string | null,
        resourceId: (r.resource_id ?? r.resourceId ?? null) as string | null,
        details: (r.details ?? null) as Record<string, unknown> | null,
        ipAddress: (r.ip_address ?? r.ipAddress ?? null) as string | null,
        correlationId: (r.correlation_id ?? r.correlationId ?? null) as string | null,
        createdAt: String(r.created_at ?? r.createdAt ?? ''),
      }));
      nextCursor = j.data?.nextCursor ?? j.data?.next_cursor ?? null;
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
      const raw = j.data?.items ?? [];
      const mapped = raw.map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ''),
        actorId: String(r.actor_id ?? r.actorId ?? ''),
        actorType: String(r.actor_type ?? r.actorType ?? ''),
        action: String(r.action ?? ''),
        resourceType: (r.resource_type ?? r.resourceType ?? null) as string | null,
        resourceId: (r.resource_id ?? r.resourceId ?? null) as string | null,
        details: (r.details ?? null) as Record<string, unknown> | null,
        ipAddress: (r.ip_address ?? r.ipAddress ?? null) as string | null,
        correlationId: (r.correlation_id ?? r.correlationId ?? null) as string | null,
        createdAt: String(r.created_at ?? r.createdAt ?? ''),
      }));
      items = [...items, ...mapped];
      nextCursor = j.data?.nextCursor ?? j.data?.next_cursor ?? null;
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

  function actionColor(action: string): string {
    const prefix = action.split(".")[0];
    const map: Record<string, string> = {
      tenant: "bg-info-muted text-info",
      user: "bg-info-muted text-info",
      policy: "bg-primary-muted text-primary",
      incident: "bg-warning-muted text-warning",
      access_request: "bg-success-muted text-success",
      compliance_pack: "bg-info-muted text-info",
      integration: "bg-warning-muted text-warning",
    };
    return map[prefix] ?? "bg-muted text-muted-foreground";
  }

  function actorTypeColor(type: string): string {
    switch (type) {
      case "user":    return "bg-info-muted text-info";
      case "system":  return "bg-muted text-muted-foreground";
      case "api_key": return "bg-primary-muted text-primary";
      default:        return "bg-muted text-muted-foreground";
    }
  }
</script>

<div class="animate-fade-in">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Audit Log</h1>
    {#if !loading && !error}
      <p class="mt-1 text-sm text-muted-foreground">
        {total.toLocaleString()} total events · tenant-scoped · immutable
      </p>
    {/if}
  </div>

  <div class="mb-5 bg-card border border-border rounded-lg p-4 flex flex-wrap items-end gap-3">
    <div class="flex-1 min-w-[200px]">
      <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-actor">Actor</label>
      <input
        id="f-actor"
        type="text"
        bind:value={actorFilter}
        placeholder="user_id, email, or 'system'"
        class="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
    <div class="flex-1 min-w-[200px]">
      <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-action">Action</label>
      <input
        id="f-action"
        type="text"
        bind:value={actionFilter}
        placeholder="e.g. policy.created"
        list="action-list"
        class="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <datalist id="action-list">
        {#each facets.actions as a}<option value={a}>{a}</option>{/each}
      </datalist>
    </div>
    <div class="min-w-[180px]">
      <label class="block text-xs font-medium text-muted-foreground mb-1" for="f-rt">Resource type</label>
      <select
        id="f-rt"
        bind:value={resourceTypeFilter}
        class="w-full px-3 py-1.5 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground/80"
      >
        <option value="">Any</option>
        {#each facets.resourceTypes as rt}<option value={rt}>{rt}</option>{/each}
      </select>
    </div>
    <button
      on:click={applyFilters}
      class="px-4 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium"
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
        <div class="h-14 bg-muted rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if items.length === 0}
    <div class="bg-card border border-dashed border-input rounded-lg p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="font-semibold text-foreground mb-1">No audit events found</p>
      <p class="text-muted-foreground text-sm">No events match your current filters. Try adjusting your search criteria.</p>
    </div>
  {:else}
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                <td class="px-5 py-3 text-foreground">
                  <span class="inline-flex items-center px-2 py-0.5 mr-2 rounded-full text-[10px] font-medium uppercase {actorTypeColor(row.actorType)}">
                    {row.actorType}
                  </span>
                  <span class="font-mono text-xs">{row.actorId}</span>
                </td>
                <td class="px-5 py-3 text-foreground/80 text-xs">
                  {#if row.resourceType}
                    <span class="font-mono">{row.resourceType}</span>
                    {#if row.resourceId}<span class="text-muted-foreground/70"> · {row.resourceId.slice(0, 8)}…</span>{/if}
                  {:else}
                    <span class="text-muted-foreground/70">—</span>
                  {/if}
                </td>
                <td class="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {relativeTime(row.createdAt)}
                </td>
              </tr>
              {#if expandedId === row.id}
                <tr class="bg-gray-50 dark:bg-gray-700/30">
                  <td colspan="4" class="px-5 py-4">
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div><dt class="font-semibold text-muted-foreground/70 uppercase">ID</dt><dd class="font-mono mt-0.5 text-foreground/80">{row.id}</dd></div>
                      <div><dt class="font-semibold text-muted-foreground/70 uppercase">Correlation ID</dt><dd class="font-mono mt-0.5 text-foreground/80">{row.correlationId ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-muted-foreground/70 uppercase">Resource ID</dt><dd class="font-mono mt-0.5 text-foreground/80 break-all">{row.resourceId ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-muted-foreground/70 uppercase">IP</dt><dd class="font-mono mt-0.5 text-foreground/80">{row.ipAddress ?? "—"}</dd></div>
                      <div><dt class="font-semibold text-muted-foreground/70 uppercase">Timestamp</dt><dd class="mt-0.5 text-foreground/80">{new Date(row.createdAt).toLocaleString()}</dd></div>
                    </dl>
                    {#if row.details}
                      <div class="mt-3">
                        <dt class="text-xs font-semibold text-muted-foreground/70 uppercase">Details</dt>
                        <pre class="mt-1 text-xs bg-white dark:bg-gray-900 border border-border rounded p-3 overflow-x-auto text-foreground/80">{JSON.stringify(row.details, null, 2)}</pre>
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
        <div class="border-t border-border px-5 py-3">
          <button
            on:click={loadMore}
            disabled={loadingMore}
            class="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Show more"}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
