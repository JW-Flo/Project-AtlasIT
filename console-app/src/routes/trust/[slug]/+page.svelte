<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  interface TrustData {
    tenant: { name: string; slug: string; industry: string | null; size: string | null };
    overallScore: number;
    totals: { controls: number; pass: number; fail: number; unknown: number };
    frameworks: Array<{
      label: string;
      framework: string;
      controlCount: number;
      score: number;
      lastEvaluatedAt: string | null;
    }>;
    stats: {
      connectedApps: number;
      evidenceLast30Days: number;
      lastSnapshotAt: string | null;
      signedAttestations?: number;
    };
    commitment: string;
  }

  let data: TrustData | null = null;
  let loading = true;
  let error: string | null = null;

  $: slug = $page.params.slug;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        const j = await res.json().catch(() => ({}));
        error = j.code === "NOT_PUBLISHED"
          ? "This organization has not published their trust center."
          : "No trust center found for that URL.";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      data = json.data;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(load);

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
  function frameworkColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-blue-100 text-blue-700",
      ISO27001: "bg-purple-100 text-purple-700",
      NIST_CSF: "bg-teal-100 text-teal-700",
      HIPAA: "bg-orange-100 text-orange-700",
      GDPR: "bg-pink-100 text-pink-700",
    };
    return map[key] ?? "bg-gray-100 text-gray-700";
  }
  function relativeTime(iso: string | null): string {
    if (!iso) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return "just now";
  }
</script>

<svelte:head>
  {#if data}
    <title>{data.tenant.name} — Trust Center</title>
    <meta name="description" content="Live compliance posture for {data.tenant.name}. Score: {data.overallScore}%." />
  {:else}
    <title>Trust Center — AtlasIT</title>
  {/if}
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-5xl mx-auto px-6 py-10">
    {#if loading}
      <div class="space-y-4">
        <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        <div class="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        <div class="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>
    {:else if error || !data}
      <div class="mt-20 text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Trust Center Not Available</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">{error ?? "Unknown error."}</p>
        <a href="/" class="mt-6 inline-block text-sm text-blue-600 hover:underline">← Back to AtlasIT</a>
      </div>
    {:else}
      <div class="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Trust Center</div>
          <h1 class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.tenant.name}</h1>
          {#if data.tenant.industry}
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {data.tenant.industry}{data.tenant.size ? ` · ${data.tenant.size} employees` : ""}
            </p>
          {/if}
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 dark:text-gray-400">Powered by</div>
          <a href="/" class="text-sm font-semibold text-blue-600 hover:underline">AtlasIT</a>
        </div>
      </div>

      <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 mb-6 shadow-sm">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Continuous Compliance Score
            </div>
            <div class="mt-3 flex items-baseline gap-3 flex-wrap">
              <div class="text-6xl font-bold {scoreColor(data.overallScore)}">{data.overallScore}%</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {data.totals.pass} passing · {data.totals.fail} failing · {data.totals.unknown} unknown
                <span class="text-gray-400"> of {data.totals.controls} controls</span>
              </div>
            </div>
            {#if data.stats.lastSnapshotAt}
              <div class="mt-1 text-xs text-gray-400">Updated {relativeTime(data.stats.lastSnapshotAt)}</div>
            {/if}
          </div>
        </div>
        <div class="mt-5 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full {scoreBarColor(data.overallScore)} transition-all duration-700" style="width: {data.overallScore}%"></div>
        </div>
        <p class="mt-6 text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">{data.commitment}</p>
      </div>

      <h2 class="mt-10 mb-3 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Frameworks</h2>
      {#if data.frameworks.length === 0}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">No frameworks installed yet.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {#each data.frameworks as fw}
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium {frameworkColor(fw.framework)}">{fw.framework}</span>
              <div class="mt-2 font-medium text-sm text-gray-900 dark:text-white">{fw.label}</div>
              <div class="mt-2 flex items-baseline gap-2">
                <div class="text-2xl font-bold {scoreColor(fw.score)}">{fw.score}%</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{fw.controlCount} controls</div>
              </div>
              <div class="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full {scoreBarColor(fw.score)}" style="width: {fw.score}%"></div>
              </div>
              <p class="mt-2 text-[11px] text-gray-400">Last evaluated {relativeTime(fw.lastEvaluatedAt)}</p>
            </div>
          {/each}
        </div>
      {/if}

      <h2 class="mt-10 mb-3 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Operational Stats</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div class="text-xs text-gray-500 dark:text-gray-400">Connected integrations</div>
          <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.stats.connectedApps}</div>
          <p class="mt-1 text-xs text-gray-400">Active live-data sources</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div class="text-xs text-gray-500 dark:text-gray-400">Evidence last 30 days</div>
          <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.stats.evidenceLast30Days.toLocaleString()}</div>
          <p class="mt-1 text-xs text-gray-400">Operational records scored</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div class="text-xs text-gray-500 dark:text-gray-400">Signed attestations</div>
          <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.stats.signedAttestations ?? 0}</div>
          <p class="mt-1 text-xs text-gray-400">Formal executive sign-offs</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div class="text-xs text-gray-500 dark:text-gray-400">Update cadence</div>
          <div class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Daily</div>
          <p class="mt-1 text-xs text-gray-400">Nightly re-evaluation at 02:00 UTC</p>
        </div>
      </div>

      <div class="mt-12 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          This page is publicly accessible. For detailed evidence bundles (auditor package, SOC 2 Type II report),
          contact {data.tenant.name} directly.
        </p>
        <p class="mt-3 text-xs text-gray-400">
          Verify trust center integrity: scores are generated by AtlasIT's CDT rule engine from live operational data —
          not self-attestation. <a href="/" class="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>
    {/if}
  </div>
</div>
