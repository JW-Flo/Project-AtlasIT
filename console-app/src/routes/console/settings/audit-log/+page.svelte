<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
  ];
  $: current = $page.url.pathname;

  interface AuditEntry {
    date: string;
    actor: string;
    action: string;
    target: string;
    details: string;
  }

  let entries: AuditEntry[] = [];
  let total = 0;
  let loading = true;
  let error = "";
  let offset = 0;
  const limit = 50;

  async function loadAuditLog() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/tenant/audit-log?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`Failed to load audit log (${res.status})`);
      const data: { entries?: AuditEntry[]; total?: number } = await res.json();
      entries = data.entries || [];
      total = data.total || 0;
    } catch (e: any) {
      error = e?.message || "Failed to load audit log";
    } finally {
      loading = false;
    }
  }

  function prevPage() {
    if (offset <= 0) return;
    offset = Math.max(0, offset - limit);
    loadAuditLog();
  }

  function nextPage() {
    if (offset + limit >= total) return;
    offset += limit;
    loadAuditLog();
  }

  onMount(loadAuditLog);
</script>

<div class="px-6 py-6 space-y-6 max-w-6xl mx-auto">
  <h1 class="text-2xl font-semibold">Audit Log</h1>

  <div class="flex gap-6 border-b border-white/10 mb-6">
    {#each settingsTabs as tab}
      <a href={tab.href}
         class="pb-2 text-sm {current === tab.href ? 'text-white border-b-2 border-indigo-500' : 'text-white/50 hover:text-white/80'}"
      >{tab.label}</a>
    {/each}
  </div>

  {#if error}
    <div class="text-red-400 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
  {/if}

  {#if loading}
    <div class="text-white/50 text-sm">Loading audit log...</div>
  {:else}
    <div class="bg-[#1a2332] rounded-lg border border-white/10 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-white/50 border-b border-white/10">
            <th class="px-4 py-3 font-medium">Date</th>
            <th class="px-4 py-3 font-medium">Actor</th>
            <th class="px-4 py-3 font-medium">Action</th>
            <th class="px-4 py-3 font-medium">Target</th>
            <th class="px-4 py-3 font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {#each entries as entry}
            <tr class="border-b border-white/10 hover:bg-white/5">
              <td class="px-4 py-3 text-white/60 whitespace-nowrap">{new Date(entry.date).toLocaleString()}</td>
              <td class="px-4 py-3 text-white/80">{entry.actor}</td>
              <td class="px-4 py-3 text-white">{entry.action}</td>
              <td class="px-4 py-3 text-white/80">{entry.target || "—"}</td>
              <td class="px-4 py-3 text-white/60 max-w-xs truncate">{entry.details || "—"}</td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-4 py-6 text-center text-white/40">No audit log entries</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if total > limit}
      <div class="flex justify-between items-center text-sm">
        <span class="text-white/50">
          Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
        </span>
        <div class="flex gap-2">
          <button
            on:click={prevPage}
            disabled={offset <= 0}
            class="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-30"
          >
            Previous
          </button>
          <button
            on:click={nextPage}
            disabled={offset + limit >= total}
            class="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
