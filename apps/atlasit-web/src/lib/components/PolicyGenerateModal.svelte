<script lang="ts">
  import AccessibleDialog from './AccessibleDialog.svelte';
  import { ComplianceAPI } from '$lib/api/client';
  import type { GeneratedPolicyResponse, PolicyTemplatesResponse } from '$lib/api/types';
  export let open = false; export let onClose: () => void; export let onGenerated: (p: GeneratedPolicyResponse) => void;
  let templates: string[] = []; let loadingTemplates = false; let error: string | null = null;
  let templateKey = ''; let subject = ''; let generating = false; let result: GeneratedPolicyResponse | null = null;
  async function loadTemplates(){
    if (templates.length || loadingTemplates) return; loadingTemplates = true; error=null;
    try { const r: PolicyTemplatesResponse = await ComplianceAPI.listPolicyTemplates(); templates = r.templates.map(t=>t.key); }
    catch(e:any){ error = e.body?.error || e.message; }
    finally { loadingTemplates=false; }
  }
  $: if (open) loadTemplates();
  async function submit(){
    if(!templateKey) return; generating=true; error=null; result=null;
    try { const r = await ComplianceAPI.generatePolicy({ templateKey, input:{ subject }}); result=r; onGenerated(r); }
    catch(e:any){ error = e.body?.error || e.message; }
    finally { generating=false; }
  }
</script>
<AccessibleDialog {open} title="Generate Policy" {onClose} initialFocus="select">
  {#if error}<p class="error">{error}</p>{/if}
  <form on:submit|preventDefault={submit} class="form">
    <label>Template
      <select bind:value={templateKey} required>
        <option value="" disabled selected hidden>{loadingTemplates ? 'Loading…' : 'Select template'}</option>
        {#each templates as t}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    <label>Subject / System
      <input bind:value={subject} placeholder="ex: payment-service" />
    </label>
    <div class="actions">
      <button type="submit" disabled={!templateKey || generating}>{generating ? 'Generating…' : 'Generate'}</button>
      <button type="button" class="secondary" on:click={onClose}>Cancel</button>
    </div>
  </form>
  {#if result}
    <div class="result">
      <p class="meta">Hash: {result.hash} {result.reused ? '(reused)' : ''}</p>
      <pre>{result.content}</pre>
    </div>
  {/if}
</AccessibleDialog>
<style>
  .form { display:flex; flex-direction:column; gap:.75rem; }
  label { display:flex; flex-direction:column; font-size:.65rem; text-transform:uppercase; letter-spacing:.05em; gap:.35rem; color:#94a3b8; }
  select, input { background:#111; border:1px solid #333; color:#e2e8f0; padding:.5rem .6rem; border-radius:6px; font-size:.75rem; }
  .actions { display:flex; gap:.5rem; }
  button { background:#2563eb; color:#fff; border:none; padding:.55rem .9rem; border-radius:6px; cursor:pointer; font-size:.7rem; }
  button.secondary { background:#334155; }
  button:disabled { opacity:.6; cursor:default; }
  .error { color:#dc2626; font-size:.7rem; }
  .result { margin-top:1rem; }
  .result pre { background:#0f172a; padding:.75rem; border-radius:6px; max-height:280px; overflow:auto; font-size:.65rem; line-height:1.2; }
  .meta { font-size:.6rem; color:#64748b; margin:.25rem 0 .5rem; }
</style>
<!-- TODO: accessible description, focus start field, copy policy button -->
