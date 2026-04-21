<script lang="ts">
  import Skeleton from "$lib/components/ui/skeleton.svelte";

  /** Number of skeleton rows to render. */
  export let rows = 5;
</script>

<div class="space-y-2" aria-busy="true" role="status" aria-label="Loading table...">
  <div class="flex gap-4 pb-2 border-b border-border">
    <Skeleton class="h-4 w-1/4" />
    <Skeleton class="h-4 w-1/3" />
    <Skeleton class="h-4 w-1/6" />
  </div>
  {#each Array(rows) as _}
    <div class="flex gap-4 py-2">
      <Skeleton class="h-4 w-1/4" />
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-4 w-1/6" />
    </div>
  {/each}
</div>
