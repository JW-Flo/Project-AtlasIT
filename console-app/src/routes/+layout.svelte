<script lang="ts">
  import "../app.css";
  import AppFrame from "$lib/components/layout/AppFrame.svelte";
  import { page } from "$app/stores";
  import { isSpaMode } from "$lib/client-api";
  import { onMount } from "svelte";

  // Install fetch interceptor at module-load time in browser (before hydration)
  // This ensures it's installed before any component fires fetches.
  if (typeof window !== "undefined" && isSpaMode) {
    const API_BASE: string = import.meta.env?.VITE_API_URL ?? "";
    const originalFetch = window.fetch.bind(window);

    const pathMap: Record<string, string> = {
      "/api/tenant/dashboard": "/api/v1/dashboard",
      "/api/platform/dashboard": "/api/v1/dashboard",
      "/api/tenant-compliance/scores": "/api/compliance/api/v1/policies/coverage",
      "/api/evidence-feed": "/api/compliance/api/v1/evidence",
      "/api/incidents": "/api/compliance/api/v1/incidents",
      "/api/automation/executions": "/orchestrator/api/v1/automation/rules",
      "/api/automation/rules": "/orchestrator/api/v1/automation/rules",
      "/api/access-reviews": "/api/compliance/api/v1/access-requests",
      "/api/access-requests": "/api/compliance/api/v1/access-requests",
      "/api/analytics/events": "/orchestrator/api/v1/events",
      "/api/auth/session": "/api/v1/auth/validate",
    };

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

      // Intercept SvelteKit's __data.json fetches (static mode has no server data)
      if (url.includes("__data.json")) {
        // Return valid empty SvelteKit data payload
        return Promise.resolve(
          new Response(
            JSON.stringify({ type: "data", nodes: [null, null, null] }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      // Intercept /api/, /orchestrator/, and /adapters/ paths (all map to API Gateway)
      if (!url.startsWith("/api/") && !url.startsWith("/orchestrator/") && !url.startsWith("/adapters/")) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers ?? {});
      const token = sessionStorage.getItem("atlasit_token");
      if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
      try {
        const user = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
        if (user.tenantId && !headers.has("x-tenant-id")) headers.set("x-tenant-id", user.tenantId);
      } catch {}
      if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());

      const [urlPath, urlQuery] = url.split("?");
      let mappedPath = "";
      // Legacy path map (UI paths → Lambda paths)
      for (const [from, to] of Object.entries(pathMap)) {
        if (urlPath === from || urlPath.startsWith(from + "/")) {
          mappedPath = to + urlPath.substring(from.length) + (urlQuery ? "?" + urlQuery : "");
          break;
        }
      }

      // Pass-through for Lambda API paths that already match API Gateway routes
      if (!mappedPath && (
        urlPath.startsWith("/api/v1/") ||
        urlPath.startsWith("/api/compliance/") ||
        urlPath.startsWith("/api/onboarding/") ||
        urlPath.startsWith("/orchestrator/") ||
        urlPath.startsWith("/adapters/")
      )) {
        mappedPath = url;
      }

      // Unmapped legacy path → return empty JSON so pages don't crash on .json()
      if (!mappedPath) {
        return Promise.resolve(
          new Response(JSON.stringify({ authenticated: false, data: null, items: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }

      return originalFetch(`${API_BASE}${mappedPath}`, { ...init, headers });
    } as typeof fetch;
  }

  // Redirect unauthenticated users on mount
  onMount(() => {
    if (!isSpaMode) return;

    const token = sessionStorage.getItem("atlasit_token");
    const path = window.location.pathname;
    const isPublic = ["/login", "/", "/support", "/trust", "/faq", "/privacy", "/developers"].some(
      (r) => path === r || path.startsWith(r + "/"),
    );
    if (!token && !isPublic) {
      window.location.href = "/login";
      return;
    }
  });

  // Public routes that should not use the AppFrame shell
  const PUBLIC_ROUTES = ["/login", "/support", "/trust", "/console/login", "/console/onboarding", "/faq", "/privacy", "/developers"];

  $: isBare =
    $page.url.pathname === "/" ||
    PUBLIC_ROUTES.some((r) => $page.url.pathname === r || $page.url.pathname.startsWith(r + "/"));

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
