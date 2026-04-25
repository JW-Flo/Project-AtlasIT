<script lang="ts">
  import "../app.css";
  import AppFrame from "$lib/components/layout/AppFrame.svelte";
  import { page } from "$app/stores";
  import { isSpaMode } from "$lib/client-api";
  import { isDemoMode, initDemo } from "$lib/demo/state";
  import { getDemoResponse } from "$lib/demo/mock-fetch";
  import { onMount } from "svelte";

  // Install fetch interceptor at module-load time in browser (before hydration)
  // This ensures it's installed before any component fires fetches.
  if (typeof window !== "undefined" && isSpaMode) {
    const API_BASE: string = import.meta.env?.VITE_API_URL ?? "";
    const originalFetch = window.fetch.bind(window);
    // Check demo mode and init if URL param present
    if (isDemoMode()) initDemo();

    // Stub responses for edge-case paths only. All feature endpoints are now
    // wired to real Lambda backends.
    const stubMap: Record<string, unknown> = {
      // Public health (API Gateway /health already returns 200)
      "/api/health": { status: "healthy" },
    };

    // Real Lambda path mappings (legacy UI paths → Lambda API Gateway paths)
    const pathMap: Record<string, string> = {
      // Dashboard / Analytics
      "/api/tenant/dashboard": "/api/v1/dashboard",
      "/api/platform/dashboard": "/api/v1/dashboard",
      "/api/analytics/dashboard": "/api/v1/dashboard",
      "/api/dashboard/views": "/api/v1/dashboard",
      // Audit log
      "/api/tenant/audit-log": "/api/v1/audit-log",
      // Compliance
      "/api/tenant-compliance/scores": "/api/compliance/api/v1/policies/coverage",
      "/api/tenant-compliance/controls": "/api/compliance/api/v1/compliance-packs/registry/controls",
      "/api/evidence-feed": "/api/compliance/api/v1/evidence",
      "/api/evidence-collection/collect": "/api/compliance/api/v1/evidence/collect",
      "/api/incidents": "/api/compliance/api/v1/incidents",
      "/api/compliance-intelligence/gaps": "/api/compliance/api/v1/policies/coverage",
      "/api/compliance-intelligence/drift": "/api/compliance/api/v1/compliance-packs/history/aggregate",
      // Notifications
      "/api/notifications": "/api/compliance/api/v1/notifications",
      // Access
      "/api/access-reviews": "/api/compliance/api/v1/access-reviews",
      "/api/access-requests": "/api/compliance/api/v1/access-requests",
      // Automation / Orchestrator
      "/api/automation/executions": "/orchestrator/api/v1/automation/rules",
      "/api/automation/rules": "/orchestrator/api/v1/automation/rules",
      "/api/automation/nl": "/orchestrator/api/v1/automation/nl",
      "/api/dead-letter": "/orchestrator/api/v1/dead-letter",
      "/api/jml/runs": "/orchestrator/api/v1/jml/runs",
      "/api/jml/policy": "/orchestrator/api/v1/jml/policy",
      "/api/jml/changelog": "/orchestrator/api/v1/jml/changelog",
      "/api/nhi": "/orchestrator/api/v1/nhi/discover",
      // Directory / Tenant / Users
      "/api/directory/groups": "/api/v1/directory/groups",
      "/api/directory/users": "/api/v1/directory/users",
      "/api/admin/tenants": "/api/v1/tenants",
      "/api/admin/users/reset-password": "/api/v1/admin/users/reset-password",
      "/api/tenant/settings": "/api/v1/tenant/settings",
      "/api/tenant/security": "/api/v1/tenant/settings",
      "/api/tenants/preferences": "/api/v1/tenant/settings",
      "/api/user/preferences": "/api/v1/user/profile",
      // Apps / Integrations
      "/api/apps/status": "/api/v1/apps/integrations",
      "/api/apps/connect": "/api/v1/apps/connect",
      "/api/apps/disconnect": "/api/v1/apps/disconnect",
      "/api/apps/test": "/api/v1/apps/test",
      "/api/apps/credentials": "/api/v1/apps/credentials",
      // Auth / MFA (Tier 2)
      "/api/auth/mfa/status": "/api/v1/auth/mfa/status",
      "/api/auth/mfa/setup": "/api/v1/auth/mfa/setup",
      "/api/auth/mfa/confirm": "/api/v1/auth/mfa/confirm",
      "/api/auth/mfa/disable": "/api/v1/auth/mfa/disable",
      // SSO config (Tier 2)
      "/api/tenant/sso": "/api/v1/tenant/sso",
      // Directory mappings (Tier 2)
      "/api/directory/mappings": "/api/v1/directory/mappings",
      // Support + DSAR (Tier 2)
      "/api/support": "/api/v1/support",
      "/api/privacy/dsar": "/api/v1/privacy/dsar",
      // Compliance anomalies (Tier 2)
      "/api/compliance-intelligence/anomalies": "/api/compliance/api/v1/compliance-intelligence/anomalies",
      // Trust Center / Questionnaires
      "/api/v1/trust/questionnaire/list": "/api/compliance/api/v1/trust/questionnaire/list",
      "/api/v1/trust/questionnaire/parse": "/api/compliance/api/v1/trust/questionnaire/parse",
      "/api/v1/trust/questionnaire/generate": "/api/compliance/api/v1/trust/questionnaire/generate",
      "/api/v1/trust/questionnaire/feedback": "/api/compliance/api/v1/trust/questionnaire/feedback",
      "/api/v1/trust/questionnaire/export": "/api/compliance/api/v1/trust/questionnaire/export",
      // Marketplace catalog
      "/api/marketplace": "/api/v1/marketplace",
      "/api/marketplace/installs": "/api/v1/marketplace/installs",
      // Platform / operations
      "/api/platform/health-deep": "/api/v1/platform/health-deep",
      "/api/incidents/sla-config": "/api/v1/incidents/sla-config",
      "/api/operations/metrics": "/orchestrator/api/v1/operations/metrics",
      "/api/platform/journey-metrics": "/orchestrator/api/v1/platform/journey-metrics",
      "/api/analytics/report": "/orchestrator/api/v1/analytics/report",
      // Events
      "/api/analytics/events": "/orchestrator/api/v1/events",
      // Auth session
      "/api/auth/session": "/api/v1/auth/validate",
      // Billing (Tier 3 — wired to Stripe when STRIPE_API_KEY is set)
      "/api/billing": "/api/v1/billing",
      "/api/billing/seats": "/api/v1/billing/seats",
      "/api/billing/checkout": "/api/v1/billing/checkout",
      "/api/billing/portal": "/api/v1/billing/portal",
    };

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

      // Demo mode: intercept all API calls with mock data (check dynamically)
      if (isDemoMode() && (url.startsWith("/api/") || url.startsWith("/orchestrator/") || url.startsWith("/adapters/"))) {
        const method = init?.method?.toUpperCase() ?? "GET";
        const demoRes = getDemoResponse(url, method);
        if (demoRes) return Promise.resolve(demoRes);
        // Fallback: return graceful empty response for unmapped demo routes
        return Promise.resolve(
          new Response(
            JSON.stringify({ status: "success", data: null, items: [] }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      // Only intercept /api/, /orchestrator/, and /adapters/ paths
      if (!url.startsWith("/api/") && !url.startsWith("/orchestrator/") && !url.startsWith("/adapters/")) {
        return originalFetch(input, init);
      }

      const [urlPath, urlQuery] = url.split("?");

      // Check stub map first — these paths have no Lambda implementation yet
      for (const [from, stubBody] of Object.entries(stubMap)) {
        if (urlPath === from || urlPath.startsWith(from + "/")) {
          return Promise.resolve(
            new Response(JSON.stringify(stubBody), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          );
        }
      }

      const headers = new Headers(init?.headers ?? {});
      const token = sessionStorage.getItem("atlasit_token");
      if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
      try {
        const user = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
        if (user.tenantId && !headers.has("x-tenant-id")) headers.set("x-tenant-id", user.tenantId);
      } catch {}
      if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());

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
    if (isDemoMode()) return;
    if (!isSpaMode) return;
    const token = sessionStorage.getItem("atlasit_token");
    const path = window.location.pathname;
    const isPublic = ["/login", "/signup", "/", "/demo", "/interactive-demo", "/see-atlasit-live", "/support", "/trust", "/faq", "/privacy", "/developers", "/accept-invite", "/status"].some(
      (r) => path === r || path.startsWith(r + "/"),
    );
    if (!token && !isPublic) {
      window.location.href = "/login";
      return;
    }
  });

  // Public routes that should not use the AppFrame shell
  const PUBLIC_ROUTES = ["/login", "/signup", "/demo", "/interactive-demo", "/see-atlasit-live", "/support", "/status", "/trust", "/console/login", "/console/onboarding", "/faq", "/privacy", "/developers", "/accept-invite"];

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
