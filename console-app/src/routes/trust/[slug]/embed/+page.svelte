<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  interface TrustData {
    tenant: { name: string; slug: string };
    overallScore: number;
    totals: { controls: number; pass: number; fail: number; unknown: number };
    frameworks: Array<{ label: string; framework: string; score: number }>;
    stats: { lastSnapshotAt: string | null };
  }

  let data: TrustData | null = null;
  let loading = true;
  let error: string | null = null;
  $: slug = $page.params.slug;

  // Allow the parent page to pick a theme: ?theme=light|dark (default: light)
  // and size: ?size=compact|full (default: full). Small so it fits in a badge.
  $: theme = ($page.url.searchParams.get("theme") ?? "light").toLowerCase() === "dark" ? "dark" : "light";
  $: compact = $page.url.searchParams.get("size") === "compact";

  async function load() {
    try {
      const res = await fetch(`/api/compliance/api/v1/trust/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        const j = await res.json().catch(() => ({}));
        error = j.code === "NOT_PUBLISHED" ? "Trust center not published" : "Not found";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()).data;
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
  function fwColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-blue-100 text-blue-700",
      ISO27001: "bg-purple-100 text-purple-700",
      NIST_CSF: "bg-teal-100 text-teal-700",
      HIPAA: "bg-orange-100 text-orange-700",
      GDPR: "bg-pink-100 text-pink-700",
    };
    return map[key] ?? "bg-gray-100 text-gray-700";
  }
  function relative(iso: string | null): string {
    if (!iso) return "—";
    const ms = Date.now() - new Date(iso).getTime();
    const d = Math.floor(ms / 86400000);
    if (d > 0) return `${d}d ago`;
    const h = Math.floor(ms / 3600000);
    return h > 0 ? `${h}h ago` : "just now";
  }
</script>

<svelte:head>
  {#if data}<title>{data.tenant.name} — Trust</title>{/if}
</svelte:head>

<div class="min-h-screen {theme === 'dark' ? 'dark bg-gray-900' : 'bg-white'}" style="color-scheme: {theme};">
  <div class="{compact ? 'p-3' : 'p-5'} max-w-xl mx-auto">
    {#if loading}
      <div class="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
    {:else if error || !data}
      <div class="text-center py-6">
        <div class="text-xs text-gray-500 dark:text-gray-400">{error ?? "Unavailable"}</div>
      </div>
    {:else}
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <div class="p-4 flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Compliance score</div>
            <div class="mt-0.5 flex items-baseline gap-2">
              <div class="text-3xl font-bold {scoreColor(data.overallScore)}">{data.overallScore}%</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {data.totals.pass}/{data.totals.controls} controls · updated {relative(data.stats.lastSnapshotAt)}
              </div>
            </div>
          </div>
          <a
            href="/trust/{data.tenant.slug}"
            target="_top"
            class="shrink-0 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
          >
            Details →
          </a>
        </div>
        <div class="h-1.5 {scoreBarColor(data.overallScore)}" style="width: {data.overallScore}%"></div>
        {#if !compact && data.frameworks.length > 0}
          <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex flex-wrap gap-1.5">
            {#each data.frameworks as fw}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium {fwColor(fw.framework)}">
                {fw.framework} · {fw.score}%
              </span>
            {/each}
          </div>
        {/if}
        <div class="border-t border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[10px] text-gray-400 flex items-center justify-between">
          <span>{data.tenant.name}</span>
          <a href="/" target="_top" class="hover:underline">Powered by AtlasIT</a>
        </div>
      </div>
    {/if}
  </div>
</div>
