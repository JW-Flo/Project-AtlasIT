<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="max-w-md w-full space-y-4 px-4 text-center">
    <h1 class="text-2xl font-semibold">Something went wrong</h1>
    <p class="text-sm text-muted-foreground">{$page.error?.message || "An unexpected error occurred"}</p>
    <p class="text-xs text-muted-foreground">Path: {$page.url.pathname}</p>
    <div class="flex gap-2 justify-center">
      <button
        class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
        on:click={() => window.location.reload()}
      >Reload page</button>
      <a
        href="/console"
        class="px-4 py-2 rounded-md border text-sm hover:bg-muted"
      >Go to dashboard</a>
    </div>
  </div>
</div>
