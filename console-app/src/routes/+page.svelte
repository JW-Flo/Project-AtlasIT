<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  onMount(() => {
    // Client-side redirect: unauthenticated → /login, authenticated → /console
    const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("atlasit_token") : null;
    goto(token ? "/console" : "/login", { replaceState: true });
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
  <div class="text-center text-gray-500 dark:text-gray-400">
    <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" role="status" aria-label="Loading"></div>
    <p class="mt-4">Loading AtlasIT...</p>
  </div>
</div>
