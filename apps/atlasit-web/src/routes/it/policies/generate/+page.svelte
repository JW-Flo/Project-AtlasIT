<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  let templateKey = '';
  let subject = '';
  let generating = false;
  let result: any = null;
  let error: string | null = null;
  async function generate() {
    if (!templateKey) return;
    generating = true; error = null; result = null;
    try {
      result = await ComplianceAPI.generatePolicy({ templateKey, subject });
    } catch (e: any) {
      error = e?.body?.error || 'Generation failed';
    } finally { generating = false; }
  }
</script>

<h1>Generate Policy</h1>
<form on:submit|preventDefault={generate} class="form">
  <input placeholder="Template key" bind:value={templateKey} />
  <input placeholder="Subject / system" bind:value={subject} />
  <button disabled={!templateKey || generating}>Generate</button>
</form>
{#if error}<p class="error">{error}</p>{/if}
{#if result}
  <h2>Generated Policy</h2>
  <pre>{result.content || JSON.stringify(result, null, 2)}</pre>
{/if}

<style>
  .form { display:flex; gap:.5rem; margin-bottom:1rem; }
  input { background:#111; border:1px solid #333; color:#eee; padding:.4rem .5rem; border-radius:4px; }
  button { background:#2563eb; color:#fff; border:none; padding:.45rem .9rem; border-radius:4px; cursor:pointer; }
  .error { color:#dc2626; }
  pre { background:#0f172a; padding:1rem; border-radius:6px; max-height:400px; overflow:auto; font-size:.7rem; }
</style>
