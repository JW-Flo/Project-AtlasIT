<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Link, ArrowRight } from "lucide-svelte";
  import type { WidgetState, AdapterHealth } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let adapters: AdapterHealth[] = [];

  function statusColor(s: AdapterHealth["status"]): string {
    if (s === "healthy") return "bg-green-500";
    if (s === "degraded") return "bg-yellow-500";
    if (s === "down") return "bg-red-500";
    return "bg-gray-400";
  }

  function statusBadge(s: AdapterHealth["status"]): "success" | "warning" | "destructive" | "secondary" {
    if (s === "healthy") return "success";
    if (s === "degraded") return "warning";
    if (s === "down") return "destructive";
    return "secondary";
  }

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/tenant/dashboard");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();

      // Build adapter list from connected apps info
      const apps: any[] = data.connectedAppsList ?? data.adapters ?? [];
      adapters = apps.map((a: any) => ({
        appId: a.appId ?? a.id ?? "",
        appName: a.appName ?? a.name ?? a.appId ?? "Unknown",
        connected: a.connected !== false,
        status: a.status ?? (a.connected !== false ? "healthy" : "down"),
        lastSyncAt: a.lastSyncAt ?? a.lastSync ?? null,
        errorCount: a.errorCount ?? 0,
      }));

      state = adapters.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load adapter health";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Adapter Health" {state} {error} onRetry={load} class={className}>
  <Link slot="icon" class="h-4 w-4 text-primary" />
  <Button slot="actions" href="/console/marketplace" variant="ghost" size="sm" class="h-7 text-xs">
    Manage <ArrowRight class="ml-1 h-3 w-3" />
  </Button>

  <div slot="empty" class="py-4 text-center">
    <p class="text-sm text-muted-foreground mb-2">No connected adapters yet.</p>
    <Button href="/console/marketplace" variant="outline" size="sm">Browse Marketplace</Button>
  </div>

  <div class="space-y-2">
    {#each adapters as adapter}
      <div class="flex items-center justify-between rounded-lg border px-3 py-2">
        <div class="flex items-center gap-2.5">
          <div class="h-2 w-2 shrink-0 rounded-full {statusColor(adapter.status)}"></div>
          <span class="text-sm font-medium">{adapter.appName}</span>
        </div>
        <div class="flex items-center gap-2">
          {#if adapter.errorCount > 0}
            <span class="text-xs text-red-500">{adapter.errorCount} errors</span>
          {/if}
          <Badge variant={statusBadge(adapter.status)} class="text-xs">{adapter.status}</Badge>
          {#if adapter.lastSyncAt}
            <span class="text-[11px] text-muted-foreground">{new Date(adapter.lastSyncAt).toLocaleString()}</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</WidgetContainer>
