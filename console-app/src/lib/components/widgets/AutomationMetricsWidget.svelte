<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Activity, ArrowRight } from "lucide-svelte";
  import { dashboardContext } from "$lib/stores/dashboard-context";
  import type { WidgetState, AutomationMetrics } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let metrics: AutomationMetrics = {
    totalRules: 0,
    activeRules: 0,
    rulesExecuted: 0,
    successRate: 0,
    failureCount: 0,
    timeSavedHours: 0,
  };

  async function load() {
    state = "loading";
    error = null;
    try {
      const days = $dashboardContext.dateRange;
      const res = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      metrics = data.automationMetrics ?? metrics;
      state = metrics.totalRules > 0 || metrics.rulesExecuted > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load automation metrics";
      state = "error";
    }
  }

  $: if ($dashboardContext) load();

  onMount(load);
</script>

<WidgetContainer title="Automation Performance" widgetId="automation-metrics" {state} {error} onRetry={load} class={className}>
  <Activity slot="icon" class="h-4 w-4 text-violet-500" />
  <Button slot="actions" href="/console/automation" variant="ghost" size="sm" class="h-7 text-xs">
    Rules <ArrowRight class="ml-1 h-3 w-3" />
  </Button>

  <div class="grid grid-cols-2 gap-4">
    <div class="rounded-lg bg-muted/50 p-3">
      <p class="text-xs text-muted-foreground">Active Rules</p>
      <p class="text-2xl font-bold text-foreground">{metrics.activeRules}</p>
      <p class="text-xs text-muted-foreground">of {metrics.totalRules} total</p>
    </div>
    <div class="rounded-lg bg-muted/50 p-3">
      <p class="text-xs text-muted-foreground">Success Rate</p>
      <p class="text-2xl font-bold text-foreground">{metrics.successRate}%</p>
      <p class="text-xs text-muted-foreground">{metrics.failureCount} failures</p>
    </div>
    <div class="rounded-lg bg-muted/50 p-3">
      <p class="text-xs text-muted-foreground">Executions</p>
      <p class="text-2xl font-bold text-foreground">{metrics.rulesExecuted.toLocaleString()}</p>
      <p class="text-xs text-muted-foreground">total runs</p>
    </div>
    <div class="rounded-lg bg-muted/50 p-3">
      <p class="text-xs text-muted-foreground">Time Saved</p>
      <p class="text-2xl font-bold text-foreground">~{metrics.timeSavedHours}h</p>
      <p class="text-xs text-muted-foreground">estimated</p>
    </div>
  </div>
</WidgetContainer>
