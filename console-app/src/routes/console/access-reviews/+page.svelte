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

  interface ReviewItem {
    id: string;
    userEmail: string;
    resource: string;
    currentAccess: string;
    decision: string | null;
    decidedBy: string | null;
    notes: string | null;
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

  let expandedId: string | null = null;
  let detailItems: ReviewItem[] = [];
  let detailLoading = false;
  let detailError: string | null = null;
  let decidingItemId: string | null = null;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/access-reviews");
      if (!res.ok) {
        error = `Failed to load campaigns (HTTP ${res.status})`;
        return;
      }
      const json = await res.json();
      const items = json.data?.items ?? json.campaigns ?? [];
      campaigns = items.map((c: Record<string, unknown>) => ({
        ...c,
        totalItems: c.itemCount ?? c.totalItems ?? 0,
        decidedItems: c.decidedCount ?? c.decidedItems ?? 0,
      }));
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
      const res = await fetch("/api/access-reviews", {
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
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-muted text-success";
    if (s === "active")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-muted text-info";
    return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground";
  }

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      expandedId = null;
      return;
    }
    expandedId = id;
    detailLoading = true;
    detailError = null;
    detailItems = [];
    try {
      const res = await fetch(`/api/access-reviews/${id}/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      detailItems = (json.items ?? []).map((it: Record<string, unknown>) => ({
        id: it.id ?? it.item_id ?? "",
        userEmail: it.userEmail ?? it.user_email ?? it.email ?? "—",
        resource: it.resource ?? it.app_name ?? it.application ?? "—",
        currentAccess: it.currentAccess ?? it.current_access ?? it.access_level ?? "—",
        decision: it.decision ?? null,
        decidedBy: it.decidedBy ?? it.decided_by ?? null,
        notes: it.notes ?? null,
      }));
    } catch (e) {
      detailError = (e as Error).message;
    } finally {
      detailLoading = false;
    }
  }

  async function submitDecision(campaignId: string, itemId: string, decision: "approved" | "revoked") {
    decidingItemId = itemId;
    try {
      const res = await fetch(`/api/access-reviews/${campaignId}/decisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, decision }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert((d as { error?: string }).error ?? `Failed (HTTP ${res.status})`);
        return;
      }
      detailItems = detailItems.map((it) =>
        it.id === itemId ? { ...it, decision } : it
      );
      campaigns = campaigns.map((c) =>
        c.id === campaignId ? { ...c, decidedItems: c.decidedItems + 1 } : c
      );
    } catch (e) {
      alert((e as Error).message);
    } finally {
      decidingItemId = null;
    }
  }

  function decisionBadge(d: string | null): string {
    if (d === "approved") return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-muted text-success";
    if (d === "revoked") return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive-muted text-destructive";
    return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground";
  }

  onMount(load);
</script>

<div class="p-8 max-w-7xl mx-auto space-y-6" data-tour="access-reviews">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Access Reviews</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Periodically recertify who has access to what across your connected applications.
      </p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = ""; }}
      class="shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md"
    >
      {showForm ? "Cancel" : "New Campaign"}
    </button>
  </div>

  <!-- Inline create form -->
  {#if showForm}
    <div class="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 class="text-base font-semibold text-foreground">New Access Review Campaign</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="camp-name" class="block text-sm font-medium text-foreground/80 mb-1">
            Campaign name <span class="text-destructive">*</span>
          </label>
          <input
            id="camp-name"
            type="text"
            placeholder="Q2 2026 Access Review"
            bind:value={formName}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="camp-due" class="block text-sm font-medium text-foreground/80 mb-1">
            Due date
          </label>
          <input
            id="camp-due"
            type="date"
            bind:value={formDueDate}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="camp-scope" class="block text-sm font-medium text-foreground/80 mb-1">
            Scope
          </label>
          <input
            id="camp-scope"
            type="text"
            placeholder="all users, finance team…"
            bind:value={formScope}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      {#if formError}
        <p class="text-sm text-destructive">{formError}</p>
      {/if}
      <div class="flex justify-end">
        <button
          on:click={createCampaign}
          disabled={submitting}
          class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium rounded-md"
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
        <div class="h-14 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive text-sm">{error}</p>
      <button
        on:click={load}
        class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else if campaigns.length === 0}
    <div class="bg-card border border-dashed border-input rounded-lg py-16 text-center px-6">
      <p class="text-foreground font-medium">No access review campaigns yet</p>
      <p class="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Access reviews let you periodically recertify who has access to what. Create a campaign above to get started.
      </p>
    </div>
  {:else}
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-background/50 border-b border-border">
            <tr class="text-left text-xs text-muted-foreground uppercase tracking-wider">
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
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                on:click={() => toggleExpand(c.id)}
              >
                <td class="px-4 py-3 font-medium text-foreground">
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-muted-foreground transition-transform {expandedId === c.id ? 'rotate-90' : ''}"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {c.name}
                  </div>
                </td>
                <td class="px-4 py-3 text-muted-foreground">{c.scope ?? "—"}</td>
                <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(c.dueDate)}
                </td>
                <td class="px-4 py-3 min-w-[160px]">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" style="width: {pct}%"></div>
                    </div>
                    <span class="text-xs text-muted-foreground whitespace-nowrap">
                      {c.decidedItems} / {c.totalItems}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class={statusClass(c.status)}>{capitalize(c.status)}</span>
                </td>
              </tr>
              {#if expandedId === c.id}
                <tr>
                  <td colspan="5" class="px-4 py-4 bg-background/50">
                    {#if detailLoading}
                      <div class="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path>
                        </svg>
                        Loading review items…
                      </div>
                    {:else if detailError}
                      <p class="text-sm text-destructive py-2">Failed to load items: {detailError}</p>
                    {:else if detailItems.length === 0}
                      <p class="text-sm text-muted-foreground py-2">No review items in this campaign. Add items to begin the review.</p>
                    {:else}
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                            <th class="pb-2 font-medium">User</th>
                            <th class="pb-2 font-medium">Resource</th>
                            <th class="pb-2 font-medium">Access Level</th>
                            <th class="pb-2 font-medium">Decision</th>
                            <th class="pb-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                          {#each detailItems as item}
                            <tr>
                              <td class="py-2 text-foreground">{item.userEmail}</td>
                              <td class="py-2 text-muted-foreground">{item.resource}</td>
                              <td class="py-2 text-muted-foreground">{item.currentAccess}</td>
                              <td class="py-2">
                                <span class={decisionBadge(item.decision)}>
                                  {item.decision ? capitalize(item.decision) : "Pending"}
                                </span>
                              </td>
                              <td class="py-2">
                                {#if !item.decision && c.status === "active"}
                                  <div class="flex gap-2">
                                    <button
                                      disabled={decidingItemId === item.id}
                                      on:click|stopPropagation={() => submitDecision(c.id, item.id, "approved")}
                                      class="px-2.5 py-1 text-xs font-medium rounded bg-success-muted text-success hover:bg-success/20 disabled:opacity-50"
                                    >Approve</button>
                                    <button
                                      disabled={decidingItemId === item.id}
                                      on:click|stopPropagation={() => submitDecision(c.id, item.id, "revoked")}
                                      class="px-2.5 py-1 text-xs font-medium rounded bg-destructive-muted text-destructive hover:bg-destructive/20 disabled:opacity-50"
                                    >Revoke</button>
                                  </div>
                                {:else if item.decision}
                                  <span class="text-xs text-muted-foreground">
                                    by {item.decidedBy ?? "—"}
                                  </span>
                                {:else}
                                  <span class="text-xs text-muted-foreground">—</span>
                                {/if}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    {/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
