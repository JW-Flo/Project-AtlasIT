<script lang="ts">
  import { cn } from "$lib/utils";
  export let title: string;
  export let description: string | undefined = undefined;
  export let eyebrow: string | undefined = undefined;
  let className: string = "";
  export { className as class };
</script>

<header class={cn("mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
  <div class="min-w-0 flex-1">
    {#if eyebrow}
      <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{eyebrow}</p>
    {/if}
    <h1 class="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">{title}</h1>
    {#if description}
      <p class="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
    {/if}
  </div>
  {#if $$slots.actions}
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  {/if}
</header>
