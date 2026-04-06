<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import { ShieldCheck } from "lucide-svelte";
  import type { WidgetState, SecurityPosture } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let posture: SecurityPosture = {
    openIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    accessReviewsTotal: 0,
    accessReviewsCompleted: 0,
    accessReviewCompletionRate: 0,
  };

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/analytics/dashboard");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      posture = data.securityPosture ?? posture;
      state = "ready";
    } catch (e: any) {
      error = e?.message || "Failed to load security posture";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Security Posture" widgetId="security-posture" {state} {error} onRetry={load} class={className}>
  <ShieldCheck slot="icon" class="h-4 w-4 text-primary" />

  <div class="grid grid-cols-3 gap-4">
    <div class="rounded-lg bg-muted/50 p-3 text-center">
      <p class="text-xs text-muted-foreground">Open Incidents</p>
      <p class="text-2xl font-bold {posture.openIncidents > 0 ? 'text-orange-500' : 'text-foreground'}">{posture.openIncidents}</p>
      {#if posture.criticalIncidents > 0}
        <Badge variant="destructive" class="text-[10px] mt-1">{posture.criticalIncidents} critical</Badge>
      {/if}
    </div>
    <div class="rounded-lg bg-muted/50 p-3 text-center">
      <p class="text-xs text-muted-foreground">Resolved</p>
      <p class="text-2xl font-bold text-green-500">{posture.resolvedIncidents}</p>
    </div>
    <div class="rounded-lg bg-muted/50 p-3 text-center">
      <p class="text-xs text-muted-foreground">Access Reviews</p>
      <p class="text-2xl font-bold text-foreground">{posture.accessReviewsCompleted}/{posture.accessReviewsTotal}</p>
    </div>
  </div>

  <!-- Access review progress bar -->
  {#if posture.accessReviewsTotal > 0}
    <div class="mt-4 space-y-1">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Review Completion</span>
        <span class="font-medium text-foreground">{posture.accessReviewCompletionRate}%</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-green-500 transition-all duration-500"
          style="width: {posture.accessReviewCompletionRate}%"
        ></div>
      </div>
    </div>
  {/if}
</WidgetContainer>
