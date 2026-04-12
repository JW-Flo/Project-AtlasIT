<script lang="ts">
  import "../app.css";
  import AppFrame from "$lib/components/layout/AppFrame.svelte";
  import { page } from "$app/stores";
  import { isSpaMode } from "$lib/client-api";
  import { onMount } from "svelte";

  // In SPA mode: redirect to /login if no auth token, then intercept fetch calls
  onMount(() => {
    if (!isSpaMode) return;

    // Redirect to /login if unauthenticated and not already on a public route
    const token = sessionStorage.getItem("atlasit_token");
    const path = window.location.pathname;
    const isPublic = ["/login", "/", "/support", "/trust", "/faq", "/privacy", "/developers"].some(
      (r) => path === r || path.startsWith(r + "/"),
    );
    if (!token && !isPublic) {
      window.location.href = "/login";
      return;
    }

    const API_BASE: string = import.meta.env?.VITE_API_URL ?? "";
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.startsWith("/api/")) {
        const headers = new Headers(init?.headers ?? {});
        const token = sessionStorage.getItem("atlasit_token");
        if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
        const user = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
        if (user.tenantId && !headers.has("x-tenant-id")) headers.set("x-tenant-id", user.tenantId);
        if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());
        return originalFetch.call(window, `${API_BASE}${url}`, { ...init, headers });
      }
      return originalFetch.call(window, input, init);
    } as typeof fetch;
  });

  // Public routes that should not use the AppFrame shell (sidebar + topbar)
  const PUBLIC_ROUTES = ["/login", "/support", "/trust", "/console/login", "/console/onboarding", "/faq", "/privacy", "/developers"];

  $: isBare = $page.url.pathname === "/" || PUBLIC_ROUTES.some((r) => $page.url.pathname === r || $page.url.pathname.startsWith(r + "/"));

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
