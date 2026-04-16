<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import { UserCheck } from "lucide-svelte";
  import type { WidgetState, AdapterProvision } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let provisions: AdapterProvision[] = [];

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/jml/runs?limit=200");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const runs: any[] = Array.isArray(data.runs) ? data.runs : [];

      // Aggregate provisioning counts per app from JML run data
      const appMap = new Map<string, { provisioned: number; deprovisioned: number; pending: number }>();
      for (const run of runs) {
        const appName = run.appName || run.appId || "Unknown";
        if (!appMap.has(appName)) appMap.set(appName, { provisioned: 0, deprovisioned: 0, pending: 0 });
        const entry = appMap.get(appName)!;
        if (run.status === "completed" || run.status === "success") {
          if (run.type === "leaver") entry.deprovisioned++;
          else entry.provisioned++;
        } else if (run.status === "pending" || run.status === "in_progress") {
          entry.pending++;
        }
      }

      provisions = Array.from(appMap.entries()).map(([appName, counts]) => ({
        appName,
        provisionedCount: counts.provisioned,
        deprovisionedCount: counts.deprovisioned,
        pendingCount: counts.pending,
      }));

      state = provisions.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load provisioning data";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Adapter Provisioning" widgetId="jml-adapter-provisions" {state} {error} onRetry={load} class={className}>
  <UserCheck slot="icon" class="h-4 w-4 text-primary" />

  <div class="space-y-2">
    {#each provisions as p}
      <div class="flex items-center justify-between rounded-lg border px-3 py-2">
        <span class="text-sm font-medium">{p.appName}</span>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-success">+{p.provisionedCount}</span>
          <span class="text-destructive">-{p.deprovisionedCount}</span>
          {#if p.pendingCount > 0}
            <Badge variant="warning" class="text-[10px]">{p.pendingCount} pending</Badge>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</WidgetContainer>
