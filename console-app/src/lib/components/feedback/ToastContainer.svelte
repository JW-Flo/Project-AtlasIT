<script lang="ts">
  import { toasts, dismiss } from "./toastStore";
  import Button from "../primitives/Button.svelte";
  import { fly } from "svelte/transition";
  let list = [] as any[];
  const unsub = toasts.subscribe((v) => (list = v));
  import { onDestroy } from "svelte";
  onDestroy(unsub);
  const variantClass = (v?: string) =>
    v === "success"
      ? "toast-success"
      : v === "error"
        ? "toast-error"
        : v === "warning"
          ? "toast-warning"
          : "toast-info";
</script>

<div class="toast-host" role="region" aria-live="polite">
  {#each list as t (t.id)}
    <div
      class="toast {variantClass(t.variant)}"
      in:fly={{ y: 10, duration: 140 }}
      out:fly={{ y: -6, duration: 120 }}
    >
      <div class="content">
        {#if t.title}<strong>{t.title}</strong>{/if}
        <div class="msg">{t.message}</div>
      </div>
      <Button
        size="sm"
        variant="subtle"
        ariaLabel="Dismiss"
        on:click={() => dismiss(t.id)}>✕</Button
      >
    </div>
  {/each}
</div>

<style>
  .toast-host {
    position: fixed;
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 320px;
    z-index: 200;
  }
  .toast {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 8px;
    padding: 10px 12px 10px 12px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  }
  .toast-info {
    border-color: var(--color-border);
  }
  .toast-success {
    border-color: var(--color-success);
  }
  .toast-error {
    border-color: var(--color-critical);
  }
  .toast-warning {
    border-color: var(--color-warning);
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  .content strong {
    font-size: 13px;
    display: block;
    margin-bottom: 2px;
  }
  .msg {
    font-size: 12px;
    line-height: 1.3;
  }
</style>
