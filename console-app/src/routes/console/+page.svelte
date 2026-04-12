<script lang="ts">
  import { onMount } from "svelte";

  interface DashboardData {
    tenant: { id: string; name: string; slug: string; tier: string; status: string } | null;
    user: { id: string; email: string; role: string };
    stats: {
      evidenceCount: number;
      automationRulesTotal: number;
      automationRulesEnabled: number;
      openIncidents: number;
    };
    recentEvents: Array<{ id: string; type: string; source: string; status: string; created_at: string }>;
  }

  let data: DashboardData | null = null;
  let loading = true;
  let error: string | null = null;

  async function loadDashboard() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/v1/dashboard");
      if (!res.ok) {
        error = `Failed to load dashboard (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      if (result.data) {
        data = result.data;
      } else {
        error = "Dashboard returned no data";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadDashboard();
  });

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m ago`;
  }
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
    {#if data?.tenant}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {data.tenant.name} · {data.tenant.tier} tier · logged in as {data.user.email}
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {#each Array(4) as _}
        <div class="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button
        on:click={loadDashboard}
        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else if data}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Compliance Evidence</div>
        <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.stats.evidenceCount.toLocaleString()}</div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Records collected</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Automation Rules</div>
        <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.stats.automationRulesEnabled}</div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {data.stats.automationRulesEnabled} of {data.stats.automationRulesTotal} enabled
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Open Incidents</div>
        <div class="mt-1 text-3xl font-bold {data.stats.openIncidents > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}">
          {data.stats.openIncidents}
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Needs attention</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <div class="text-sm text-gray-500 dark:text-gray-400">Tenant Status</div>
        <div class="mt-1 text-xl font-bold text-green-600 capitalize">{data.tenant?.status ?? "—"}</div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {data.tenant?.tier ?? ""} plan
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
      </div>
      {#if data.recentEvents.length === 0}
        <div class="p-6 text-sm text-gray-500 dark:text-gray-400">No recent events</div>
      {:else}
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each data.recentEvents as evt}
            <div class="px-6 py-4 flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{evt.type}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">from {evt.source}</div>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  {evt.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                  {evt.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                  {evt.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                  {evt.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}">
                  {evt.status}
                </span>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">{relativeTime(evt.created_at)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
      <a href="/console/compliance" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white">Compliance</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">View controls & evidence</div>
      </a>
      <a href="/console/directory" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white">Directory</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Users & groups</div>
      </a>
      <a href="/console/automation" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white">Automation</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Rules & workflows</div>
      </a>
      <a href="/console/incidents" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white">Incidents</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Investigate & resolve</div>
      </a>
    </div>
  {/if}
</div>
