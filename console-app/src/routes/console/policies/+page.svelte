<script lang="ts">
  import { onMount } from "svelte";
  import { session, fetchSession } from "$lib/stores/session";
  import { relativeTime } from "$lib/utils/time";

  // ── Types ────────────────────────────────────────────────────────────────

  interface Policy {
    id: string;
    tenantId: string;
    name: string;
    category: string;
    version: string;
    content?: string;
    status: "draft" | "published" | "archived";
    frameworkRefs: string[];
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
    ackCount: number;
  }

  interface Ack {
    id: string;
    userId: string;
    userEmail: string | null;
    acknowledgedAt: string;
    policyVersion: string;
  }

  const CATEGORIES = [
    { value: "access-control", label: "Access Control" },
    { value: "incident-response", label: "Incident Response" },
    { value: "data-protection", label: "Data Protection" },
    { value: "vendor", label: "Vendor Management" },
    { value: "acceptable-use", label: "Acceptable Use" },
    { value: "byod", label: "BYOD" },
    { value: "retention", label: "Data Retention" },
    { value: "other", label: "Other" },
  ];

  // ── State ────────────────────────────────────────────────────────────────

  let policies: Policy[] = [];
  let loading = true;
  let error: string | null = null;

  let statusFilter = "all";
  let categoryFilter = "all";

  let selectedPolicy: Policy | null = null;
  let detailLoading = false;
  let acks: Ack[] = [];
  let acksLoading = false;
  let acksError: string | null = null;

  let showPanel = false;
  let showNewForm = false;
  let editMode = false;

  // New policy form
  let formName = "";
  let formCategory = "access-control";
  let formVersion = "1.0";
  let formContent = "";
  let formFrameworkRefs = "";
  let formError: string | null = null;
  let formSubmitting = false;

  // Edit state
  let editContent = "";
  let editStatus = "";
  let editSaving = false;
  let editError: string | null = null;

  let ackBusy = false;
  let ackError: string | null = null;
  let ackSuccess = false;

  let banner: { type: "success" | "error"; msg: string } | null = null;

  $: isAdmin = ($session?.roles ?? []).includes("admin");
  $: filtered = policies.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadPolicies() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/compliance/api/v1/policies?limit=200");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const raw: Record<string, unknown>[] = j.data?.items ?? [];
      policies = raw.map((r) => ({
        id: String(r.id ?? ""),
        tenantId: String(r.tenantId ?? r.tenant_id ?? ""),
        name: String(r.name ?? ""),
        category: String(r.category ?? ""),
        version: String(r.version ?? "1"),
        content: r.content as string | undefined,
        status: String(r.status ?? "draft") as Policy["status"],
        frameworkRefs: (r.frameworkRefs ?? r.framework_refs ?? []) as string[],
        createdBy: (r.createdBy ?? r.created_by ?? null) as string | null,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
        publishedAt: (r.publishedAt ?? r.published_at ?? null) as string | null,
        ackCount: Number(r.ackCount ?? r.ack_count ?? 0),
      }));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function openDetail(p: Policy) {
    selectedPolicy = null;
    acks = [];
    acksError = null;
    ackSuccess = false;
    ackError = null;
    editMode = false;
    showPanel = true;
    detailLoading = true;
    try {
      const res = await fetch(`/api/compliance/api/v1/policies/${p.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const d = j.data ?? {};
      selectedPolicy = {
        id: String(d.id ?? ""),
        tenantId: String(d.tenantId ?? d.tenant_id ?? ""),
        name: String(d.name ?? ""),
        category: String(d.category ?? ""),
        version: String(d.version ?? "1"),
        content: d.content as string | undefined,
        status: String(d.status ?? "draft") as Policy["status"],
        frameworkRefs: (d.frameworkRefs ?? d.framework_refs ?? []) as string[],
        createdBy: (d.createdBy ?? d.created_by ?? null) as string | null,
        createdAt: String(d.createdAt ?? d.created_at ?? ""),
        updatedAt: String(d.updatedAt ?? d.updated_at ?? ""),
        publishedAt: (d.publishedAt ?? d.published_at ?? null) as string | null,
        ackCount: Number(d.ackCount ?? d.ack_count ?? 0),
      };
      editContent = selectedPolicy.content ?? "";
      editStatus = selectedPolicy.status;
    } catch (e) {
      banner = { type: "error", msg: `Failed to load policy: ${(e as Error).message}` };
      showPanel = false;
    } finally {
      detailLoading = false;
    }
    if (selectedPolicy) loadAcks(selectedPolicy.id);
  }

  async function loadAcks(policyId: string) {
    acksLoading = true;
    acksError = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/policies/${policyId}/acknowledgements`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const rawAcks: Record<string, unknown>[] = j.data?.items ?? [];
      acks = rawAcks.map((a) => ({
        id: String(a.id ?? ""),
        userId: String(a.userId ?? a.user_id ?? ""),
        userEmail: (a.userEmail ?? a.user_email ?? null) as string | null,
        acknowledgedAt: String(a.acknowledgedAt ?? a.acknowledged_at ?? ""),
        policyVersion: String(a.policyVersion ?? a.policy_version ?? ""),
      }));
    } catch (e) {
      acksError = (e as Error).message;
    } finally {
      acksLoading = false;
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function createPolicy() {
    if (!formName.trim() || !formContent.trim()) {
      formError = "Name and content are required.";
      return;
    }
    formSubmitting = true;
    formError = null;
    try {
      const refs = formFrameworkRefs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/compliance/api/v1/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          category: formCategory,
          version: formVersion.trim() || "1.0",
          content: formContent.trim(),
          frameworkRefs: refs,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      formName = "";
      formCategory = "access-control";
      formVersion = "1.0";
      formContent = "";
      formFrameworkRefs = "";
      showNewForm = false;
      banner = { type: "success", msg: "Policy created." };
      await loadPolicies();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      formSubmitting = false;
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async function saveEdit() {
    if (!selectedPolicy) return;
    editSaving = true;
    editError = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/policies/${selectedPolicy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, status: editStatus }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      const upd = j.data ?? {};
      selectedPolicy = {
        id: String(upd.id ?? selectedPolicy.id),
        tenantId: String(upd.tenantId ?? upd.tenant_id ?? selectedPolicy.tenantId),
        name: String(upd.name ?? selectedPolicy.name),
        category: String(upd.category ?? selectedPolicy.category),
        version: String(upd.version ?? selectedPolicy.version),
        content: upd.content as string | undefined,
        status: String(upd.status ?? "draft") as Policy["status"],
        frameworkRefs: (upd.frameworkRefs ?? upd.framework_refs ?? selectedPolicy.frameworkRefs) as string[],
        createdBy: (upd.createdBy ?? upd.created_by ?? selectedPolicy.createdBy) as string | null,
        createdAt: String(upd.createdAt ?? upd.created_at ?? selectedPolicy.createdAt),
        updatedAt: String(upd.updatedAt ?? upd.updated_at ?? selectedPolicy.updatedAt),
        publishedAt: (upd.publishedAt ?? upd.published_at ?? selectedPolicy.publishedAt) as string | null,
        ackCount: Number(upd.ackCount ?? upd.ack_count ?? selectedPolicy.ackCount),
      };
      editMode = false;
      banner = { type: "success", msg: "Policy updated." };
      await loadPolicies();
    } catch (e) {
      editError = (e as Error).message;
    } finally {
      editSaving = false;
    }
  }

  // ── Acknowledge ────────────────────────────────────────────────────────────

  async function acknowledgePolicy() {
    if (!selectedPolicy) return;
    ackBusy = true;
    ackError = null;
    ackSuccess = false;
    try {
      const res = await fetch(`/api/compliance/api/v1/policies/${selectedPolicy.id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      ackSuccess = true;
      if (selectedPolicy) loadAcks(selectedPolicy.id);
      await loadPolicies();
      // Refresh selected policy ackCount
      const updatedIdx = policies.findIndex((p) => p.id === selectedPolicy?.id);
      if (updatedIdx !== -1) selectedPolicy = { ...selectedPolicy, ackCount: policies[updatedIdx].ackCount };
    } catch (e) {
      ackError = (e as Error).message;
    } finally {
      ackBusy = false;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function statusClass(s: string): string {
    switch (s) {
      case "published": return "bg-success-muted text-success";
      case "draft":     return "bg-warning-muted text-warning";
      case "archived":  return "bg-muted text-muted-foreground";
      default:          return "bg-muted text-muted-foreground";
    }
  }

  function categoryLabel(c: string): string {
    return CATEGORIES.find((x) => x.value === c)?.label ?? c;
  }

  onMount(async () => {
    await fetchSession();
    loadPolicies();
  });
</script>

<div class="animate-fade-in" data-tour="policies">
  <!-- Header -->
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Policies</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manage compliance policies and track team acknowledgements.
      </p>
    </div>
    {#if isAdmin}
      <button
        on:click={() => { showNewForm = !showNewForm; formError = null; showPanel = false; }}
        class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors"
      >
        New Policy
      </button>
    {/if}
  </div>

  <!-- Banner -->
  {#if banner}
    <div
      class="mb-5 rounded-lg p-4 text-sm border
        {banner.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'}"
    >
      {banner.msg}
      <button on:click={() => (banner = null)} class="ml-4 underline text-xs">Dismiss</button>
    </div>
  {/if}

  <!-- New policy form -->
  {#if showNewForm && isAdmin}
    <div class="mb-6 bg-card border border-border rounded-lg p-6">
      <h2 class="text-lg font-semibold text-foreground mb-4">Create Policy</h2>
      {#if formError}
        <div class="mb-4 rounded p-3 bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 text-sm">{formError}</div>
      {/if}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1">Name *</label>
          <input
            bind:value={formName}
            type="text"
            placeholder="e.g. Access Control Policy"
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1">Category *</label>
          <select
            bind:value={formCategory}
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {#each CATEGORIES as cat}
              <option value={cat.value}>{cat.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1">Version</label>
          <input
            bind:value={formVersion}
            type="text"
            placeholder="1.0"
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-1">Framework refs (comma-separated)</label>
          <input
            bind:value={formFrameworkRefs}
            type="text"
            placeholder="SOC2-CC6.1, ISO-27001-A.9"
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-foreground/80 mb-1">Content *</label>
        <textarea
          bind:value={formContent}
          rows="8"
          placeholder="Write or paste policy content here..."
          class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        ></textarea>
      </div>
      <div class="flex items-center gap-3">
        <button
          on:click={createPolicy}
          disabled={formSubmitting}
          class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {formSubmitting ? "Creating..." : "Create Policy"}
        </button>
        <button
          on:click={() => { showNewForm = false; formError = null; }}
          class="px-4 py-2 text-sm text-gray-600 dark:text-muted-foreground/70 hover:text-gray-900 dark:hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <!-- Filters -->
  <div class="mb-5 flex flex-wrap items-center gap-3">
    <!-- Status pills -->
    <div class="flex items-center gap-1 flex-wrap">
      {#each [["all","All"],["draft","Draft"],["published","Published"],["archived","Archived"]] as [val, label]}
        <button
          on:click={() => { statusFilter = val; }}
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors
            {statusFilter === val
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-foreground/80 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        >
          {label}
        </button>
      {/each}
    </div>
    <!-- Category filter -->
    <select
      bind:value={categoryFilter}
      class="rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="all">All categories</option>
      {#each CATEGORIES as cat}
        <option value={cat.value}>{cat.label}</option>
      {/each}
    </select>
  </div>

  <!-- Main content: table + side panel -->
  <div class="flex gap-6">
    <!-- Table -->
    <div class="flex-1 min-w-0">
      {#if loading}
        <div class="space-y-3">
          {#each [1, 2, 3, 4] as _}
            <div class="h-16 bg-muted rounded-lg animate-pulse"></div>
          {/each}
        </div>
      {:else if error}
        <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
          <p class="text-destructive text-sm">{error}</p>
          <button
            on:click={loadPolicies}
            class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
          >Retry</button>
        </div>
      {:else if filtered.length === 0}
        <div class="text-center py-16 bg-card border border-border rounded-lg">
          <p class="text-muted-foreground text-sm mb-4">
            {policies.length === 0 ? "No policies yet." : "No policies match the selected filters."}
          </p>
          {#if isAdmin && policies.length === 0}
            <button
              on:click={() => { showNewForm = true; showPanel = false; }}
              class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md"
            >
              Create your first policy
            </button>
          {/if}
        </div>
      {:else}
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-background/40 border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hidden sm:table-cell">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hidden md:table-cell">Version</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hidden md:table-cell">Acks</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              {#each filtered as p (p.id)}
                <tr
                  on:click={() => openDetail(p)}
                  on:keydown={(e) => e.key === "Enter" && openDetail(p)}
                  role="button"
                  tabindex="0"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors
                    {selectedPolicy?.id === p.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}"
                >
                  <td class="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-muted-foreground/70 hidden sm:table-cell">{categoryLabel(p.category)}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-muted-foreground/70 hidden md:table-cell">v{p.version}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusClass(p.status)}">
                      {p.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-muted-foreground/70 hidden md:table-cell">{p.ackCount}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{relativeTime(p.updatedAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Side panel -->
    {#if showPanel}
      <div class="w-full max-w-md flex-shrink-0">
        <div class="bg-card border border-border rounded-lg p-5 sticky top-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-foreground truncate">
              {detailLoading ? "Loading..." : selectedPolicy?.name ?? "Policy"}
            </h2>
            <button
              on:click={() => { showPanel = false; selectedPolicy = null; }}
              class="text-muted-foreground/70 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none ml-2"
              aria-label="Close"
            >&times;</button>
          </div>

          {#if detailLoading}
            <div class="space-y-3">
              {#each [1, 2, 3] as _}
                <div class="h-8 bg-muted rounded animate-pulse"></div>
              {/each}
            </div>
          {:else if selectedPolicy}
            <!-- Meta -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusClass(selectedPolicy.status)}">
                {selectedPolicy.status}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {categoryLabel(selectedPolicy.category)}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                v{selectedPolicy.version}
              </span>
            </div>

            {#if selectedPolicy.frameworkRefs.length > 0}
              <div class="mb-4">
                <p class="text-xs text-muted-foreground mb-1">Framework refs</p>
                <div class="flex flex-wrap gap-1">
                  {#each selectedPolicy.frameworkRefs as ref}
                    <span class="text-xs bg-primary-muted text-primary border border-primary/20 rounded px-2 py-0.5">{ref}</span>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Content -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs text-muted-foreground">Content</p>
                {#if isAdmin}
                  <button
                    on:click={() => { editMode = !editMode; editError = null; }}
                    class="text-xs text-primary hover:underline"
                  >{editMode ? "Cancel edit" : "Edit"}</button>
                {/if}
              </div>

              {#if editMode && isAdmin}
                <textarea
                  bind:value={editContent}
                  rows="10"
                  class="w-full rounded border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
                <div class="mt-2">
                  <label class="block text-xs font-medium text-foreground/80 mb-1">Status</label>
                  <select
                    bind:value={editStatus}
                    class="w-full rounded border border-input bg-white dark:bg-gray-700 text-foreground px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                {#if editError}
                  <p class="mt-2 text-xs text-destructive">{editError}</p>
                {/if}
                <button
                  on:click={saveEdit}
                  disabled={editSaving}
                  class="mt-3 px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              {:else}
                <div class="max-h-64 overflow-y-auto bg-background/40 border border-border rounded p-3 text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedPolicy.content ?? "(no content)"}
                </div>
              {/if}
            </div>

            <!-- Acknowledge -->
            {#if selectedPolicy.status === "published"}
              <div class="mb-4 pt-3 border-t border-border">
                {#if ackSuccess}
                  <div class="rounded p-2 bg-success-muted border border-success/20 text-success text-xs mb-2">
                    Acknowledged! Compliance evidence recorded.
                  </div>
                {/if}
                {#if ackError}
                  <p class="text-xs text-destructive mb-2">{ackError}</p>
                {/if}
                <button
                  on:click={acknowledgePolicy}
                  disabled={ackBusy || ackSuccess}
                  class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                >
                  {ackBusy ? "Recording..." : ackSuccess ? "Acknowledged" : "Acknowledge Policy"}
                </button>
              </div>
            {:else}
              <div class="mb-4 pt-3 border-t border-border">
                <p class="text-xs text-muted-foreground italic">
                  Policy must be published before it can be acknowledged.
                </p>
              </div>
            {/if}

            <!-- Acknowledgements list -->
            <div class="pt-3 border-t border-border">
              <p class="text-xs font-medium text-foreground/80 mb-2">
                Acknowledgements ({selectedPolicy.ackCount})
              </p>
              {#if acksLoading}
                <div class="h-8 bg-muted rounded animate-pulse"></div>
              {:else if acksError}
                <p class="text-xs text-destructive">{acksError}</p>
              {:else if acks.length === 0}
                <p class="text-xs text-muted-foreground italic">No acknowledgements yet.</p>
              {:else}
                <ul class="space-y-1 max-h-40 overflow-y-auto">
                  {#each acks as ack (ack.id)}
                    <li class="flex items-center justify-between text-xs text-foreground/80">
                      <span class="truncate">{ack.userEmail ?? ack.userId}</span>
                      <span class="text-muted-foreground/70 ml-2 flex-shrink-0">{relativeTime(ack.acknowledgedAt)}</span>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>

            <!-- Timestamps -->
            <div class="mt-4 pt-3 border-t border-border text-xs text-muted-foreground/70 space-y-0.5">
              <p>Created {relativeTime(selectedPolicy.createdAt)}{selectedPolicy.createdBy ? ` by ${selectedPolicy.createdBy}` : ""}</p>
              <p>Updated {relativeTime(selectedPolicy.updatedAt)}</p>
              {#if selectedPolicy.publishedAt}
                <p>Published {relativeTime(selectedPolicy.publishedAt)}</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
