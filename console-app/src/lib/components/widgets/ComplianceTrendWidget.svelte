<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import { TrendingUp } from "lucide-svelte";
  import { trendPolyline, trendAreaPath, shortWeek } from "./utils";
  import { dashboardContext } from "$lib/stores/dashboard-context";
  import type { WidgetState, TrendPoint } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let trend: TrendPoint[] = [];
  let trendDelta = 0;

  const chartW = 480;
  const chartH = 160;
  const pad = 10;

  $: polyline = trendPolyline(trend, chartW, chartH, pad);
  $: areaPath = trendAreaPath(trend, chartW, chartH, pad);

  async function load() {
    state = "loading";
    error = null;
    try {
      const days = $dashboardContext.dateRange;
      const res = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      trend = data.complianceTrend ?? [];
      trendDelta = data.trendDelta ?? 0;
      state = trend.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load trend data";
      state = "error";
    }
  }

  $: if ($dashboardContext) load();

  onMount(load);
</script>

<WidgetContainer title="Compliance Trend" widgetId="compliance-trend" {state} {error} onRetry={load} class={className}>
  <TrendingUp slot="icon" class="h-4 w-4 text-primary" />

  <!-- Delta badge -->
  {#if trendDelta !== 0}
    <div class="mb-2 text-xs">
      {#if trendDelta > 0}
        <span class="text-green-600">+{trendDelta}% this week</span>
      {:else}
        <span class="text-red-600">{trendDelta}% this week</span>
      {/if}
    </div>
  {/if}

  <!-- SVG chart -->
  <div class="overflow-hidden rounded-md">
    <svg viewBox="0 0 {chartW} {chartH}" class="w-full" aria-label="Compliance score trend">
      <defs>
        <linearGradient id="wTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.3" />
          <stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      {#each [25, 50, 75, 100] as gridVal}
        {@const scores = trend.map((p) => p.score)}
        {@const minS = Math.min(...scores)}
        {@const maxS = Math.max(...scores)}
        {@const range = maxS - minS || 1}
        {@const gy = pad + (chartH - pad * 2) - ((gridVal - minS) / range) * (chartH - pad * 2)}
        {#if gy >= pad && gy <= chartH - pad}
          <line x1={pad} y1={gy} x2={chartW - pad} y2={gy} stroke="hsl(var(--border))" stroke-width="0.5" stroke-dasharray="4,4" />
          <text x={pad + 2} y={gy - 2} font-size="9" fill="hsl(var(--muted-foreground))">{gridVal}%</text>
        {/if}
      {/each}

      <path d={areaPath} fill="url(#wTrendGrad)" />
      <polyline points={polyline} fill="none" stroke="hsl(var(--primary))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

      {#each trend as point, i}
        {@const x = pad + (trend.length === 1 ? (chartW - pad * 2) / 2 : (i / (trend.length - 1)) * (chartW - pad * 2))}
        {@const scores2 = trend.map((p) => p.score)}
        {@const minS = Math.min(...scores2)}
        {@const maxS = Math.max(...scores2)}
        {@const rng = maxS - minS || 1}
        {@const y = pad + (chartH - pad * 2) - ((point.score - minS) / rng) * (chartH - pad * 2)}
        {#if i === 0 || i === trend.length - 1 || i % 3 === 0}
          <circle cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
        {/if}
      {/each}
    </svg>
  </div>

  <!-- X-axis labels -->
  <div class="mt-1 flex justify-between text-xs text-muted-foreground">
    {#if trend.length > 0}
      <span>{shortWeek(trend[0].week)}</span>
      <span>{shortWeek(trend[Math.floor(trend.length / 2)].week)}</span>
      <span>{shortWeek(trend[trend.length - 1].week)}</span>
    {/if}
  </div>
</WidgetContainer>
