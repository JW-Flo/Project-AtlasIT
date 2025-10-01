<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  let framework = '';
  let coverage: any = null;
  let error: string | null = null;
  let loading = false;
  async function loadCoverage() {
    loading = true; error = null; coverage = null;
    try { coverage = await ComplianceAPI.coverage(framework || undefined); }
    catch (e: any) { error = e?.body?.error || 'Coverage load failed'; }
    finally { loading = false; }
  }
</script>

<h1>Policy Coverage</h1>
<form on:submit|preventDefault={loadCoverage} class="form">
  <input placeholder="Framework (optional)" bind:value={framework} />
  <button disabled={loading}>Load</button>
</form>
{#if error}<p class="error">{error}</p>{/if}
{#if loading}<p>Loading...</p>{/if}
{#if coverage}
  <h2>Results</h2>
  <pre>{JSON.stringify(coverage, null, 2)}</pre>
{/if}

<style>
  .form { display:flex; gap:.5rem; margin-bottom:1rem; }
  input { background:#111; border:1px solid #333; color:#eee; padding:.4rem .5rem; border-radius:4px; }
  button { background:#2563eb; color:#fff; border:none; padding:.45rem .9rem; border-radius:4px; cursor:pointer; }
  .error { color:#dc2626; }
  pre { background:#0f172a; padding:1rem; border-radius:6px; max-height:400px; overflow:auto; font-size:.7rem; }
</style>
