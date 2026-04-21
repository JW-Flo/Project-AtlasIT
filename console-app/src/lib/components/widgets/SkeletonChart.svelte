<script lang="ts">
  import Skeleton from "$lib/components/ui/skeleton.svelte";
</script>

<div class="space-y-3" aria-busy="true" role="status" aria-label="Loading chart...">
  <Skeleton class="h-4 w-1/3" />
  <Skeleton class="h-40 w-full rounded-lg" />
  <div class="flex gap-2">
    <Skeleton class="h-3 w-16" />
    <Skeleton class="h-3 w-16" />
    <Skeleton class="h-3 w-16" />
  </div>
</div>
