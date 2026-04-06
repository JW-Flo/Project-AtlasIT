<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import { BarChart3 } from "lucide-svelte";
  import { barRects, shortWeek } from "./utils";
  import type { WidgetState, EvidenceVolume } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let volume: EvidenceVolume[] = [];
  let totalEvidence = 0;

  const chartW = 480;
  const chartH = 120;
  const pad = 8;

  $: rects = barRects(volume, chartW, chartH, pad);

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/analytics/dashboard");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      volume = data.evidenceVolume ?? [];
      totalEvidence = data.totalEvidence ?? 0;
      state = volume.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load evidence volume";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Evidence Volume (Weekly)" {state} {error} onRetry={load} class={className}>
  <BarChart3 slot="icon" class="h-4 w-4 text-blue-500" />

  <div class="overflow-hidden rounded-md">
    <svg viewBox="0 0 {chartW} {chartH}" class="w-full" aria-label="Evidence collected per week">
      {#each rects as rect}
        <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="2" fill="hsl(var(--primary))" opacity="0.75" />
      {/each}
    </svg>
  </div>

  <div class="mt-1 flex justify-between text-xs text-muted-foreground">
    {#if volume.length > 0}
      <span>{shortWeek(volume[0].week)}</span>
      <span>{shortWeek(volume[Math.floor(volume.length / 2)].week)}</span>
      <span>{shortWeek(volume[volume.length - 1].week)}</span>
    {/if}
  </div>
  <p class="mt-2 text-xs text-muted-foreground">
    {totalEvidence.toLocaleString()} total evidence items collected
  </p>
</WidgetContainer>
