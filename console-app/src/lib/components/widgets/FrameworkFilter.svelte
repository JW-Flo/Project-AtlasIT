<script lang="ts">
  import { dashboardContext, setFrameworkFilter } from "$lib/stores/dashboard-context";
  import Badge from "$lib/components/ui/badge.svelte";
  import { X } from "lucide-svelte";

  /** Available frameworks to filter by. */
  export let frameworks: string[] = [];
</script>

{#if frameworks.length > 0}
  <div class="flex items-center gap-1.5 flex-wrap">
    <span class="text-xs text-muted-foreground">Filter:</span>
    <button
      class="rounded-md px-2 py-0.5 text-xs transition-colors
        {$dashboardContext.frameworkFilter === null
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
      on:click={() => setFrameworkFilter(null)}
    >
      All
    </button>
    {#each frameworks as fw}
      <button
        class="rounded-md px-2 py-0.5 text-xs transition-colors
          {$dashboardContext.frameworkFilter === fw
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        on:click={() => setFrameworkFilter(fw)}
      >
        {fw}
      </button>
    {/each}
    {#if $dashboardContext.frameworkFilter}
      <button
        class="text-muted-foreground hover:text-foreground"
        on:click={() => setFrameworkFilter(null)}
        title="Clear filter"
      >
        <X class="h-3 w-3" />
      </button>
    {/if}
  </div>
{/if}
