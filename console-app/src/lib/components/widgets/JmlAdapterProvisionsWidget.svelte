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
      const runs: Array<{ type: string; status: string; appId?: string; appName?: string; startedAt: string }> = data.runs ?? [];

      // Aggregate provisioning counts per app from JML runs
      const appMap = new Map<string, { appName: string; provisioned: number; deprovisioned: number; pending: number; lastActionAt: string | null }>();
      for (const run of runs) {
        const appId = run.appId || "unknown";
        const appName = run.appName || appId;
        if (!appMap.has(appId)) {
          appMap.set(appId, { appName, provisioned: 0, deprovisioned: 0, pending: 0, lastActionAt: null });
        }
        const entry = appMap.get(appId)!;
        if (run.type === "joiner" && (run.status === "completed" || run.status === "success")) entry.provisioned++;
        else if (run.type === "leaver" && (run.status === "completed" || run.status === "success")) entry.deprovisioned++;
        else if (run.status === "pending" || run.status === "running" || run.status === "in_progress") entry.pending++;
        if (!entry.lastActionAt || run.startedAt > entry.lastActionAt) entry.lastActionAt = run.startedAt;
      }

      provisions = [...appMap.entries()].map(([appId, v]) => ({
        appId,
        appName: v.appName,
        provisionedCount: v.provisioned,
        deprovisionedCount: v.deprovisioned,
        pendingCount: v.pending,
        lastActionAt: v.lastActionAt,
      }));
      state = provisions.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load provisioning data";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Adapter Provisioning" {state} {error} onRetry={load} class={className}>
  <UserCheck slot="icon" class="h-4 w-4 text-primary" />

  <div class="space-y-2">
    {#each provisions as p}
      <div class="flex items-center justify-between rounded-lg border px-3 py-2">
        <span class="text-sm font-medium">{p.appName}</span>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-green-600">+{p.provisionedCount}</span>
          <span class="text-red-500">-{p.deprovisionedCount}</span>
          {#if p.pendingCount > 0}
            <Badge variant="warning" class="text-[10px]">{p.pendingCount} pending</Badge>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</WidgetContainer>
