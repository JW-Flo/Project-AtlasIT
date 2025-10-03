<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchPlatformStatus } from '$lib/platformStatus';
  import type { PlatformHealthResponse, PlatformUsageSummary } from '$lib/types/platform';

  let health: PlatformHealthResponse | null = null;
  let usage: PlatformUsageSummary | null = null;
  let loading = true;
  let error = '';

  async function loadStatus() {
    try {
      const data = await fetchPlatformStatus();
      health = data.health;
      usage = data.usage;
      error = '';
    } catch (e) {
      error = 'Failed to load status';
      console.error(e);
    }
    loading = false;
  }

  onMount(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // 30s
    return () => clearInterval(interval);
  });

  function getStatusColor(ok: boolean) {
    return ok ? 'text-green-600' : 'text-red-600';
  }

  function getStatusDot(ok: boolean) {
    return ok ? '🟢' : '🔴';
  }
</script>

<div class="px-6 py-6 space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold">Platform Status</h1>
    <button
      on:click={loadStatus}
      disabled={loading}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  </div>

  {#if error}
    <div class="text-red-600 bg-red-50 p-4 rounded">{error}</div>
  {/if}

  <!-- Service Status Cards -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Service Health</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each Object.entries(health?.services || {}) as [service, status]}
        <div class="bg-white p-4 rounded-lg shadow border">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-lg">{getStatusDot(status.ok)}</span>
            <h3 class="font-medium capitalize">{service}</h3>
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <div>Status: <span class={getStatusColor(status.ok)}>{status.ok ? 'OK' : 'Down'}</span></div>
            <div>Latency: {status.latencyMs ? `${status.latencyMs}ms` : 'N/A'}</div>
            <div>Last Check: {new Date(status.lastChecked).toLocaleTimeString()}</div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Usage Summary -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Usage Summary</h2>
    {#if usage?.ok}
      <div class="bg-white p-4 rounded-lg shadow border">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div class="text-2xl font-bold text-blue-600">{usage.total || 0}</div>
            <div class="text-sm text-gray-600">Total Scripts</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">{usage.failures || 0}</div>
            <div class="text-sm text-gray-600">Failures</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-600">{((usage.failureRate || 0) * 100).toFixed(1)}%</div>
            <div class="text-sm text-gray-600">Failure Rate</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{usage.tenants || 0}</div>
            <div class="text-sm text-gray-600">Tenants</div>
          </div>
        </div>

        {#if usage.breakerOpenScripts && usage.breakerOpenScripts > 0}
          <div class="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
            <div class="flex items-center space-x-2">
              <span class="text-yellow-600">⚠️</span>
              <span class="text-yellow-800 font-medium">Circuit Breaker Open</span>
            </div>
            <div class="text-yellow-700 text-sm mt-1">
              {usage.breakerOpenScripts} scripts have circuit breakers open
            </div>
          </div>
        {/if}

        {#if usage.topScripts && usage.topScripts.length > 0}
          <div>
            <h4 class="font-medium mb-2">Top Scripts by Invocations</h4>
            <div class="space-y-1">
              {#each usage.topScripts.slice(0, 5) as script}
                <div class="flex justify-between text-sm">
                  <span>{script.name}</span>
                  <span class="font-mono">{script.invocations}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-red-500 text-sm bg-red-50 p-4 rounded">Usage data unavailable</div>
    {/if}
  </section>
</div>
