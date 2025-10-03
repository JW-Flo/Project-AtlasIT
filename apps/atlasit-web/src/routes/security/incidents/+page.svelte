<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  export let data: any;
  let creating = false;
  let title = '';
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let error: string | null = null;
  let items = data.incidents?.items || [];

  async function createIncident() {
    if (!title) return;
    creating = true;
    error = null;
    const optimistic = { id: 'tmp-' + Date.now(), title, severity, status: 'open', createdAt: new Date().toISOString() };
    items = [optimistic, ...items];
    try {
      const real = await ComplianceAPI.createIncident({ title, severity });
      items = items.map(i => i.id === optimistic.id ? real : i);
      title = '';
      severity = 'low';
    } catch (e: any) {
      error = e?.body?.error || 'Create failed';
      items = items.filter(i => i.id !== optimistic.id);
    } finally {
      creating = false;
    }
  }
</script>

<h1>Security Incidents</h1>
{#if data.error}
  <p class="error">{data.error}</p>
{/if}
<form class="create" on:submit|preventDefault={createIncident}>
  <input placeholder="Title" bind:value={title} />
  <select bind:value={severity}>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
    <option value="critical">Critical</option>
  </select>
  <button disabled={!title || creating}>Create</button>
</form>
{#if error}<p class="error">{error}</p>{/if}

<table class="list">
  <thead>
    <tr><th>Title</th><th>Severity</th><th>Status</th><th>Created</th></tr>
  </thead>
  <tbody>
    {#each items as inc}
      <tr>
        <td>{inc.title}</td>
        <td>{inc.severity}</td>
        <td>{inc.status}</td>
        <td>{inc.createdAt?.slice(0,19).replace('T',' ')}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  h1 { margin:0 0 1rem; }
  form.create { display:flex; gap:.5rem; margin-bottom:1rem; }
  input, select { background:#111; border:1px solid #333; color:#eee; padding:.4rem .5rem; border-radius:4px; }
  button { background:#2563eb; color:#fff; border:none; padding:.45rem .9rem; border-radius:4px; cursor:pointer; }
  button:disabled { opacity:.5; cursor:default; }
  table.list { width:100%; border-collapse:collapse; font-size:.85rem; }
  table.list th, table.list td { padding:.4rem .5rem; border-bottom:1px solid #222; text-align:left; }
  .error { color:#dc2626; }
</style>
