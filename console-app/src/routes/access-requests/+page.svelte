<script lang="ts">
  import {
    listAccessRequests,
    createAccessRequest,
    transitionAccessRequest,
  } from "$lib/api/accessRequests";
  import { onMount } from "svelte";
  import type { AccessRequest } from "$lib/api/types";
  let items: AccessRequest[] = [];
  let loading = true;
  let error: string | null = null;
  let nextCursor: number | null = null;
  let form = { subjectRef: "", resource: "", justification: "" };
  let submitting = false;
  let formError = "";

  async function load(reset = false) {
    try {
      const data = await listAccessRequests({
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
    formError = "";
    if (!form.subjectRef.trim()) { formError = "Subject Ref is required"; return; }
    if (!form.resource.trim()) { formError = "Resource is required"; return; }
    submitting = true;
    error = null;
    try {
      const created = await createAccessRequest({
        subjectRef: form.subjectRef.trim(),
        resource: form.resource.trim(),
        justification: form.justification.trim() || undefined,
      });
      items = [created, ...items];
      form = { subjectRef: "", resource: "", justification: "" };
    } catch (e: any) {
      error = e?.message || "Create failed";
    } finally {
      submitting = false;
    }
  }

  async function act(id: number, action: "approve" | "deny" | "fulfill") {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    items = items.map((r) =>
      r.id === id
        ? {
            ...r,
            status:
              action === "approve"
                ? "approved"
                : action === "deny"
                  ? "denied"
                  : "fulfilled",
          }
        : r
    );
    try {
      const updated = await transitionAccessRequest(id, action);
      items = items.map((r) => (r.id === id ? updated : r));
    } catch {
      items = items.map((r) => (r.id === id ? prev : r));
    }
  }

  function statusBadge(s: string): string {
    switch (s) {
      case "pending": return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30";
      case "approved": return "bg-green-600/20 text-green-300 border-green-500/30";
      case "denied": return "bg-red-600/20 text-red-300 border-red-500/30";
      case "fulfilled": return "bg-blue-600/20 text-blue-300 border-blue-500/30";
      default: return "bg-neutral-600/20 text-neutral-300 border-neutral-500/30";
    }
  }
</script>

<div class="p-6 max-w-5xl mx-auto flex flex-col gap-6">
  <h1 class="text-2xl font-semibold">Access Requests</h1>

  <!-- Create Form -->
  <div class="bg-[#1a2332] border border-white/10 rounded-lg p-4 flex flex-col gap-3">
    <h2 class="text-sm font-medium text-white/70">New Access Request</h2>
    <div class="flex gap-2 flex-wrap items-end">
      <div class="flex flex-col gap-1">
        <label for="ar-subject" class="text-xs text-white/50">Subject Ref *</label>
        <input
          id="ar-subject"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          placeholder="user@company.com"
          bind:value={form.subjectRef}
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="ar-resource" class="text-xs text-white/50">Resource *</label>
        <input
          id="ar-resource"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          placeholder="production-db"
          bind:value={form.resource}
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="ar-justification" class="text-xs text-white/50">Justification</label>
        <input
          id="ar-justification"
          class="px-3 py-1.5 rounded bg-[#0f1923] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          placeholder="Reason for access"
          bind:value={form.justification}
        />
      </div>
      <button
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        disabled={submitting}
        on:click={submit}>{submitting ? "Creating..." : "Create"}</button
      >
    </div>
    {#if formError}
      <div class="text-xs text-red-400">{formError}</div>
    {/if}
  </div>

  {#if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-3">{error}</div>
  {/if}

  {#if loading}
    <div class="text-sm text-white/40">Loading...</div>
  {:else if items.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
      <svg class="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <p class="text-sm">No access requests yet. Create one above.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead class="text-white/50 border-b border-white/10">
          <tr>
            <th class="p-2 text-left">ID</th>
            <th class="p-2 text-left">Subject</th>
            <th class="p-2 text-left">Resource</th>
            <th class="p-2 text-left">Status</th>
            <th class="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as r}
            <tr class="border-t border-white/5 hover:bg-white/[0.02]">
              <td class="p-2 text-white/60">{r.id}</td>
              <td class="p-2 text-white/90">{r.subject}</td>
              <td class="p-2 text-white/80">{r.resource}</td>
              <td class="p-2">
                <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border {statusBadge(r.status)}">
                  {r.status}
                </span>
              </td>
              <td class="p-2 flex gap-2 flex-wrap">
                {#if r.status === "pending"}
                  <button
                    class="px-2 py-0.5 bg-green-600 hover:bg-green-500 rounded text-white text-xs"
                    on:click={() => act(r.id, "approve")}>Approve</button
                  >
                  <button
                    class="px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-white text-xs"
                    on:click={() => act(r.id, "deny")}>Deny</button
                  >
                {:else if r.status === "approved"}
                  <button
                    class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-xs"
                    on:click={() => act(r.id, "fulfill")}>Fulfill</button
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
