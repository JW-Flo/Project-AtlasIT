<script lang="ts">
  import Skeleton from "$lib/components/ui/skeleton.svelte";
</script>

<div class="space-y-3" aria-busy="true" role="status" aria-label="Loading...">
  <Skeleton class="h-4 w-3/4" />
  <Skeleton class="h-8 w-1/2" />
  <Skeleton class="h-4 w-2/3" />
</div>
