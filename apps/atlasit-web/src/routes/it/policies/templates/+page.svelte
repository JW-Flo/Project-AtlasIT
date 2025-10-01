<script lang="ts">
  import { ComplianceAPI } from '$lib/api/client';
  let templates: any[] = [];
  let error: string | null = null;
  let loading = true;
  (async () => {
    try { templates = (await ComplianceAPI.listPolicyTemplates()).items || []; }
    catch (e: any) { error = e?.body?.error || 'Failed to load templates'; }
    finally { loading = false; }
  })();
</script>

<h1>Policy Templates</h1>
{#if loading}<p>Loading...</p>
{:else if error}<p class="error">{error}</p>
{:else if templates.length === 0}<p>No templates.</p>
{:else}
  <ul class="list">
    {#each templates as t}
      <li><strong>{t.key}</strong> — {t.name || t.title}</li>
    {/each}
  </ul>
{/if}

<style>
  .error { color:#dc2626; }
  ul.list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.4rem; }
  ul.list li { background:#1e1e1e; border:1px solid #333; padding:.5rem .6rem; border-radius:4px; font-size:.85rem; }
</style>
