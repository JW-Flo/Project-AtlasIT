<script lang="ts">
  import Skeleton from "$lib/components/ui/skeleton.svelte";
</script>

<div class="space-y-2" aria-busy="true" role="status" aria-label="Loading...">
  <Skeleton class="h-3 w-1/3" />
  <Skeleton class="h-12 w-2/3" />
  <Skeleton class="h-3 w-1/2" />
</div>
