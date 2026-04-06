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
      const res = await fetch("/api/workflows/adapter-provisions");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      provisions = Array.isArray(data.provisions) ? data.provisions : [];
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
