<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
  export let open = false;
  export let title: string | undefined;
  export let labelledBy: string | undefined; // allow external label
  export let description: string | undefined; // optional description id text
  export let initialFocus: string | HTMLElement | undefined; // css selector or element
  export let closeOnEsc = true;
  export let closeOnBackdrop = true;
  export let onClose: (() => void) | undefined;
  export let width = '520px';

  const dispatch = createEventDispatcher<{ close: void }>();

  let dialogEl: HTMLElement | null = null;
  let previouslyFocused: HTMLElement | null = null;

  function close(){ if(onClose) onClose(); dispatch('close'); }

  function handleKey(e: KeyboardEvent){
    if(e.key === 'Escape' && closeOnEsc){ e.stopPropagation(); close(); }
    if(e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e: KeyboardEvent){
    if(!dialogEl) return;
    const focusable = Array.from(dialogEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('inert'));
    if(!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  async function focusInitial(){
    await tick();
    if(!dialogEl) return;
    if(typeof initialFocus === 'string'){
      const el = dialogEl.querySelector<HTMLElement>(initialFocus);
      if(el) { el.focus(); return; }
    } else if(initialFocus instanceof HTMLElement){
      initialFocus.focus(); return;
    }
    // fallback to first focusable
    const first = dialogEl.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();
  }

  onMount(()=>{
    if(open){ previouslyFocused = document.activeElement as HTMLElement; focusInitial(); }
  });

  $: if(open){
    // store focus when opening
    if(!previouslyFocused) previouslyFocused = document.activeElement as HTMLElement;
    setTimeout(()=>focusInitial(),0);
  }

  onDestroy(()=>{
    if(previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
  });
</script>

{#if open}
  <div class="dialog-backdrop" role="presentation" on:click={() => closeOnBackdrop && close()} />
  <div class="dialog-root" bind:this={dialogEl} role="dialog" aria-modal="true" {title} {ariaLabelledby} {ariaDescribedby} style={`--dialog-width:${width}`} on:keydown={handleKey}>
    <div class="dialog-panel" on:click|stopPropagation>
      <header class="dialog-head">
        {#if title}
          <h2 id={labelledBy}>{title}</h2>
        {/if}
        <button class="close" aria-label="Close dialog" on:click={close}>×</button>
      </header>
      <div class="dialog-body">
        <slot />
      </div>
      <slot name="footer" />
    </div>
  </div>
{/if}

<script lang="ts">
  // computed aria attributes
  $: ariaLabelledby = labelledBy || (title ? 'dialog-title-auto' : undefined);
  $: ariaDescribedby = description ? 'dialog-desc-auto' : undefined;
</script>

<style>
  .dialog-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:200; animation:fadeBg .18s ease; }
  .dialog-root { position:fixed; inset:0; display:flex; justify-content:center; align-items:flex-start; padding:4rem 1rem 2rem; z-index:201; overflow:auto; }
  .dialog-panel { background:#0f172a; border:1px solid #334155; border-radius:10px; width:100%; max-width:var(--dialog-width,520px); box-shadow:0 8px 28px -6px rgba(0,0,0,.55); animation:fadeIn .18s ease; display:flex; flex-direction:column; }
  .dialog-head { display:flex; align-items:center; justify-content:space-between; padding:.85rem 1rem .6rem; border-bottom:1px solid #1e293b; }
  .dialog-head h2 { margin:0; font-size:.9rem; letter-spacing:.05em; text-transform:uppercase; color:#cbd5e1; }
  .close { background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem; line-height:1; padding:.25rem; }
  .close:hover { color:#fff; }
  .dialog-body { padding:1rem 1rem 1.25rem; font-size:.8rem; }
  @media (max-width:640px){ .dialog-root { padding:2.5rem .6rem 1rem; } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
  @keyframes fadeBg { from { opacity:0;} to { opacity:1;} }
</style>
