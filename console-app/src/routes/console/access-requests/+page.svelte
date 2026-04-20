<script lang="ts">
  import { onMount } from "svelte";

  type RequestStatus = "pending" | "approved" | "denied";

  interface AccessRequest {
    id: string;
    requesterId: string;
    requesterEmail: string;
    resourceType: string;
    resourceId: string;
    resourceName: string | null;
    justification: string | null;
    status: RequestStatus;
    decidedBy: string | null;
    decidedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface ListResponse {
    status: string;
    data: { items: AccessRequest[]; total: number; limit: number; offset: number };
  }

  let requests: AccessRequest[] = [];
  let total = 0;
  let loading = true;
  let error: string | null = null;

  let filterStatus: "all" | RequestStatus = "all";
  let showForm = false;
  let submitting = false;
  let formError = "";

  // Form fields
  let formResourceType = "app";
  let formResourceId = "";
  let formJustification = "";

  // Stats derived from all requests (unfiltered load — recomputed on each fetch)
  let statTotal = 0;
  let statPending = 0;
  let statApproved = 0;
  let statDenied = 0;

  async function load() {
    loading = true;
    error = null;
    try {
      const qs = new URLSearchParams({ limit: "100", offset: "0" });
      if (filterStatus !== "all") qs.set("status", filterStatus);
      const res = await fetch(
        `/api/compliance/api/v1/access-requests?${qs.toString()}`,
      );
      if (!res.ok) {
        error = `Failed to load requests (HTTP ${res.status})`;
        return;
      }
      const json = await res.json();
      const raw: Record<string, unknown>[] = json.data?.items ?? [];
      requests = raw.map((r) => ({
        id: String(r.id ?? ""),
        requesterId: String(r.requesterId ?? r.requester_id ?? ""),
        requesterEmail: String(r.requesterEmail ?? r.requester_email ?? r.requester ?? ""),
        resourceType: String(r.resourceType ?? r.resource_type ?? ""),
        resourceId: String(r.resourceId ?? r.resource_id ?? ""),
        resourceName: (r.resourceName ?? r.resource_name ?? r.resource ?? null) as string | null,
        justification: (r.justification ?? null) as string | null,
        status: String(r.status ?? "pending") as RequestStatus,
        decidedBy: (r.decidedBy ?? r.decided_by ?? null) as string | null,
        decidedAt: (r.decidedAt ?? r.decided_at ?? null) as string | null,
        expiresAt: (r.expiresAt ?? r.expires_at ?? null) as string | null,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
      }));
      total = json.data?.total ?? requests.length;

      // Recompute stats from this batch (accurate when no filter is active)
      if (filterStatus === "all") {
        statTotal = total;
        statPending = requests.filter((r) => r.status === "pending").length;
        statApproved = requests.filter((r) => r.status === "approved").length;
        statDenied = requests.filter((r) => r.status === "denied").length;
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function submitRequest() {
    if (!formResourceId.trim()) {
      formError = "Resource ID is required.";
      return;
    }
    formError = "";
    submitting = true;
    try {
      const res = await fetch("/api/compliance/api/v1/access-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resourceType: formResourceType,
          resourceId: formResourceId.trim(),
          justification: formJustification.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        formError = (d as { message?: string }).message ?? `Request failed (HTTP ${res.status})`;
        return;
      }
      formResourceId = "";
      formJustification = "";
      showForm = false;
      await load();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      submitting = false;
    }
  }

  async function decide(id: string, action: "approve" | "deny") {
    const label = action === "approve" ? "Approve" : "Deny";
    if (!confirm(`${label} this access request?`)) return;
    try {
      const res = await fetch(
        `/api/compliance/api/v1/access-requests/${id}/${action}`,
        { method: "POST" },
      );
      if (!res.ok) {
        alert(`Failed to ${action} request (HTTP ${res.status})`);
        return;
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }

  function statusBadgeClass(s: RequestStatus): string {
    if (s === "approved")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-muted text-success";
    if (s === "denied")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive-muted text-destructive";
    return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-muted text-warning";
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
      <h1 class="text-2xl font-bold text-foreground">Access Requests</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Review and manage resource access requests for your tenant.
      </p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = ""; }}
      class="shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md"
    >
      {showForm ? "Cancel" : "New Request"}
    </button>
  </div>

  <!-- Stats -->
  {#if !loading && !error}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {#each [
        { label: "Total", value: statTotal, color: "text-foreground" },
        { label: "Pending", value: statPending, color: "text-warning" },
        { label: "Approved", value: statApproved, color: "text-success" },
        { label: "Denied", value: statDenied, color: "text-destructive" },
      ] as stat}
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="text-xs text-muted-foreground">{stat.label}</div>
          <div class="mt-1 text-2xl font-bold {stat.color}">{stat.value}</div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Inline new-request form -->
  {#if showForm}
    <div class="bg-card border border-border rounded-lg p-5 space-y-4">
      <h2 class="text-base font-semibold text-foreground">New Access Request</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="res-type" class="block text-sm font-medium text-foreground/80 mb-1">
            Resource type <span class="text-destructive">*</span>
          </label>
          <select
            id="res-type"
            bind:value={formResourceType}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="app">Application</option>
            <option value="group">Group</option>
            <option value="role">Role</option>
          </select>
        </div>
        <div>
          <label for="res-id" class="block text-sm font-medium text-foreground/80 mb-1">
            Resource ID <span class="text-destructive">*</span>
          </label>
          <input
            id="res-id"
            type="text"
            placeholder="e.g. github-org, admin-role"
            bind:value={formResourceId}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div class="sm:col-span-1">
          <label for="justification" class="block text-sm font-medium text-foreground/80 mb-1">
            Justification
          </label>
          <textarea
            id="justification"
            rows="1"
            placeholder="Why do you need this access?"
            bind:value={formJustification}
            disabled={submitting}
            class="w-full px-3 py-2 rounded-md border border-input bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          ></textarea>
        </div>
      </div>
      {#if formError}
        <p class="text-sm text-destructive">{formError}</p>
      {/if}
      <div class="flex justify-end">
        <button
          on:click={submitRequest}
          disabled={submitting}
          class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium rounded-md"
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </div>
  {/if}

  <!-- Status filter pills -->
  <div class="flex gap-2 flex-wrap">
    {#each [
      { value: "all", label: "All" },
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "denied", label: "Denied" },
    ] as pill}
      <button
        on:click={() => { filterStatus = pill.value as typeof filterStatus; load(); }}
        class="px-3 py-1.5 text-sm rounded-full border transition-colors {filterStatus === pill.value
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-input text-foreground/80 hover:border-primary'}"
      >
        {pill.label}
      </button>
    {/each}
  </div>

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
  {:else if requests.length === 0}
    <div class="bg-card border border-dashed border-input rounded-lg py-16 text-center px-6">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <svg class="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      <p class="text-foreground font-medium">No access requests yet</p>
      <p class="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Access requests will appear here when users request elevated permissions or access to resources.
      </p>
    </div>
  {:else}
    <!-- Table -->
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-background/50 border-b border-border">
            <tr class="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th class="px-4 py-3 font-medium">Requester</th>
              <th class="px-4 py-3 font-medium">Resource</th>
              <th class="px-4 py-3 font-medium">Justification</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Created</th>
              <th class="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each requests as req}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-4 py-3 text-foreground">{req.requesterEmail}</td>
                <td class="px-4 py-3">
                  <div class="text-foreground font-medium">{req.resourceId}</div>
                  <div class="text-xs text-muted-foreground">{capitalize(req.resourceType)}</div>
                </td>
                <td class="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {req.justification ?? "—"}
                </td>
                <td class="px-4 py-3">
                  <span class={statusBadgeClass(req.status)}>{capitalize(req.status)}</span>
                </td>
                <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(req.createdAt)}
                </td>
                <td class="px-4 py-3 text-right">
                  {#if req.status === "pending"}
                    <div class="inline-flex gap-2">
                      <button
                        on:click={() => decide(req.id, "approve")}
                        class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded"
                      >
                        Approve
                      </button>
                      <button
                        on:click={() => decide(req.id, "deny")}
                        class="px-3 py-1 bg-destructive hover:bg-destructive/90 text-white text-xs font-medium rounded"
                      >
                        Deny
                      </button>
                    </div>
                  {:else}
                    <span class="text-xs text-muted-foreground/70">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
