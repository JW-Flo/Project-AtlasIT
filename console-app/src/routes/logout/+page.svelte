<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    try {
      sessionStorage.removeItem("atlasit_token");
      sessionStorage.removeItem("atlasit_user");
      localStorage.removeItem("atlasit_compliance_cache");
    } catch {}
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.replace("/login");
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
  <p class="text-sm text-muted-foreground">Signing you out…</p>
</div>
