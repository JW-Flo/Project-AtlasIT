<script lang="ts">
  import { cn } from "$lib/utils";
  import { onDestroy } from "svelte";
  import { X } from "lucide-svelte";

  export let open: boolean = false;
  export let onClose: () => void = () => {};
  export let title: string = "";
  let className: string = "";
  export { className as class };

  let dialogEl: HTMLDivElement | null = null;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  $: if (typeof document !== "undefined") {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  });
</script>

<svelte:window on:keydown={open ? handleKeydown : undefined} />

{#if open}
  <!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click={handleBackdrop}
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- Content -->
    <div
      bind:this={dialogEl}
      class={cn(
        "relative z-50 w-full max-w-lg mx-3 sm:mx-4 rounded-lg border bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto",
        className,
      )}
    >
      {#if title}
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            on:click={onClose}
            class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      {/if}
      <slot />
    </div>
  </div>
{/if}
