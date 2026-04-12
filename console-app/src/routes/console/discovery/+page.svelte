<script lang="ts">
  import { onMount } from "svelte";

  interface DiscoveredApp {
    id: string;
    app_name: string;
    risk_tier: "approved" | "under_review" | "blocked" | "unknown";
    first_seen_at: string;
    status: string;
  }

  interface OAuthGrant {
    id: string;
    app_name: string;
    user_email: string;
    scopes: string;
    granted_at: string;
  }

  let activeTab: "apps" | "grants" = "apps";
  let apps: DiscoveredApp[] = [];
  let grants: OAuthGrant[] = [];
  let loadingApps = true;
  let loadingGrants = true;
  let scanning = false;
  let appsError: string | null = null;
  let grantsError: string | null = null;
  let actionLoading: string | null = null;

  const ORCHESTRATOR_BASE = "/orchestrator/api/v1";

  async function loadApps() {
    loadingApps = true;
    appsError = null;
    try {
      const res = await fetch(`${ORCHESTRATOR_BASE}/discovery/apps?limit=50`);
      if (!res.ok) {
        appsError = `Failed to load apps (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      apps = result.data?.items ?? result.apps ?? result.data ?? [];
    } catch (e) {
      appsError = (e as Error).message;
    } finally {
      loadingApps = false;
    }
  }

  async function loadGrants() {
    loadingGrants = true;
    grantsError = null;
    try {
      const res = await fetch(`${ORCHESTRATOR_BASE}/discovery/grants?limit=50`);
      if (!res.ok) {
        grantsError = `Failed to load grants (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      grants = result.data?.items ?? result.grants ?? result.data ?? [];
    } catch (e) {
      grantsError = (e as Error).message;
    } finally {
      loadingGrants = false;
    }
  }

  async function triggerScan() {
    scanning = true;
    try {
      await fetch(`${ORCHESTRATOR_BASE}/discovery/scan`, { method: "POST" });
      await Promise.all([loadApps(), loadGrants()]);
    } catch {
      // scan may still succeed; refresh data anyway
      await Promise.all([loadApps(), loadGrants()]);
    } finally {
      scanning = false;
    }
  }

  async function updateRiskTier(app: DiscoveredApp, tier: DiscoveredApp["risk_tier"]) {
    actionLoading = app.id;
    try {
      const res = await fetch(`${ORCHESTRATOR_BASE}/discovery/apps/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ risk_tier: tier }),
      });
      if (res.ok) {
        apps = apps.map((a) => (a.id === app.id ? { ...a, risk_tier: tier } : a));
      }
    } catch {
      // silent fail — UI stays consistent
    } finally {
      actionLoading = null;
    }
  }

  function riskBadgeClass(tier: string): string {
    switch (tier) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "under_review":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  function riskLabel(tier: string): string {
    switch (tier) {
      case "approved": return "Approved";
      case "under_review": return "Under Review";
      case "blocked": return "Blocked";
      default: return "Unknown";
    }
  }

  function relativeTime(iso: string | undefined): string {
    if (!iso) return "—";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m ago`;
  }

  onMount(() => {
    loadApps();
    loadGrants();
  });
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">App Discovery</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Detect shadow IT via OAuth grant scanning
      </p>
    </div>
    <button
      type="button"
      on:click={triggerScan}
      disabled={scanning}
      class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
    >
      {scanning ? "Scanning..." : "Scan Now"}
    </button>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
    <button
      type="button"
      on:click={() => (activeTab = "apps")}
      class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === 'apps'
        ? 'text-gray-900 dark:text-white border-b-2 border-blue-600'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
    >
      Discovered Apps
    </button>
    <button
      type="button"
      on:click={() => (activeTab = "grants")}
      class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === 'grants'
        ? 'text-gray-900 dark:text-white border-b-2 border-blue-600'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
    >
      OAuth Grants
    </button>
  </div>

  <!-- Apps Tab -->
  {#if activeTab === "apps"}
    {#if loadingApps}
      <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {:else if appsError}
      <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <p class="text-red-800 dark:text-red-300">{appsError}</p>
        <button
          on:click={loadApps}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else}
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {#if apps.length === 0}
          <div class="p-12 text-center text-gray-500 dark:text-gray-400">
            <p class="text-base font-medium mb-2">No apps discovered yet</p>
            <p class="text-sm">Run a scan to detect OAuth grants and shadow IT.</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left"
                >
                  <th class="px-6 py-3">App Name</th>
                  <th class="px-6 py-3">Risk Tier</th>
                  <th class="px-6 py-3">First Seen</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {#each apps as app (app.id)}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {app.app_name}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {riskBadgeClass(app.risk_tier)}"
                      >
                        {riskLabel(app.risk_tier)}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {relativeTime(app.first_seen_at)}
                    </td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-300 capitalize">
                      {app.status || "—"}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        {#if app.risk_tier !== "approved"}
                          <button
                            type="button"
                            disabled={actionLoading === app.id}
                            on:click={() => updateRiskTier(app, "approved")}
                            class="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-md transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        {/if}
                        {#if app.risk_tier !== "blocked"}
                          <button
                            type="button"
                            disabled={actionLoading === app.id}
                            on:click={() => updateRiskTier(app, "blocked")}
                            class="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-md transition-colors disabled:opacity-50"
                          >
                            Block
                          </button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  {/if}

  <!-- Grants Tab -->
  {#if activeTab === "grants"}
    {#if loadingGrants}
      <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {:else if grantsError}
      <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <p class="text-red-800 dark:text-red-300">{grantsError}</p>
        <button
          on:click={loadGrants}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else}
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {#if grants.length === 0}
          <div class="p-12 text-center text-gray-500 dark:text-gray-400">
            <p class="text-base font-medium mb-2">No OAuth grants found</p>
            <p class="text-sm">Run a scan to discover OAuth grants across your directory.</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left"
                >
                  <th class="px-6 py-3">App</th>
                  <th class="px-6 py-3">User Email</th>
                  <th class="px-6 py-3">Scopes</th>
                  <th class="px-6 py-3">Granted At</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                {#each grants as grant (grant.id)}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {grant.app_name}
                    </td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {grant.user_email}
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div class="flex flex-wrap gap-1 max-w-xs">
                        {#each (grant.scopes ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4) as scope}
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {scope}
                          </span>
                        {/each}
                        {#if (grant.scopes ?? "").split(",").filter(Boolean).length > 4}
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          >
                            +{(grant.scopes ?? "").split(",").filter(Boolean).length - 4} more
                          </span>
                        {/if}
                        {#if !grant.scopes}
                          <span class="text-gray-400">—</span>
                        {/if}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {relativeTime(grant.granted_at)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
