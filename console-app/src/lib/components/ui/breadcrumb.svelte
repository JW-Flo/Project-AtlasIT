<script lang="ts">
  import { ChevronRight } from "lucide-svelte";

  export let segments: Array<{ label: string; href?: string }>;
</script>

<nav aria-label="Breadcrumb" class="flex items-center gap-2 text-sm">
  {#each segments as segment, i}
    {#if i > 0}
      <ChevronRight class="w-4 h-4 text-muted-foreground" />
    {/if}
    {#if segment.href && i < segments.length - 1}
      <a href={segment.href} class="text-muted-foreground hover:text-foreground transition-colors">
        {segment.label}
      </a>
    {:else}
      <span class="text-foreground font-medium">{segment.label}</span>
    {/if}
  {/each}
</nav>
