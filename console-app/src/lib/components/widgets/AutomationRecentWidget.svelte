<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { GitBranch } from "lucide-svelte";
  import { formatDuration, triggerLabel } from "./utils";
  import type { WidgetState, AutomationExecution } from "./types";

  let className = "";
  export { className as class };
  export let limit = 5;

  let state: WidgetState = "loading";
  let error: string | null = null;
  let runs: AutomationExecution[] = [];

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch(`/api/automation/executions?limit=${limit}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      runs = Array.isArray(data.executions) ? data.executions : [];
      state = runs.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load automation runs";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Recent Automation Runs" widgetId="automation-recent" {state} {error} onRetry={load} class={className}>
  <GitBranch slot="icon" class="h-4 w-4 text-primary" />
  <Button slot="actions" href="/console/automation/runs" variant="ghost" size="sm" class="h-7 text-xs">
    View all
  </Button>

  <div class="-mx-6 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th class="px-5 py-2 font-medium">Rule</th>
          <th class="px-5 py-2 font-medium">Trigger</th>
          <th class="px-5 py-2 font-medium">Status</th>
          <th class="px-5 py-2 font-medium">Duration</th>
          <th class="px-5 py-2 font-medium">Started</th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run}
          <tr
            class="border-t transition-colors hover:bg-muted/50 cursor-pointer"
            on:click={() => { window.location.href = `/console/automation?tab=history&exec=${run.id}`; }}
          >
            <td class="px-5 py-2.5 font-medium">{run.ruleName || "Untitled rule"}</td>
            <td class="px-5 py-2.5 text-muted-foreground">{triggerLabel(run.triggerEvent)}</td>
            <td class="px-5 py-2.5">
              <Badge variant={run.status === "success" ? "success" : run.status === "failed" ? "destructive" : "secondary"}>
                {run.status}
              </Badge>
            </td>
            <td class="px-5 py-2.5 text-muted-foreground">{formatDuration(run.durationMs)}</td>
            <td class="px-5 py-2.5 text-muted-foreground">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "--"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</WidgetContainer>
