<script lang="ts">
  import { onMount } from "svelte";
  import {
    createAccessRequest,
    transitionAccessRequest,
    listAccessRequests,
  } from "$lib/api/accessRequests";
  import type { AccessRequest } from "$lib/api/types";
  import { pushToast } from "$lib/stores/toasts";
  import { relativeTime } from "$lib/utils/relativeTime";

  export let data: {
    requests: AccessRequest[];
    nextCursor: number | null;
    statusFilter: string | null;
    error?: string | null;
  };

  let items: AccessRequest[] = data.requests;
  let nextCursor: number | null = data.nextCursor;
  let statusFilter = data.statusFilter;
  let creating = false;
  let loadingMore = false;
  let form = { subjectRef: "", resource: "", justification: "" };
  let submitting = false;

  async function refresh(reset = false) {
    try {
      const res = await listAccessRequests({
        status: statusFilter || undefined,
        cursor: reset ? undefined : nextCursor || undefined,
        limit: 25,
      });
      if (reset) items = res.items;
      else items = [...items, ...res.items];
      nextCursor = res.nextCursor ?? null;
    } catch (e: any) {
      pushToast({
        id: "access-refresh-error",
        message: e?.message || "Refresh failed",
        kind: "error",
      });
    }
  }

  async function submitCreate() {
    if (!form.subjectRef || !form.resource) return;
    submitting = true;
    try {
      const created = await createAccessRequest({
        subjectRef: form.subjectRef,
        resource: form.resource,
        justification: form.justification || undefined,
      });
      items = [created, ...items];
      pushToast({
        id: "access-create",
        message: "Access request created",
        kind: "success",
        timeoutMs: 3000,
      });
      form = { subjectRef: "", resource: "", justification: "" };
    } catch (e: any) {
      pushToast({
        id: "access-create-error",
        message: e?.message || "Create failed",
        kind: "error",
        timeoutMs: 4000,
      });
    } finally {
      submitting = false;
    }
  }

  async function act(id: number, action: "approve" | "deny" | "fulfill") {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    // Optimistic
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
      pushToast({
        id: `access-${action}`,
        message: `Request ${action}d`,
        kind: "success",
        timeoutMs: 2500,
      });
    } catch (e: any) {
      items = items.map((r) => (r.id === id ? prev : r)); // revert
      pushToast({
        id: `access-${action}-err`,
        message: e?.message || "Action failed",
        kind: "error",
        timeoutMs: 4000,
      });
    }
  }

  function applyFilter(newStatus: string | null) {
    statusFilter = newStatus;
    nextCursor = null;
    refresh(true);
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Access Requests</h1>
    <div class="filters">
      <label
        >Status:
        <select
          bind:value={statusFilter}
          on:change={(e) =>
            applyFilter((e.target as HTMLSelectElement).value || null)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </label>
    </div>
  </header>

  <section class="create-card">
    <h2>Create Request</h2>
    <div class="form-row">
      <input
        placeholder="Subject Ref (e.g. user:alice@example.com)"
        bind:value={form.subjectRef}
      />
      <input
        placeholder="Resource (e.g. repo:internal-tools)"
        bind:value={form.resource}
      />
      <input
        placeholder="Justification (optional)"
        bind:value={form.justification}
      />
      <button
        on:click={submitCreate}
        disabled={submitting || !form.subjectRef || !form.resource}
        >{submitting ? "Creating…" : "Create"}</button
      >
    </div>
  </section>

  {#if data.error}
    <div class="alert error">{data.error}</div>
  {/if}

  <section class="list-card">
    <h2>Requests ({items.length})</h2>
    {#if !items.length}
      <div class="empty">No access requests.</div>
    {:else}
      <table class="requests-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Resource</th>
            <th>Status</th>
            <th>Created</th>
            <th>Decided</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as r}
            <tr class={r.status}>
              <td>{r.id}</td>
              <td>{r.subject}</td>
              <td>{r.resource}</td>
              <td>{r.status}</td>
              <td title={r.createdAt}>{relativeTime(r.createdAt)}</td>
              <td>{r.decidedAt ? relativeTime(r.decidedAt) : "—"}</td>
              <td class="actions">
                {#if r.status === "pending"}
                  <button on:click={() => act(r.id, "approve")}>Approve</button>
                  <button on:click={() => act(r.id, "deny")}>Deny</button>
                {:else if r.status === "approved"}
                  <button on:click={() => act(r.id, "fulfill")}>Fulfill</button>
                {:else}
                  <span class="muted">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if nextCursor}
        <div class="pager">
          <button
            disabled={loadingMore}
            on:click={() => {
              loadingMore = true;
              refresh(false).finally(() => (loadingMore = false));
            }}>{loadingMore ? "Loading…" : "Load more"}</button
          >
        </div>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0.5rem 0 2rem;
  }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  h1 {
    margin: 0;
    font-size: 1.6rem;
  }
  .filters select {
    background: #111;
    color: #eee;
    border: 1px solid #333;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
  }
  .create-card,
  .list-card {
    background: #111;
    border: 1px solid #1f2933;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .create-card h2,
  .list-card h2 {
    margin: 0;
    font-size: 1rem;
  }
  .form-row {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: center;
  }
  .form-row input {
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #e5e7eb;
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    font-size: 0.8rem;
  }
  .form-row button {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }
  .form-row button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .requests-table {
    width: 100%;
    border-collapse: collapse;
  }
  .requests-table th,
  .requests-table td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid #1f2933;
    font-size: 0.75rem;
  }
  .requests-table th {
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-size: 0.65rem;
    color: #9ca3af;
    text-align: left;
  }
  .requests-table tr.pending td {
    background: #17191d;
  }
  .requests-table tr.approved td {
    background: #132618;
  }
  .requests-table tr.denied td {
    background: #2a1414;
  }
  .requests-table tr.fulfilled td {
    background: #1a2331;
  }
  .actions button {
    font-size: 0.6rem;
    padding: 0.35rem 0.5rem;
    margin-right: 0.3rem;
  }
  .actions button:last-child {
    margin-right: 0;
  }
  .muted {
    opacity: 0.5;
    font-size: 0.65rem;
  }
  .pager {
    margin-top: 0.75rem;
  }
  .pager button {
    background: #1f2937;
    border: 1px solid #334155;
    color: #e5e7eb;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
  }
  .empty {
    padding: 1rem 0;
    color: #9ca3af;
    font-size: 0.85rem;
  }
  .alert.error {
    background: #331414;
    border: 1px solid #f87171;
    color: #fecaca;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
  }
</style>
