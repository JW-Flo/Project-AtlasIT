<script lang="ts">
  import { onMount } from "svelte";

  interface Integration {
    id: string;
    provider: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  let integrations: Integration[] = [];
  let loading = true;
  let error: string | null = null;
  let filter: "all" | "active" | "inactive" | "error" = "all";

  let showConnectMenu = false;
  let connectingProvider: string | null = null;

  // Okta connect modal state
  let showOktaModal = false;
  let oktaOrgUrl = "";
  let oktaApiToken = "";
  let oktaError: string | null = null;
  let oktaSubmitting = false;
  let oktaResult: { users: number; groups: number; evidenceCount: number; durationMs: number } | null = null;

  let banner: { type: "info" | "error"; msg: string } | null = null;

  async function loadIntegrations() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/v1/apps/integrations");
      if (!res.ok) {
        error = `Failed to load integrations (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      integrations = result.data?.items ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(loadIntegrations);

  async function connectOkta() {
    if (!oktaOrgUrl.trim() || !oktaApiToken.trim()) return;
    oktaSubmitting = true;
    oktaError = null;
    oktaResult = null;
    try {
      const res = await fetch("/adapters/okta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgUrl: oktaOrgUrl.trim(), apiToken: oktaApiToken.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      oktaResult = json.data;
      if (oktaResult?.error) throw new Error(oktaResult.error);
      banner = {
        type: "info",
        msg: `Okta connected — synced ${oktaResult?.users ?? 0} users, ${oktaResult?.groups ?? 0} groups, wrote ${oktaResult?.evidenceCount ?? 0} evidence records in ${oktaResult?.durationMs ?? 0}ms.`,
      };
      oktaApiToken = "";
      await loadIntegrations();
    } catch (e) {
      oktaError = (e as Error).message;
    } finally {
      oktaSubmitting = false;
    }
  }

  async function resyncOkta() {
    connectingProvider = "okta";
    banner = null;
    try {
      const res = await fetch("/adapters/okta/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      const d = json.data;
      if (d?.error) throw new Error(d.error);
      banner = {
        type: "info",
        msg: `Okta re-synced — ${d.users} users, ${d.groups} groups, ${d.evidenceCount} new evidence records in ${d.durationMs}ms.`,
      };
      await loadIntegrations();
    } catch (e) {
      banner = { type: "error", msg: `Sync failed: ${(e as Error).message}` };
    } finally {
      connectingProvider = null;
    }
  }

  async function disconnectOkta() {
    if (!confirm("Disconnect Okta? Stored credentials will be removed.")) return;
    connectingProvider = "okta";
    banner = null;
    try {
      const res = await fetch("/adapters/okta/integration", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      banner = { type: "info", msg: "Okta disconnected." };
      await loadIntegrations();
    } catch (e) {
      banner = { type: "error", msg: `Disconnect failed: ${(e as Error).message}` };
    } finally {
      connectingProvider = null;
    }
  }

  $: filtered = integrations.filter((i) => {
    if (filter === "all") return true;
    if (filter === "active") return i.status === "active";
    if (filter === "inactive") return i.status === "inactive" || i.status === "disabled";
    if (filter === "error") return i.status === "error" || i.status === "failed";
    return true;
  });

  $: totalCount = integrations.length;
  $: activeCount = integrations.filter((i) => i.status === "active").length;
  $: inactiveCount = integrations.filter((i) => i.status === "inactive" || i.status === "disabled").length;

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m ago`;
  }

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "inactive":
      case "disabled": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      case "error":
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    }
  }

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Error", value: "error" },
  ];

  // Available adapters to connect. As more adapter Lambdas land, add them here.
  const AVAILABLE_ADAPTERS = [
    { provider: "okta", name: "Okta", tagline: "Identity provider — users, groups, access events", action: () => { showOktaModal = true; showConnectMenu = false; } },
  ];
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Connected Apps</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Connect identity providers and SaaS apps to feed the compliance engine with evidence.
      </p>
    </div>
    <div class="relative">
      <button
        type="button"
        on:click={() => (showConnectMenu = !showConnectMenu)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        Connect App
        <svg class="ml-1.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
      </button>
      {#if showConnectMenu}
        <div class="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
          <div class="p-2">
            {#each AVAILABLE_ADAPTERS as a}
              <button
                type="button"
                on:click={a.action}
                class="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
              >
                <div class="font-medium text-gray-900 dark:text-white capitalize">{a.name}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{a.tagline}</div>
              </button>
            {/each}
            <a
              href="/console/marketplace"
              class="block px-3 py-2 mt-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-700"
            >
              Browse full catalog →
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if banner}
    <div
      class="mb-5 rounded-lg p-4 text-sm border
        {banner.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'}"
    >
      {banner.msg}
    </div>
  {/if}

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {#each [1, 2, 3] as _}
        <div class="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={loadIntegrations} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Total</div>
        <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{totalCount}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Active</div>
        <div class="mt-1 text-3xl font-bold text-green-600">{activeCount}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
        <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{inactiveCount}</div>
      </div>
    </div>

    <div class="flex gap-2 mb-4 flex-wrap">
      {#each filterOptions as opt}
        <button
          type="button"
          on:click={() => (filter = opt.value)}
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {filter === opt.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
        >
          {opt.label}
        </button>
      {/each}
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {#if filtered.length === 0}
        <div class="p-12 text-center text-gray-500 dark:text-gray-400">
          {#if integrations.length === 0}
            <p class="text-base font-medium mb-2">No apps connected</p>
            <p class="text-sm mb-4">Click Connect App to wire up your first integration.</p>
          {:else}
            No integrations match the selected filter.
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                <th class="px-6 py-3">Provider</th>
                <th class="px-6 py-3">Type</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Connected</th>
                <th class="px-6 py-3">Last Sync</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              {#each filtered as integration (integration.id)}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-white capitalize">{integration.provider}</td>
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-300 capitalize">{integration.type}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {statusBadgeClass(integration.status)}">
                      {integration.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{relativeTime(integration.created_at)}</td>
                  <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{relativeTime(integration.updated_at)}</td>
                  <td class="px-6 py-4 text-right space-x-3">
                    {#if integration.provider === "okta"}
                      <button
                        type="button"
                        on:click={resyncOkta}
                        disabled={connectingProvider === "okta"}
                        class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                      >
                        {connectingProvider === "okta" ? "Syncing…" : "Re-sync"}
                      </button>
                      <button
                        type="button"
                        on:click={disconnectOkta}
                        disabled={connectingProvider === "okta"}
                        class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    {:else}
                      <a
                        href="/console/marketplace?provider={integration.provider}"
                        class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Manage
                      </a>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if showOktaModal}
  <div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" on:click={() => !oktaSubmitting && (showOktaModal = false)} on:keydown={(e) => e.key === 'Escape' && !oktaSubmitting && (showOktaModal = false)} role="dialog" aria-modal="true" tabindex="-1">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-xl" on:click|stopPropagation role="none">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Connect Okta</h2>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          In Okta admin: <span class="font-mono">Security → API → Tokens → Create Token</span>. Paste below.
        </p>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="okta-org">
            Okta Org URL
          </label>
          <input
            id="okta-org"
            type="text"
            bind:value={oktaOrgUrl}
            placeholder="https://your-org.okta.com"
            disabled={oktaSubmitting}
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="okta-token">
            API Token
          </label>
          <input
            id="okta-token"
            type="password"
            bind:value={oktaApiToken}
            placeholder="00aBcDeFgHiJkLmNoPqRsTuVwXyZ"
            disabled={oktaSubmitting}
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Stored encrypted in your tenant. Revoke any time from Okta admin.
          </p>
        </div>
        {#if oktaError}
          <div class="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300">
            {oktaError}
          </div>
        {/if}
        {#if oktaResult && !oktaError}
          <div class="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-300">
            Synced {oktaResult.users} users, {oktaResult.groups} groups, wrote {oktaResult.evidenceCount} evidence records.
          </div>
        {/if}
      </div>
      <div class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
        <button
          type="button"
          on:click={() => (showOktaModal = false)}
          disabled={oktaSubmitting}
          class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {oktaResult && !oktaError ? "Close" : "Cancel"}
        </button>
        {#if !oktaResult || oktaError}
          <button
            type="button"
            on:click={connectOkta}
            disabled={oktaSubmitting || !oktaOrgUrl.trim() || !oktaApiToken.trim()}
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {oktaSubmitting ? "Connecting…" : "Connect & Sync"}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
