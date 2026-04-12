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

  interface Pack {
    id: string;
    label: string;
    framework: string;
    controlCount: number;
    installedAt: string | null;
    lastEvaluatedAt: string | null;
    passCount: number | null;
    failCount: number | null;
    unknownCount: number | null;
  }

  interface EvidenceItem {
    id: string;
    framework: string | null;
    controlId: string | null;
    source: string | null;
    actor: string | null;
    metadata: { impact?: string; eventType?: string; reasoning?: string } | null;
    createdAt: string;
  }

  interface Integration {
    id: string;
    provider: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  let dashboard: DashboardData | null = null;
  let packs: Pack[] = [];
  let evidence: EvidenceItem[] = [];
  let integrations: Integration[] = [];
  let loading = true;
  let error: string | null = null;

  $: installedPacks = packs.filter((p) => p.installedAt);
  $: totalControls = installedPacks.reduce((s, p) => s + (p.controlCount ?? 0), 0);
  $: totalPass = installedPacks.reduce((s, p) => s + (p.passCount ?? 0), 0);
  $: totalFail = installedPacks.reduce((s, p) => s + (p.failCount ?? 0), 0);
  $: totalUnknown = installedPacks.reduce((s, p) => s + (p.unknownCount ?? 0), 0);
  $: overallScore = totalControls > 0 ? Math.round((totalPass * 100) / totalControls) : 0;
  $: lastEvaluated = installedPacks
    .map((p) => p.lastEvaluatedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] as string | undefined;

  async function loadAll() {
    loading = true;
    error = null;
    try {
      const [dRes, pRes, eRes, iRes] = await Promise.all([
        fetch("/api/v1/dashboard"),
        fetch("/api/compliance/api/v1/compliance-packs"),
        fetch("/api/compliance/api/v1/evidence?limit=10"),
        fetch("/api/v1/apps/integrations"),
      ]);
      if (dRes.ok) dashboard = (await dRes.json()).data ?? null;
      if (pRes.ok) packs = (await pRes.json()).data?.items ?? [];
      if (eRes.ok) evidence = (await eRes.json()).data?.items ?? [];
      if (iRes.ok) integrations = (await iRes.json()).data?.items ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(loadAll);

  function relativeTime(iso: string | null | undefined): string {
    if (!iso) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return mins > 0 ? `${mins}m ago` : "just now";
  }

  function scoreColor(score: number): string {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  function scoreBarColor(score: number): string {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  }

  function impactClass(impact: string | undefined): string {
    switch (impact) {
      case "positive": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "negative": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:         return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  }
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
    {#if dashboard?.tenant}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {dashboard.tenant.name} · {dashboard.tenant.tier} tier · {dashboard.user.email}
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mb-6"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {#each [1, 2, 3] as _}
        <div class="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={loadAll} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else}
    <!-- Hero: overall compliance score -->
    {#if installedPacks.length > 0}
      <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div class="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Overall Compliance Score</div>
            <div class="mt-2 flex items-baseline gap-3">
              <div class="text-5xl font-bold {scoreColor(overallScore)}">{overallScore}%</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {totalPass} passing · {totalFail} failing · {totalUnknown} unknown of {totalControls} controls
              </div>
            </div>
            <div class="mt-1 text-xs text-gray-400">Last evaluated {relativeTime(lastEvaluated)}</div>
          </div>
          <a href="/console/compliance/packs" class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            Manage packs →
          </a>
        </div>
        <div class="mt-5 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full {scoreBarColor(overallScore)} transition-all duration-500" style="width: {overallScore}%"></div>
        </div>
      </div>
    {:else}
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <p class="text-base font-medium text-blue-900 dark:text-blue-200">No compliance packs installed yet</p>
        <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">Install a framework pack (SOC 2, ISO 27001, NIST, HIPAA, GDPR) to start scoring evidence against controls.</p>
        <a href="/console/compliance/packs" class="mt-3 inline-block px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          Browse packs →
        </a>
      </div>
    {/if}

    <!-- Per-pack score cards -->
    {#if installedPacks.length > 0}
      <div class="mb-6">
        <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Frameworks</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {#each installedPacks as p (p.id)}
            {@const score = p.controlCount > 0 && p.passCount !== null ? Math.round((p.passCount * 100) / p.controlCount) : 0}
            <a href="/console/compliance/packs" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div class="text-xs text-gray-500 dark:text-gray-400">{p.framework}</div>
              <div class="mt-1 flex items-baseline gap-2">
                <div class="text-2xl font-bold {scoreColor(score)}">{score}%</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{p.passCount ?? 0}/{p.controlCount}</div>
              </div>
              <div class="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full {scoreBarColor(score)}" style="width: {score}%"></div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Connected integrations -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div class="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">Connected Apps</h2>
          <a href="/console/apps" class="text-xs text-blue-600 hover:underline">All →</a>
        </div>
        {#if integrations.length === 0}
          <div class="px-5 py-8 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">No apps connected</p>
            <a href="/console/apps" class="inline-block px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">Connect first app</a>
          </div>
        {:else}
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each integrations.slice(0, 5) as i (i.id)}
              <li class="px-5 py-3 flex items-center justify-between">
                <div>
                  <div class="font-medium text-gray-900 dark:text-white capitalize text-sm">{i.provider}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Synced {relativeTime(i.updated_at)}</div>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                  {i.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : i.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}">
                  {i.status}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Recent evidence stream (2-col wide) -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div class="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">Recent Evidence</h2>
          <a href="/console/compliance/evidence" class="text-xs text-blue-600 hover:underline">All →</a>
        </div>
        {#if evidence.length === 0}
          <div class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No evidence yet — connect an app to start collecting.
          </div>
        {:else}
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each evidence as e (e.id)}
              <li class="px-5 py-3">
                <div class="flex items-start gap-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 mt-0.5 {impactClass(e.metadata?.impact)}">
                    {e.metadata?.impact ?? "—"}
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{e.framework ?? ""}</span>
                      <span class="font-mono text-xs font-medium text-gray-900 dark:text-white">{e.controlId ?? "—"}</span>
                      <span class="text-xs text-gray-400">·</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{e.source}</span>
                    </div>
                    {#if e.metadata?.reasoning}
                      <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-300 truncate">{e.metadata.reasoning}</p>
                    {/if}
                  </div>
                  <div class="text-xs text-gray-400 shrink-0">{relativeTime(e.createdAt)}</div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <!-- Secondary stats row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">Evidence</div>
        <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.stats?.evidenceCount?.toLocaleString() ?? "0"}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">Automation rules</div>
        <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {dashboard?.stats?.automationRulesEnabled ?? 0}<span class="text-sm text-gray-400"> / {dashboard?.stats?.automationRulesTotal ?? 0}</span>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">Open incidents</div>
        <div class="mt-1 text-2xl font-bold {(dashboard?.stats?.openIncidents ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}">
          {dashboard?.stats?.openIncidents ?? 0}
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">Connected apps</div>
        <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {integrations.filter((i) => i.status === "active").length}<span class="text-sm text-gray-400"> / {integrations.length}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <a href="/console/compliance/controls" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white text-sm">Controls</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All state across packs</div>
      </a>
      <a href="/console/policies" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white text-sm">Policies</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create + acknowledge</div>
      </a>
      <a href="/console/directory" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white text-sm">Directory</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Users & groups</div>
      </a>
      <a href="/console/incidents" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
        <div class="font-medium text-gray-900 dark:text-white text-sm">Incidents</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Investigate & resolve</div>
      </a>
    </div>
  {/if}
</div>
