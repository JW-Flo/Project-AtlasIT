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

  // Stats
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
      const json: ListResponse = await res.json();
      requests = json.data?.items ?? [];
      total = json.data?.total ?? requests.length;

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

  function statusClass(s: RequestStatus): string {
    if (s === "approved")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (s === "denied")
      return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Access Requests</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Review and manage resource access requests for your tenant.
      </p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = ""; }}
      class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
    >
      {showForm ? "Cancel" : "New Request"}
    </button>
  </div>

  <!-- Stats -->
  {#if !loading && !error}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {#each [
        { label: "Total", value: statTotal, color: "text-gray-900 dark:text-white" },
        { label: "Pending", value: statPending, color: "text-yellow-600 dark:text-yellow-400" },
        { label: "Approved", value: statApproved, color: "text-green-600 dark:text-green-400" },
        { label: "Denied", value: statDenied, color: "text-red-600 dark:text-red-400" },
      ] as stat}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div class="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          <div class="mt-1 text-2xl font-bold {stat.color}">{stat.value}</div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Inline new-request form -->
  {#if showForm}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">New Access Request</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="res-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Resource type <span class="text-red-500">*</span>
          </label>
          <select
            id="res-type"
            bind:value={formResourceType}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="app">Application</option>
            <option value="group">Group</option>
            <option value="role">Role</option>
          </select>
        </div>
        <div>
          <label for="res-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Resource ID <span class="text-red-500">*</span>
          </label>
          <input
            id="res-id"
            type="text"
            placeholder="e.g. github-org, admin-role"
            bind:value={formResourceId}
            disabled={submitting}
            class="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="justification" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Justification
          </label>
          <textarea
            id="justification"
            rows="1"
            placeholder="Why do you need this access?"
            bind:value={formJustification}
            disabled={submitting}
            class="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
      </div>
      {#if formError}
        <p class="text-sm text-red-600 dark:text-red-400">{formError}</p>
      {/if}
      <div class="flex justify-end">
        <button
          on:click={submitRequest}
          disabled={submitting}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-md"
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
          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}"
      >
        {pill.label}
      </button>
    {/each}
  </div>

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
  {:else if requests.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-12 text-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">No access requests found.</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr class="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                <td class="px-4 py-3 text-gray-900 dark:text-white">{req.requesterEmail}</td>
                <td class="px-4 py-3">
                  <div class="text-gray-900 dark:text-white font-medium">{req.resourceId}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{capitalize(req.resourceType)}</div>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {req.justification ?? "—"}
                </td>
                <td class="px-4 py-3">
                  <span class={statusClass(req.status)}>{capitalize(req.status)}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
                        class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded"
                      >
                        Deny
                      </button>
                    </div>
                  {:else}
                    <span class="text-xs text-gray-400">—</span>
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
