<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  let policyText = '';
  let evaluating = false;
  let result: any = null;
  let error: string | null = null;
  async function evaluate() {
    if (!policyText) return;
    evaluating = true; error = null; result = null;
    try { result = await ComplianceAPI.evaluatePolicy({ policy: policyText }); }
    catch (e: any) { error = e?.body?.error || 'Evaluation failed'; }
    finally { evaluating = false; }
  }
</script>

<h1>Evaluate Policy</h1>
<form on:submit|preventDefault={evaluate} class="form">
  <textarea placeholder="Paste policy body" bind:value={policyText}></textarea>
  <button disabled={!policyText || evaluating}>Evaluate</button>
</form>
{#if error}<p class="error">{error}</p>{/if}
{#if result}
  <h2>Evaluation Result</h2>
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}

<style>
  .form { display:flex; flex-direction:column; gap:.5rem; max-width:800px; }
  textarea { min-height:160px; background:#111; border:1px solid #333; color:#eee; padding:.5rem; border-radius:4px; font-family:monospace; }
  button { align-self:flex-start; background:#2563eb; color:#fff; border:none; padding:.45rem .9rem; border-radius:4px; cursor:pointer; }
  .error { color:#dc2626; }
  pre { background:#0f172a; padding:1rem; border-radius:6px; max-height:400px; overflow:auto; font-size:.7rem; }
</style>
