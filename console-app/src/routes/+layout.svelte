<script lang="ts">
  import "../app.css";
  import AppFrame from "$lib/components/layout/AppFrame.svelte";
  import { page } from "$app/stores";

  // Public routes that should not use the AppFrame shell (sidebar + topbar)
  const PUBLIC_ROUTES = ["/support", "/trust", "/console/login", "/console/onboarding", "/faq", "/privacy", "/developers"];

  $: isBare = PUBLIC_ROUTES.some((r) => $page.url.pathname === r || $page.url.pathname.startsWith(r + "/"));

  // Server-side session data from +layout.server.ts
  $: serverSession = $page.data?.session;
</script>

<svelte:head>
  <title>AtlasIT Console</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#if isBare}
  <slot />
{:else}
  <AppFrame {serverSession}>
    <slot />
  </AppFrame>
{/if}
