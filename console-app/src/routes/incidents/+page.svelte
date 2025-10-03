<script lang="ts">
  import {
    listIncidents,
    createIncident,
    resolveIncident,
  } from "$lib/api/incidents";
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
  load(true);
  async function submit() {
    if (!form.title) return;
    submitting = true;
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
</script>

<div class="p-6 max-w-5xl mx-auto flex flex-col gap-6">
  <h1 class="text-2xl font-semibold">Incidents</h1>
  <div
    class="bg-neutral-900 border border-neutral-700 rounded p-4 flex flex-col gap-3"
  >
    <div class="flex gap-2 flex-wrap">
      <input
        class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm"
        placeholder="Title"
        bind:value={form.title}
      />
      <select
        class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm"
        bind:value={form.severity}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input
        class="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-sm"
        placeholder="Source (optional)"
        bind:value={form.source}
      />
      <button
        class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
        disabled={submitting}
        on:click={submit}>{submitting ? "…" : "Create"}</button
      >
    </div>
  </div>
  {#if loading}
    <div class="text-sm text-neutral-400">Loading…</div>
  {:else if error}
    <div class="text-sm text-red-400">{error}</div>
  {:else}
    <table class="w-full text-xs border-collapse">
      <thead class="text-neutral-400">
        <tr
          ><th class="p-2 text-left">ID</th><th class="p-2 text-left">Title</th
          ><th class="p-2 text-left">Severity</th><th class="p-2 text-left"
            >Status</th
          ><th class="p-2 text-left">Created</th><th class="p-2 text-left"
            >Resolved</th
          ><th class="p-2 text-left">Actions</th></tr
        >
      </thead>
      <tbody>
        {#each items as inc}
          <tr class="border-t border-neutral-800">
            <td class="p-2">{inc.id}</td><td class="p-2">{inc.title}</td><td
              class="p-2">{inc.severity}</td
            ><td class="p-2">{inc.status}</td>
            <td class="p-2">{inc.createdAt}</td><td class="p-2"
              >{inc.resolvedAt || "—"}</td
            >
            <td class="p-2"
              >{#if inc.status === "open"}<button
                  class="px-2 py-0.5 bg-green-600 rounded"
                  on:click={() => actResolve(inc.id)}>Resolve</button
                >{:else}<span class="text-neutral-500">—</span>{/if}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
    {#if nextCursor}
      <button
        class="mt-4 text-sm bg-neutral-800 border border-neutral-600 px-3 py-1 rounded"
        on:click={() => load(false)}>Load More</button
      >
    {/if}
  {/if}
</div>
