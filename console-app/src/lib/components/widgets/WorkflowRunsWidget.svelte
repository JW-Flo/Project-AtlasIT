<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Workflow, ArrowRight } from "lucide-svelte";
  import type { WidgetState, WorkflowRun } from "./types";

  let className = "";
  export { className as class };
  export let limit = 6;

  let state: WidgetState = "loading";
  let error: string | null = null;
  let runs: WorkflowRun[] = [];

  function statusVariant(s: string): "success" | "destructive" | "warning" | "secondary" {
    if (s === "completed" || s === "success") return "success";
    if (s === "failed") return "destructive";
    if (s === "running" || s === "in_progress") return "warning";
    return "secondary";
  }

  function typeLabel(t: string): string {
    const map: Record<string, string> = {
      joiner: "Joiner",
      mover: "Mover",
      leaver: "Leaver",
      manual: "Manual",
    };
    return map[t] ?? t;
  }

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch(`/api/jml/runs?limit=${limit}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      runs = Array.isArray(data.runs) ? data.runs : [];
      state = runs.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load workflow runs";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Workflow Runs" widgetId="workflow-runs" {state} {error} onRetry={load} class={className}>
  <Workflow slot="icon" class="h-4 w-4 text-primary" />
  <Button slot="actions" href="/console/workflows" variant="ghost" size="sm" class="h-7 text-xs">
    All workflows <ArrowRight class="ml-1 h-3 w-3" />
  </Button>

  <div class="-mx-6 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th class="px-5 py-2 font-medium">Type</th>
          <th class="px-5 py-2 font-medium">User</th>
          <th class="px-5 py-2 font-medium">App</th>
          <th class="px-5 py-2 font-medium">Status</th>
          <th class="px-5 py-2 font-medium">Started</th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run}
          <tr class="border-t transition-colors hover:bg-muted/50">
            <td class="px-5 py-2.5">
              <Badge variant="secondary" class="text-xs">{typeLabel(run.type)}</Badge>
            </td>
            <td class="px-5 py-2.5 text-muted-foreground">{run.userEmail || run.userId || "--"}</td>
            <td class="px-5 py-2.5 text-muted-foreground">{run.appName || run.appId || "--"}</td>
            <td class="px-5 py-2.5">
              <Badge variant={statusVariant(run.status)} class="text-xs">{run.status}</Badge>
            </td>
            <td class="px-5 py-2.5 text-muted-foreground">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "--"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</WidgetContainer>
