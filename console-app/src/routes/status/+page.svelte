<script lang="ts">
  import { onMount } from "svelte";
  import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-svelte";

  interface ServiceCheck {
    name: string;
    label: string;
    url: string;
    reachable: boolean;
    latencyMs: number;
  }

  // Direct absolute URLs — bypasses the SPA fetch interceptor entirely.
  // mode: 'no-cors' avoids CORS preflight; opaque response = reachable, thrown = down.
  const SERVICES: { name: string; label: string; url: string }[] = [
    { name: "console",       label: "Console & CDN",      url: "" },
    { name: "orchestrator",  label: "Automation Engine",  url: "https://orchestrator.atlasit.pro/health" },
    { name: "compliance",    label: "Compliance Engine",  url: "https://compliance.atlasit.pro/health" },
    { name: "docs",          label: "Documentation",      url: "https://docs.atlasit.pro/health" },
  ];

  let services: ServiceCheck[] = [];
  let healthy = false;
  let checkedAt = "";
  let loading = true;

  async function checkService(svc: typeof SERVICES[0]): Promise<ServiceCheck> {
    if (!svc.url) {
      return { ...svc, reachable: true, latencyMs: 0 };
    }
    const start = Date.now();
    try {
      await fetch(svc.url, { mode: "no-cors", signal: AbortSignal.timeout(5000) });
      return { ...svc, reachable: true, latencyMs: Date.now() - start };
    } catch {
      return { ...svc, reachable: false, latencyMs: Date.now() - start };
    }
  }

  async function fetchStatus() {
    loading = true;
    try {
      services = await Promise.all(SERVICES.map(checkService));
      healthy = services.every((s) => s.reachable);
      checkedAt = new Date().toLocaleTimeString();
    } finally {
      loading = false;
    }
  }

  onMount(fetchStatus);
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
          <ShieldCheck class="h-4 w-4 text-white" strokeWidth={2.5} />
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

    {:else}
      <!-- Overall banner -->
      <div class="mb-6 rounded-xl border p-5 shadow-sm flex items-center gap-4
        {healthy ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}">
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
        <div class="divide-y divide-slate-100">
          {#each services as svc}
            <div class="flex items-center gap-4 px-5 py-4">
              {#if svc.reachable}
                <CheckCircle2 class="h-4 w-4 shrink-0 text-green-500" />
              {:else}
                <XCircle class="h-4 w-4 shrink-0 text-red-500" />
              {/if}
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900">{svc.label}</p>
                {#if svc.latencyMs > 0}
                  <p class="text-xs text-slate-400">{svc.latencyMs}ms</p>
                {/if}
              </div>
              <span class="shrink-0 text-xs rounded-full px-2.5 py-0.5 font-medium
                {svc.reachable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
                {svc.reachable ? 'operational' : 'down'}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <p class="text-center text-xs text-slate-400">
        For incident updates, contact <a href="mailto:support@atlasit.pro" class="underline hover:text-slate-600">support@atlasit.pro</a>
        or visit <a href="/support" class="underline hover:text-slate-600">our support page</a>.
      </p>
    {/if}
  </div>
</div>
