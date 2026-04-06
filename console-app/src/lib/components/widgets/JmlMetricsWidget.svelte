<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Users, ArrowRight, UserPlus, UserMinus, ArrowRightLeft } from "lucide-svelte";
  import type { WidgetState, JmlMetrics } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let metrics: JmlMetrics = {
    joiners30d: 0,
    movers30d: 0,
    leavers30d: 0,
    pendingActions: 0,
    automatedRate: 0,
  };

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/workflows/jml-metrics");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      metrics = {
        joiners30d: data.joiners30d ?? 0,
        movers30d: data.movers30d ?? 0,
        leavers30d: data.leavers30d ?? 0,
        pendingActions: data.pendingActions ?? 0,
        automatedRate: data.automatedRate ?? 0,
      };
      state = "ready";
    } catch (e: any) {
      error = e?.message || "Failed to load JML metrics";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="JML Lifecycle (30 days)" {state} {error} onRetry={load} class={className}>
  <Users slot="icon" class="h-4 w-4 text-primary" />
  <Button slot="actions" href="/console/workflows" variant="ghost" size="sm" class="h-7 text-xs">
    Workflows <ArrowRight class="ml-1 h-3 w-3" />
  </Button>

  <div class="grid grid-cols-3 gap-3">
    <div class="rounded-lg bg-green-500/10 p-3 text-center">
      <UserPlus class="mx-auto mb-1 h-4 w-4 text-green-500" />
      <p class="text-2xl font-bold text-foreground">{metrics.joiners30d}</p>
      <p class="text-xs text-muted-foreground">Joiners</p>
    </div>
    <div class="rounded-lg bg-blue-500/10 p-3 text-center">
      <ArrowRightLeft class="mx-auto mb-1 h-4 w-4 text-blue-500" />
      <p class="text-2xl font-bold text-foreground">{metrics.movers30d}</p>
      <p class="text-xs text-muted-foreground">Movers</p>
    </div>
    <div class="rounded-lg bg-orange-500/10 p-3 text-center">
      <UserMinus class="mx-auto mb-1 h-4 w-4 text-orange-500" />
      <p class="text-2xl font-bold text-foreground">{metrics.leavers30d}</p>
      <p class="text-xs text-muted-foreground">Leavers</p>
    </div>
  </div>

  <div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
    {#if metrics.pendingActions > 0}
      <Badge variant="warning" class="text-[10px]">{metrics.pendingActions} pending</Badge>
    {:else}
      <span>No pending actions</span>
    {/if}
    <span>{metrics.automatedRate}% automated</span>
  </div>
</WidgetContainer>
