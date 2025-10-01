<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  let tenantId = '';
  let pack = '';
  let subject = '';
  let limit = 25;
  let loading = false;
  let results: any[] = [];
  let error: string | null = null;
  let verifyHash = '';
  let verifyResult: any = null;

  async function search() {
    loading = true; error = null; results = [];
    try {
      const r = await ComplianceAPI.searchEvidence({ tenantId, pack, subject, limit });
      results = r.items || [];
    } catch (e: any) { error = e?.body?.error || 'Search failed'; }
    finally { loading = false; }
  }

  async function verify() {
    if (!verifyHash) return;
    verifyResult = null; error = null;
    try { verifyResult = await ComplianceAPI.verifyEvidence(verifyHash); }
    catch (e: any) { error = e?.body?.error || 'Verify failed'; }
  }
</script>

<h1>Evidence</h1>
<form class="search" on:submit|preventDefault={search}>
  <input placeholder="Tenant" bind:value={tenantId} />
  <input placeholder="Pack" bind:value={pack} />
  <input placeholder="Subject" bind:value={subject} />
  <input type="number" min="1" max="200" bind:value={limit} />
  <button disabled={loading}>Search</button>
</form>
{#if error}<p class="error">{error}</p>{/if}
{#if loading}<p>Loading...</p>
{:else if results.length === 0}<p>No results.</p>
{:else}
  <table class="results">
    <thead><tr><th>Hash</th><th>Pack</th><th>Subject</th><th>Created</th></tr></thead>
    <tbody>
      {#each results as ev}
        <tr>
          <td class="mono">{ev.hash?.slice(0,12)}…</td>
          <td>{ev.pack}</td>
            <td>{ev.subject}</td>
          <td>{ev.createdAt?.slice(0,19).replace('T',' ')}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<h2>Verify Evidence Hash</h2>
<form class="verify" on:submit|preventDefault={verify}>
  <input placeholder="Hash" bind:value={verifyHash} class="wide" />
  <button>Verify</button>
</form>
{#if verifyResult}
  <pre class="verify-out">{JSON.stringify(verifyResult, null, 2)}</pre>
{/if}

<style>
  h1 { margin:0 0 1rem; }
  form.search, form.verify { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1rem; }
  input { background:#111; border:1px solid #333; color:#eee; padding:.4rem .5rem; border-radius:4px; }
  input.wide { flex:1; }
  button { background:#2563eb; color:#fff; border:none; padding:.45rem .9rem; border-radius:4px; cursor:pointer; }
  table.results { width:100%; border-collapse:collapse; font-size:.75rem; }
  table.results th, table.results td { padding:.35rem .45rem; border-bottom:1px solid #222; text-align:left; }
  .mono { font-family:monospace; }
  .error { color:#dc2626; }
  pre.verify-out { background:#0f172a; padding:1rem; border-radius:6px; max-height:300px; overflow:auto; font-size:.65rem; }
</style>
