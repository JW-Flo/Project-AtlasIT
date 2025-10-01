<script lang="ts">
  export let open = false;
  export let title: string | undefined;
  export let width = '520px';
  export let onClose: (() => void) | undefined;
  function close() { if (onClose) onClose(); }
  function esc(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
</script>
{#if open}
  <div class="modal-backdrop" on:click={close} on:keydown={esc} tabindex="-1">
    <div class="modal-panel" style={`max-width:${width}`} on:click|stopPropagation>
      <header class="modal-head">
        {#if title}<h2>{title}</h2>{/if}
        <button class="close" on:click={close} aria-label="Close">×</button>
      </header>
      <div class="modal-body"><slot /></div>
      <slot name="footer" />
    </div>
  </div>
{/if}
<style>
  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:flex-start; justify-content:center; padding:4rem 1rem 2rem; z-index:200; }
  .modal-panel { background:#0f172a; border:1px solid #334155; border-radius:10px; width:100%; box-shadow:0 8px 28px -6px rgba(0,0,0,.55); animation:fadeIn .18s ease; }
  .modal-head { display:flex; align-items:center; justify-content:space-between; padding:.85rem 1rem .6rem; border-bottom:1px solid #1e293b; }
  .modal-head h2 { margin:0; font-size:.9rem; letter-spacing:.05em; text-transform:uppercase; color:#cbd5e1; }
  .close { background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem; line-height:1; padding:.25rem; }
  .close:hover { color:#fff; }
  .modal-body { padding:1rem 1rem 1.25rem; font-size:.8rem; }
  @media (max-width:640px){ .modal-backdrop { padding:2.5rem .6rem 1rem; } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
</style>
<!-- TODO: focus trap & return focus on close -->
<!-- TODO: ARIA role=dialog aria-modal=true labeling -->
