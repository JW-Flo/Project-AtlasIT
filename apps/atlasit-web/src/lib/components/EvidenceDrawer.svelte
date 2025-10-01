<script lang="ts">
  import { onMount } from 'svelte';
  import type { EvidenceSearchResponse, EvidenceSearchItem, EvidenceVerifyResponse, ActivityEvent } from '../api/types';
  import { searchEvidence, verifyEvidence } from '../api/evidence';
  import { relativeTime } from '../utils/relativeTime';
  import { createEventDispatcher } from 'svelte';
  import AccessibleDialog from './AccessibleDialog.svelte';

  export let open = false;
  export let tenantId: string | undefined;
  export let framework: string | undefined; // reserved for future filtering

  // synthetic activity dispatch on verify success
  const dispatch = createEventDispatcher<{ activity: ActivityEvent }>();

  let loading = false;
  let verifying: string | null = null;
  let error: string | null = null;
  let items: EvidenceSearchItem[] = [];
  let nextCursor: string | null | undefined = null;
  let search = '';
  let debounceTimer: any;

  async function load(reset = false) {
    if (!open) return;
    if (reset) {
      items = [];
      nextCursor = null;
    }
    loading = true; error = null;
    try {
      const res: EvidenceSearchResponse = await searchEvidence({ subject: search || undefined, limit: 25, cursor: reset ? undefined : nextCursor || undefined });
      if (reset) items = res.items; else items = [...items, ...res.items];
      nextCursor = res.nextCursor || null;
    } catch (e: any) {
      error = e?.message || 'Failed to load evidence';
    } finally { loading = false; }
  }

  function onSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    search = value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => load(true), 300);
  }

  async function onVerify(hash: string) {
    verifying = hash; error = null;
    try {
      const res: EvidenceVerifyResponse = await verifyEvidence(hash);
      // optimistic highlight update (could add a verified flag locally)
      dispatch('activity', {
        id: Date.now(),
        tenantId: tenantId || 'tenant',
        type: 'evidence.verify',
        severity: res.integrity ? 'info' : 'warn',
        ref: res.hash,
        message: `Evidence ${res.hash.slice(0,8)} integrity ${res.integrity ? 'OK' : 'MISMATCH'}`,
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      error = e?.message || 'Verify failed';
    } finally { verifying = null; }
  }

  onMount(() => {
    if (open) load(true);
  });

  $: if (open && items.length === 0 && !loading) load(true);
</script>

{#if open}
  <AccessibleDialog {open} title="Evidence" onClose={() => (open=false)} closeOnBackdrop={true} width="420px">
    <div class="drawer"> <!-- retain existing drawer styling inside dialog for now -->
    <div class="header">
      <h3 id="evidence-heading">Evidence</h3>
      <input placeholder="Search subject" on:input={onSearchInput} />
    </div>
    {#if error}<div class="error">{error}</div>{/if}
    <div class="body">
      {#if loading && items.length === 0}
        <div class="loading">Loading…</div>
      {:else if items.length === 0}
        <div class="empty">No evidence</div>
      {:else}
        <ul>
          {#each items as ev}
            <li class="ev-item">
              <div class="meta">
                <code>{ev.hash.slice(0,12)}</code>
                <span class="subject">{ev.subject || '—'}</span>
                <span class="time" title={ev.createdAt}>{relativeTime(ev.createdAt)}</span>
              </div>
              <div class="actions">
                <button disabled={verifying === ev.hash} on:click={() => onVerify(ev.hash)}>
                  {verifying === ev.hash ? 'Verifying…' : 'Verify'}
                </button>
              </div>
            </li>
          {/each}
        </ul>
        {#if nextCursor}
          <button class="load-more" disabled={loading} on:click={() => load(false)}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        {/if}
      {/if}
    </div>
    </div>
  </AccessibleDialog>
{/if}

<style>
  .drawer { position: fixed; top:0; right:0; width: 380px; max-width:100%; height:100%; background:#111; color:#eee; box-shadow: -2px 0 8px rgba(0,0,0,0.4); display:flex; flex-direction:column; z-index: 70; }
  .header { padding: 0.75rem 0.9rem; border-bottom:1px solid #222; display:flex; flex-direction:column; gap:0.5rem; }
  .header h3 { margin:0; font-size:1rem; }
  .header input { padding:0.4rem 0.55rem; background:#181818; border:1px solid #333; color:#eee; border-radius:4px; font-size:0.85rem; }
  .body { flex:1; overflow-y:auto; padding:0.5rem 0.75rem 1rem; font-size:0.8rem; }
  ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.5rem; }
  .ev-item { border:1px solid #222; padding:0.5rem 0.55rem; border-radius:4px; background:#161616; display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
  .meta { display:flex; flex-direction:column; gap:0.15rem; }
  code { font-size:0.7rem; background:#202020; padding:2px 4px; border-radius:3px; }
  .subject { font-weight:500; }
  .time { color:#888; font-size:0.65rem; }
  button { cursor:pointer; background:#242424; color:#ddd; border:1px solid #333; padding:0.3rem 0.6rem; font-size:0.7rem; border-radius:4px; }
  button:hover:not(:disabled) { background:#2d2d2d; }
  button:disabled { opacity:0.5; cursor:default; }
  .load-more { margin-top:0.75rem; width:100%; }
  .error { padding:0.5rem 0.75rem; color:#ff6666; font-size:0.7rem; }
  .empty, .loading { padding:1rem; text-align:center; color:#777; }
</style>
