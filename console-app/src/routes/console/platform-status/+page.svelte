<script lang="ts">
  import { onMount } from "svelte";
  import { fetchPlatformStatus } from "$lib/platformStatus";
  import type {
    PlatformHealthResponse,
    PlatformUsageSummary,
  } from "$lib/types/platform";

  let health: PlatformHealthResponse | null = null;
  let usage: PlatformUsageSummary | null = null;
  let loading = true;
  let error = "";

  async function loadStatus() {
    try {
      const data = await fetchPlatformStatus();
      health = data.health;
      usage = data.usage;
      error = "";
    } catch (e) {
      error = "Failed to load status";
      console.error(e);
    }
    loading = false;
  }

  onMount(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  });

  function statusLabel(ok: boolean) {
    return ok ? "Operational" : "Down";
  }
</script>

<div class="px-6 py-6 space-y-6 max-w-5xl mx-auto">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold">Platform Status</h1>
    <button
      on:click={loadStatus}
      disabled={loading}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 text-sm"
    >
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  </div>

  {#if error}
    <div class="text-red-400 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
  {/if}

  <!-- Service Status Cards -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Service Health</h2>
    {#if health?.services}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each Object.entries(health.services) as [service, status]}
          <div class="bg-[#1a2332] p-4 rounded-lg border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2.5 h-2.5 rounded-full {status.ok ? 'bg-green-500' : 'bg-red-500'}"></span>
              <h3 class="font-medium capitalize text-white/90">{service}</h3>
            </div>
            <div class="text-sm space-y-1.5">
              <div class="flex justify-between">
                <span class="text-white/50">Status</span>
                <span class="{status.ok ? 'text-green-400' : 'text-red-400'} font-medium">
                  {statusLabel(status.ok)}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/50">Latency</span>
                <span class="text-white/80">{status.latencyMs ? `${status.latencyMs}ms` : "N/A"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/50">HTTP</span>
                <span class="text-white/80">{status.status || "—"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/50">Checked</span>
                <span class="text-white/60 text-xs">{new Date(status.lastChecked).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if !loading}
      <div class="text-white/40 text-sm bg-[#1a2332] rounded-lg p-4">No service data available</div>
    {/if}
  </section>

  <!-- Usage Summary -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Usage Summary</h2>
    {#if usage?.ok}
      <div class="bg-[#1a2332] p-4 rounded-lg border border-white/10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div class="text-2xl font-bold text-blue-400">{usage.total || 0}</div>
            <div class="text-sm text-white/50">Total Scripts</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-400">{usage.failures || 0}</div>
            <div class="text-sm text-white/50">Failures</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-400">
              {((usage.failureRate || 0) * 100).toFixed(1)}%
            </div>
            <div class="text-sm text-white/50">Failure Rate</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-400">{usage.tenants || 0}</div>
            <div class="text-sm text-white/50">Tenants</div>
          </div>
        </div>

        {#if usage.breakerOpenScripts && usage.breakerOpenScripts > 0}
          <div class="bg-yellow-600/15 border border-yellow-500/30 p-3 rounded mb-4">
            <div class="flex items-center gap-2">
              <span class="text-yellow-400 font-medium">Circuit Breaker Open</span>
            </div>
            <div class="text-yellow-300/80 text-sm mt-1">
              {usage.breakerOpenScripts} scripts have circuit breakers open
            </div>
          </div>
        {/if}

        {#if usage.topScripts && usage.topScripts.length > 0}
          <div>
            <h4 class="font-medium mb-2 text-white/70">Top Scripts by Invocations</h4>
            <div class="space-y-1">
              {#each usage.topScripts.slice(0, 5) as script}
                <div class="flex justify-between text-sm">
                  <span class="text-white/80">{script.name}</span>
                  <span class="font-mono text-white/60">{script.invocations}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-white/40 text-sm bg-[#1a2332] rounded-lg p-4 border border-white/10">
        No usage data available. This may indicate the platform is still initializing.
      </div>
    {/if}
  </section>
</div>
