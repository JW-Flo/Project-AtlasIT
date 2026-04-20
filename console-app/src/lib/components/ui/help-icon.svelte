<script lang="ts">
  import { HelpCircle } from "lucide-svelte";
  import { marked } from "marked";
  import { cn } from "$lib/utils";
  import { preferences } from "$lib/stores/preferences";

  export let content: string;
  export let placement: "top" | "bottom" | "left" | "right" = "top";

  $: showHelp = $preferences.showHelpIcons;

  let visible = false;
  let buttonEl: HTMLButtonElement | null = null;
  let tooltipEl: HTMLDivElement | null = null;

  function updatePosition() {
    if (!buttonEl || !tooltipEl || !visible) return;

    const buttonRect = buttonEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = buttonRect.top - tooltipRect.height - 8;
        left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "bottom":
        top = buttonRect.bottom + 8;
        left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "left":
        top = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
        left = buttonRect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
        left = buttonRect.right + 8;
        break;
    }

    // Clamp to viewport
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }

  function show() {
    visible = true;
    requestAnimationFrame(updatePosition);
  }

  function hide() {
    visible = false;
  }

  function toggle() {
    if (visible) hide();
    else show();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") hide();
  }

  $: parsedContent = marked.parse(content, { async: false }) as string;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showHelp}

  <button
    bind:this={buttonEl}
    type="button"
    aria-label="Help"
    class={cn(
      "inline-flex items-center justify-center w-4 h-4 ml-1",
      "text-muted-foreground hover:text-foreground",
      "transition-colors duration-150",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
    )}
    on:mouseenter={show}
    on:mouseleave={hide}
    on:click={toggle}
    on:focus={show}
    on:blur={hide}
  >
    <HelpCircle class="w-4 h-4" />
  </button>

  {#if visible}
    <div
      bind:this={tooltipEl}
      role="tooltip"
      class={cn(
        "fixed z-50 max-w-xs px-3 py-2 text-sm",
        "bg-popover border border-border rounded-md shadow-lg",
        "text-popover-foreground",
        "prose prose-sm dark:prose-invert max-w-none"
      )}
    >
      {@html parsedContent}
    </div>
  {/if}
{/if}

<style>
  /* Override prose styles to fit popover */
  :global(.prose) {
    @apply text-sm;
  }

  :global(.prose p) {
    @apply my-1;
  }

  :global(.prose p:first-child) {
    @apply mt-0;
  }

  :global(.prose p:last-child) {
    @apply mb-0;
  }

  :global(.prose code) {
    @apply text-xs px-1 py-0.5 rounded bg-muted;
  }
</style>
