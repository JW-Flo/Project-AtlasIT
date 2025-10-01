<script lang="ts">
  import { toasts } from '../stores/toasts';
  import { fly, fade } from 'svelte/transition';
  import { onDestroy } from 'svelte';
  let list = [] as import('../stores/toasts').Toast[];
  const unsub = toasts.subscribe(v=> list = v);
  onDestroy(unsub);
</script>
<div class="toast-region" aria-live="polite" aria-atomic="false">
  {#each list as t (t.id)}
    <div class="toast {t.variant}" in:fly={{y:12,duration:120}} out:fade={{duration:120}} role="status">
      <div class="msg">{t.message}</div>
      {#if t.dismissible !== false}
        <button class="close" aria-label="Dismiss" on:click={() => toasts.dismiss(t.id)}>×</button>
      {/if}
    </div>
  {/each}
</div>
<style>
.toast-region { position:fixed; bottom:1rem; right:1rem; display:flex; flex-direction:column; gap:.5rem; z-index:500; max-width:280px; }
.toast { background:#1e293b; color:#e2e8f0; padding:.6rem .75rem; border-radius:6px; font-size:.7rem; box-shadow:0 4px 14px -2px rgba(0,0,0,.5); display:flex; align-items:center; gap:.5rem; border:1px solid #334155; }
.toast.success { border-color:#15803d; }
.toast.error { border-color:#dc2626; }
.toast.warn { border-color:#d97706; }
.toast .close { background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:.9rem; line-height:1; padding:0 .25rem; }
.toast .close:hover { color:#fff; }
.msg { flex:1; }
</style>
