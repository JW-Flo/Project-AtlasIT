<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  export let open: boolean = false;
  export let title: string | undefined;
  export let ariaLabel: string | undefined;
  export let close!: () => void;
  let el: HTMLDivElement | null = null;
  let lastFocused: HTMLElement | null = null;

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close?.();
    }
    if (e.key === "Tab") trapFocus(e);
  }

  function trapFocus(e: KeyboardEvent) {
    const focusables = el?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  onMount(() => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement;
      setTimeout(
        () => el?.querySelector<HTMLElement>("[data-autofocus]")?.focus(),
        0
      );
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
  });
  onDestroy(() => {
    document.removeEventListener("keydown", handleKey);
    document.body.style.overflow = "";
    lastFocused?.focus();
  });
</script>

{#if open}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-label={ariaLabel}
    aria-labelledby={title ? "modal-title" : undefined}
  >
    <div class="modal" bind:this={el}>
      {#if title}<h2 id="modal-title">{title}</h2>{/if}
      <div class="modal-body"><slot /></div>
      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 20px;
  }
  .modal {
    background: var(--color-surface-alt);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    width: 100%;
    max-width: 560px;
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }
  .modal-body {
    padding: 20px 22px;
    overflow: auto;
  }
  .modal-footer {
    padding: 12px 22px 18px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
  }
  #modal-title {
    font-size: 18px;
    font-weight: 600;
    margin: 18px 22px 4px;
  }
</style>
