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
    if (s === "healthy") return "bg-success";
    if (s === "degraded") return "bg-warning";
    if (s === "down") return "bg-destructive";
    return "bg-muted-foreground";
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
      const [connectedRes, healthRes] = await Promise.all([
        fetch("/api/integrations/connected"),
        fetch("/api/integrations/health"),
      ]);

      if (!connectedRes.ok) throw new Error(`Connected apps request failed (${connectedRes.status})`);

      const connectedData = await connectedRes.json();
      const connectedApps: any[] = Array.isArray(connectedData.apps) ? connectedData.apps : [];

      // Build health lookup from adapter_collection_health
      const healthMap = new Map<string, any>();
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        const healthList: any[] = Array.isArray(healthData.adapters) ? healthData.adapters : [];
        for (const h of healthList) {
          healthMap.set(h.slug, h);
        }
      }

      adapters = connectedApps.map((app: any) => {
        const appId = app.appId ?? app.id ?? "";
        const health = healthMap.get(appId);
        const hasError = health?.error != null;
        return {
          appId,
          appName: app.appName ?? app.name ?? appId,
          connected: true,
          status: hasError ? "degraded" : "healthy",
          lastSyncAt: health?.collectedAt ?? null,
          errorCount: hasError ? 1 : 0,
        } as AdapterHealth;
      });

      state = adapters.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load adapter health";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Adapter Health" widgetId="adapter-health" {state} {error} onRetry={load} class={className}>
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
            <span class="text-xs text-destructive">{adapter.errorCount} errors</span>
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
