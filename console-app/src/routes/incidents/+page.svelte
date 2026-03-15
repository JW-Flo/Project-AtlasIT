<script lang="ts">
  import {
    listIncidents,
    createIncident,
    resolveIncident,
  } from "$lib/api/incidents";
  import { onMount } from "svelte";
  import type { IncidentRecord } from "$lib/api/types";
  let items: IncidentRecord[] = [];
  let loading = true;
  let error: string | null = null;
  let nextCursor: number | null = null;
  let form = { title: "", severity: "medium", source: "" };
  let submitting = false;
  async function load(reset = false) {
    try {
      const data = await listIncidents({
        cursor: reset ? undefined : nextCursor || undefined,
        limit: 25,
      });
      if (reset) items = data.items;
      else items = [...items, ...data.items];
      nextCursor = data.nextCursor ?? null;
    } catch (e: any) {
      error = e?.message || "Failed";
    } finally {
      loading = false;
    }
  }
  onMount(() => { load(true); });
  async function submit() {
    if (!form.title) return;
    submitting = true;
    error = null;
    try {
      const created = await createIncident({
        title: form.title,
        severity: form.severity,
        source: form.source || undefined,
      });
      items = [created, ...items];
      form = { ...form, title: "", source: "" };
    } catch (e: any) {
      error = e?.message || "Create failed";
    } finally {
      submitting = false;
    }
  }
  async function actResolve(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    items = items.map((i) =>
      i.id === id
        ? { ...i, status: "resolved", resolvedAt: new Date().toISOString() }
        : i
    );
    try {
      const updated = await resolveIncident(id);
      items = items.map((i) => (i.id === id ? updated : i));
    } catch {
      items = items.map((i) => (i.id === id ? prev : i));
    }
  }

  function severityBadge(s: string): string {
    switch (s) {
      case "critical": return "bg-red-600/20 text-red-300 border-red-500/30";
      case "high": return "bg-orange-600/20 text-orange-300 border-orange-500/30";
      case "medium": return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30";
      case "low": return "bg-blue-600/20 text-blue-300 border-blue-500/30";
      default: return "bg-neutral-600/20 text-neutral-300 border-neutral-500/30";
    }
  }
</script>

<div class="p-6 max-w-5xl mx-auto flex flex-col gap-6">
  <h1 class="text-2xl font-semibold">Incidents</h1>

  <!-- Create Form -->
  <div class="bg-[#1a2332] border border-white/10 rounded-lg p-4 flex flex-col gap-3">
    <h2 class="text-sm font-medium text-white/70">Create Incident</h2>
    <div class="flex gap-2 flex-wrap items-end">
      <div class="flex flex-col gap-1">
        <label for="inc-title" class="text-xs text-white/50">Title *</label>
        <input
          id="inc-title"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          placeholder="Incident title"
          bind:value={form.title}
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="inc-severity" class="text-xs text-white/50">Severity</label>
        <select
          id="inc-severity"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500"
          bind:value={form.severity}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label for="inc-source" class="text-xs text-white/50">Source</label>
        <input
          id="inc-source"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          placeholder="Optional"
          bind:value={form.source}
        />
      </div>
      <button
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        disabled={submitting || !form.title}
        on:click={submit}>{submitting ? "Creating..." : "Create"}</button
      >
    </div>
  </div>

  {#if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-3">{error}</div>
  {/if}

  {#if loading}
    <div class="text-sm text-white/40">Loading...</div>
  {:else if items.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
      <svg class="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.834-2.694-.834-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p class="text-sm">No incidents recorded</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead class="text-white/50 border-b border-white/10">
          <tr>
            <th class="p-2 text-left">ID</th>
            <th class="p-2 text-left">Title</th>
            <th class="p-2 text-left">Severity</th>
            <th class="p-2 text-left">Status</th>
            <th class="p-2 text-left">Created</th>
            <th class="p-2 text-left">Resolved</th>
            <th class="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as inc}
            <tr class="border-t border-white/5 hover:bg-white/[0.02]">
              <td class="p-2 text-white/60">{inc.id}</td>
              <td class="p-2 text-white/90">{inc.title}</td>
              <td class="p-2">
                <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border {severityBadge(inc.severity)}">
                  {inc.severity}
                </span>
              </td>
              <td class="p-2">
                <span class="text-xs {inc.status === 'open' ? 'text-yellow-400' : 'text-green-400'}">
                  {inc.status}
                </span>
              </td>
              <td class="p-2 text-white/50">{new Date(inc.createdAt).toLocaleString()}</td>
              <td class="p-2 text-white/50">{inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : "—"}</td>
              <td class="p-2">
                {#if inc.status === "open"}
                  <button
                    class="px-2 py-0.5 bg-green-600 hover:bg-green-500 rounded text-white text-xs"
                    on:click={() => actResolve(inc.id)}>Resolve</button
                  >
                {:else}
                  <span class="text-white/30">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if nextCursor}
      <button
        class="mt-2 text-sm bg-[#1a2332] border border-white/10 px-3 py-1.5 rounded text-white/70 hover:bg-white/5"
        on:click={() => load(false)}>Load More</button
      >
    {/if}
  {/if}
</div>
