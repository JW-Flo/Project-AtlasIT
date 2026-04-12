<script lang="ts">
  import { onMount } from "svelte";

  interface AccessReviewCampaign {
    id: string;
    name: string;
    scope: string | null;
    dueDate: string | null;
    status: string;
    totalItems: number;
    decidedItems: number;
  }

  interface ListResponse {
    status: string;
    data: { items: AccessReviewCampaign[]; total: number };
  }

  let campaigns: AccessReviewCampaign[] = [];
  let loading = true;
  let error: string | null = null;
  let showForm = false;
  let submitting = false;
  let formError = "";
  let formName = "";
  let formDueDate = "";
  let formScope = "";

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/compliance/api/v1/access-reviews");
      if (!res.ok) {
        error = `Failed to load campaigns (HTTP ${res.status})`;
        return;
      }
      const json: ListResponse = await res.json();
      campaigns = json.data?.items ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function createCampaign() {
    if (!formName.trim()) {
      formError = "Campaign name is required.";
      return;
    }
    formError = "";
    submitting = true;
    try {
      const res = await fetch("/api/compliance/api/v1/access-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          dueDate: formDueDate || null,
          scope: formScope.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        formError = (d as { message?: string }).message ?? `Failed (HTTP ${res.status})`;
        return;
      }
      formName = "";
      formDueDate = "";
      formScope = "";
      showForm = false;
      await load();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      submitting = false;
    }
  }

  function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }

  function progress(c: AccessReviewCampaign): number {
    if (!c.totalItems || c.totalItems === 0) return 0;
    return Math.round((c.decidedItems / c.totalItems) * 100);
  }

  function statusClass(s: string): string {
    if (s === "completed")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (s === "active")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  onMount(load);
</script>

<div class="p-8 max-w-7xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Access Reviews</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Periodically recertify who has access to what across your connected applications.
      </p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = ""; }}
      class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
    >
      {showForm ? "Cancel" : "New Campaign"}
    </button>
  </div>

  <!-- Inline create form -->
  {#if showForm}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">New Access Review Campaign</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="camp-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Campaign name <span class="text-red-500">*</span>
          </label>
          <input
            id="camp-name"
            type="text"
            placeholder="Q2 2026 Access Review"
            bind:value={formName}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="camp-due" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due date
          </label>
          <input
            id="camp-due"
            type="date"
            bind:value={formDueDate}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="camp-scope" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scope
          </label>
          <input
            id="camp-scope"
            type="text"
            placeholder="all users, finance team…"
            bind:value={formScope}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {#if formError}
        <p class="text-sm text-red-600 dark:text-red-400">{formError}</p>
      {/if}
      <div class="flex justify-end">
        <button
          on:click={createCampaign}
          disabled={submitting}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-md"
        >
          {submitting ? "Creating…" : "Create Campaign"}
        </button>
      </div>
    </div>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300 text-sm">{error}</p>
      <button
        on:click={load}
        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else if campaigns.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-16 text-center px-6">
      <p class="text-gray-900 dark:text-white font-medium">No access review campaigns yet</p>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Access reviews let you periodically recertify who has access to what. Create a campaign above to get started.
      </p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr class="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Scope</th>
              <th class="px-4 py-3 font-medium">Due Date</th>
              <th class="px-4 py-3 font-medium">Progress</th>
              <th class="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each campaigns as c}
              {@const pct = progress(c)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{c.scope ?? "—"}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(c.dueDate)}
                </td>
                <td class="px-4 py-3 min-w-[160px]">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" style="width: {pct}%"></div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {c.decidedItems} / {c.totalItems}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class={statusClass(c.status)}>{capitalize(c.status)}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
