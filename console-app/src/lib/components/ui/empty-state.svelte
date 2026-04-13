<script lang="ts">
  import { cn } from "$lib/utils";
  export let title: string;
  export let description: string | undefined = undefined;
  export let icon: typeof import("lucide-svelte").Inbox | undefined = undefined;
  let className: string = "";
  export { className as class };
</script>

<div
  class={cn(
    "flex flex-col items-center justify-center text-center px-6 py-14 sm:py-20",
    className,
  )}
>
  {#if icon}
    <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary-muted mb-4">
      <svelte:component this={icon} class="w-6 h-6 text-primary" strokeWidth={1.75} />
    </div>
  {/if}
  <h3 class="text-base font-semibold text-foreground">{title}</h3>
  {#if description}
    <p class="mt-1.5 text-sm text-muted-foreground max-w-md">{description}</p>
  {/if}
  {#if $$slots.action}
    <div class="mt-5">
      <slot name="action" />
    </div>
  {/if}
</div>
