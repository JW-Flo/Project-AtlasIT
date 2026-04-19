<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  onMount(() => {
    const qs = $page.url.search;
    window.location.replace("/login" + qs);
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
  <p class="text-sm text-muted-foreground">Redirecting…</p>
</div>
