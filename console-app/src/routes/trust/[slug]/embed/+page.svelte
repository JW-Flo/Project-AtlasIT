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

  function scoreText(score: number): string {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  }
  function scoreBg(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  }
  function fwBadge(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      ISO27001: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
      NIST_CSF: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      HIPAA: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
      GDPR: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    };
    return map[key] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
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
  {#if data}<title>{data.tenant.name} · Trust</title>{/if}
  <style>
    /* Embed pages are sandbox iframes — set self-contained body styles */
    html, body { background: transparent; margin: 0; padding: 0; font-family: Inter, -apple-system, system-ui, sans-serif; }
  </style>
</svelte:head>

<div class={theme === "dark" ? "dark" : ""} style="color-scheme: {theme};">
  <div class="{compact ? 'p-2' : 'p-3'}">
    {#if loading}
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
        <div class="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded mb-2"></div>
        <div class="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
      </div>
    {:else if error || !data}
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
        <div class="text-xs text-zinc-500 dark:text-zinc-400">{error ?? "Unavailable"}</div>
      </div>
    {:else}
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div class="p-4 flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
              Live Compliance Score
            </div>
            <div class="mt-1 flex items-baseline gap-2">
              <div class="text-3xl font-semibold tabular-nums tracking-tight {scoreText(data.overallScore)}">
                {data.overallScore}<span class="text-base text-zinc-400">%</span>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                {data.totals.pass}/{data.totals.controls} controls · {relative(data.stats.lastSnapshotAt)}
              </div>
            </div>
          </div>
          <a
            href="/trust/{data.tenant.slug}"
            target="_top"
            class="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Details →
          </a>
        </div>

        <div class="h-1 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 {scoreBg(data.overallScore)} transition-all duration-700"
            style="width: {data.overallScore}%"
          ></div>
        </div>

        {#if !compact && data.frameworks.length > 0}
          <div class="border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-wrap gap-1.5">
            {#each data.frameworks as fw}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums {fwBadge(fw.framework)}">
                {fw.framework.replace("_", " ")} <span class="opacity-60">·</span> {fw.score}%
              </span>
            {/each}
          </div>
        {/if}

        <div class="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
          <span class="truncate">{data.tenant.name}</span>
          <a href="/" target="_top" class="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium shrink-0">
            Powered by AtlasIT
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>
