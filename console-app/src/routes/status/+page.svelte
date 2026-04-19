<script lang="ts">
  import { onMount } from "svelte";
  import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-svelte";

  interface ServiceStatus {
    name: string;
    label: string;
    reachable: boolean;
    latencyMs: number;
    functionalChecks: Record<string, "pass" | "fail" | "unknown">;
  }

  let services: ServiceStatus[] = [];
  let healthy = false;
  let checkedAt = "";
  let loading = true;
  let error = "";

  const SERVICE_LABELS: Record<string, string> = {
    console: "Console & API",
    orchestrator: "Automation Engine",
    compliance: "Compliance Engine",
  };

  async function fetchStatus() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/platform/health-deep");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        healthy: boolean;
        services: ServiceStatus[];
        checkedAt: string;
      };
      healthy = data.healthy;
      services = data.services ?? [];
      checkedAt = data.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : "";
    } catch (e) {
      error = "Unable to reach health endpoint.";
    } finally {
      loading = false;
    }
  }

  onMount(fetchStatus);

  function overallStatus(svc: ServiceStatus): "operational" | "degraded" | "down" {
    if (!svc.reachable) return "down";
    const checks = Object.values(svc.functionalChecks);
    if (checks.length === 0) return "operational";
    if (checks.every(v => v === "pass")) return "operational";
    if (checks.some(v => v === "fail")) return "degraded";
    return "operational";
  }
</script>

<svelte:head>
  <title>System Status · AtlasIT</title>
  <meta name="description" content="Real-time status of AtlasIT platform services." />
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200">
    <div class="mx-auto max-w-3xl px-4 py-5 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5">
        <div class="h-8 w-8 rounded-lg bg-[hsl(252,87%,58%)] flex items-center justify-center">
          <ShieldCheck class="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span class="font-semibold text-slate-900">AtlasIT</span>
        <span class="text-slate-400">/</span>
        <span class="text-slate-600 text-sm">Status</span>
      </a>
      <button
        on:click={fetchStatus}
        class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        disabled={loading}
      >
        <RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
        Refresh
      </button>
    </div>
  </div>

  <div class="mx-auto max-w-3xl px-4 py-8">
    {#if loading}
      <div class="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">
        <RefreshCw class="mx-auto h-6 w-6 animate-spin text-slate-400 mb-3" />
        <p class="text-sm text-slate-500">Checking service health…</p>
      </div>

    {:else if error}
      <div class="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">
        <AlertTriangle class="mx-auto h-6 w-6 text-amber-500 mb-3" />
        <p class="text-sm font-medium text-slate-900 mb-1">Status unavailable</p>
        <p class="text-xs text-slate-500">{error}</p>
      </div>

    {:else}
      <!-- Overall banner -->
      <div class="mb-6 rounded-xl border p-5 shadow-sm flex items-center gap-4
        {healthy
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'}">
        {#if healthy}
          <CheckCircle2 class="h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p class="font-semibold text-green-800">All systems operational</p>
            <p class="text-xs text-green-600 mt-0.5">All services are running normally{checkedAt ? ` · checked at ${checkedAt}` : ''}.</p>
          </div>
        {:else}
          <AlertTriangle class="h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <p class="font-semibold text-amber-800">Some systems degraded</p>
            <p class="text-xs text-amber-600 mt-0.5">One or more services are not fully operational{checkedAt ? ` · checked at ${checkedAt}` : ''}.</p>
          </div>
        {/if}
      </div>

      <!-- Service list -->
      <div class="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-3 border-b border-slate-100">
          <h2 class="text-sm font-semibold text-slate-900">Services</h2>
        </div>
        <div class="divide-y divide-slate-50">
          {#each services as svc}
            {@const status = overallStatus(svc)}
            <div class="flex items-center gap-4 px-5 py-4">
              {#if status === 'operational'}
                <CheckCircle2 class="h-4 w-4 shrink-0 text-green-500" />
              {:else if status === 'degraded'}
                <AlertTriangle class="h-4 w-4 shrink-0 text-amber-500" />
              {:else}
                <XCircle class="h-4 w-4 shrink-0 text-red-500" />
              {/if}
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900">{SERVICE_LABELS[svc.name] ?? svc.name}</p>
                {#if svc.latencyMs > 0}
                  <p class="text-xs text-slate-400">{svc.latencyMs}ms response time</p>
                {/if}
              </div>
              <span class="shrink-0 text-xs rounded-full px-2.5 py-0.5 font-medium
                {status === 'operational' ? 'bg-green-50 text-green-700' :
                 status === 'degraded' ? 'bg-amber-50 text-amber-700' :
                 'bg-red-50 text-red-700'}">{status}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Uptime note -->
      <p class="text-center text-xs text-slate-400">
        For incident updates, contact <a href="mailto:support@atlasit.pro" class="underline hover:text-slate-600">support@atlasit.pro</a>
        or visit <a href="/support" class="underline hover:text-slate-600">our support page</a>.
      </p>
    {/if}
  </div>
</div>
