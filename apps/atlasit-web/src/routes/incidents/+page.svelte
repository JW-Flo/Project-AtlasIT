<script lang="ts">
  import {
    createIncident,
    resolveIncident,
    listIncidents,
  } from "$lib/api/incidents";
  import type { IncidentRecord } from "$lib/api/types";
  import { pushToast } from "$lib/stores/toasts";
  import { relativeTime } from "$lib/utils/relativeTime";

  export let data: {
    incidents: IncidentRecord[];
    nextCursor: number | null;
    statusFilter: string | null;
    severityFilter: string | null;
    error?: string | null;
  };

  let items: IncidentRecord[] = data.incidents;
  let nextCursor: number | null = data.nextCursor;
  let statusFilter = data.statusFilter;
  let severityFilter = data.severityFilter;
  let loadingMore = false;
  let submitting = false;

  let form = { title: "", description: "", severity: "medium" };

  async function refresh(reset = false) {
    try {
      const res = await listIncidents({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        cursor: reset ? undefined : nextCursor || undefined,
        limit: 25,
      });
      if (reset) items = res.items;
      else items = [...items, ...res.items];
      nextCursor = res.nextCursor ?? null;
    } catch (e: any) {
      pushToast({
        id: "inc-refresh-error",
        message: e?.message || "Refresh failed",
        kind: "error",
      });
    }
  }

  async function submitCreate() {
    if (!form.title || !form.description) return;
    submitting = true;
    try {
      const created = await createIncident({
        title: form.title,
        description: form.description,
        severity: form.severity as any,
      });
      items = [created, ...items];
      pushToast({
        id: "inc-create",
        message: "Incident created",
        kind: "success",
        timeoutMs: 3000,
      });
      form = { title: "", description: "", severity: form.severity };
    } catch (e: any) {
      pushToast({
        id: "inc-create-err",
        message: e?.message || "Create failed",
        kind: "error",
        timeoutMs: 4000,
      });
    } finally {
      submitting = false;
    }
  }

  async function actResolve(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    // Optimistic
    items = items.map((i) =>
      i.id === id
        ? { ...i, status: "resolved", resolvedAt: new Date().toISOString() }
        : i
    );
    try {
      const updated = await resolveIncident(id);
      items = items.map((i) => (i.id === id ? updated : i));
      pushToast({
        id: "inc-resolve",
        message: "Incident resolved",
        kind: "success",
        timeoutMs: 2500,
      });
    } catch (e: any) {
      items = items.map((i) => (i.id === id ? prev : i));
      pushToast({
        id: "inc-resolve-err",
        message: e?.message || "Resolve failed",
        kind: "error",
        timeoutMs: 4000,
      });
    }
  }

  function applyFilters() {
    nextCursor = null;
    refresh(true);
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>Security Incidents</h1>
    <div class="filters">
      <label
        >Status:
        <select bind:value={statusFilter} on:change={applyFilters}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label
        >Severity:
        <select bind:value={severityFilter} on:change={applyFilters}>
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
    </div>
  </header>

  <section class="create-card">
    <h2>Create Incident</h2>
    <div class="form-row">
      <input placeholder="Title" bind:value={form.title} />
      <input placeholder="Description" bind:value={form.description} />
      <select bind:value={form.severity}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <button
        on:click={submitCreate}
        disabled={submitting || !form.title || !form.description}
        >{submitting ? "Creating…" : "Create"}</button
      >
    </div>
  </section>

  {#if data.error}
    <div class="alert error">{data.error}</div>
  {/if}

  <section class="list-card">
    <h2>Incidents ({items.length})</h2>
    {#if !items.length}
      <div class="empty">No incidents.</div>
    {:else}
      <table class="incidents-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Created</th>
            <th>Resolved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as inc}
            <tr class={inc.status + " " + inc.severity}>
              <td>{inc.id}</td>
              <td>{inc.title}</td>
              <td class="sev {inc.severity}">{inc.severity}</td>
              <td>{inc.status}</td>
              <td title={inc.createdAt}>{relativeTime(inc.createdAt)}</td>
              <td>{inc.resolvedAt ? relativeTime(inc.resolvedAt) : "—"}</td>
              <td class="actions">
                {#if inc.status === "open"}
                  <button on:click={() => actResolve(inc.id)}>Resolve</button>
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
  .filters {
    display: flex;
    gap: 0.75rem;
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
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    align-items: center;
  }
  .form-row input,
  .form-row select {
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #e5e7eb;
    border-radius: 6px;
    padding: 0.45rem 0.6rem;
    font-size: 0.8rem;
  }
  .form-row button {
    background: #dc2626;
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
  .incidents-table {
    width: 100%;
    border-collapse: collapse;
  }
  .incidents-table th,
  .incidents-table td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid #1f2933;
    font-size: 0.75rem;
  }
  .incidents-table th {
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-size: 0.65rem;
    color: #9ca3af;
    text-align: left;
  }
  .incidents-table tr.open td {
    background: #1a1f29;
  }
  .incidents-table tr.resolved td {
    background: #132618;
  }
  .sev.low {
    color: #10b981;
  }
  .sev.medium {
    color: #fbbf24;
  }
  .sev.high {
    color: #f97316;
  }
  .sev.critical {
    color: #ef4444;
    font-weight: 600;
  }
  .actions button {
    font-size: 0.6rem;
    padding: 0.35rem 0.5rem;
    margin-right: 0.3rem;
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
