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
      // Fetch connected apps and adapter health in parallel
      const [connRes, healthRes] = await Promise.all([
        fetch("/api/integrations/connected"),
        fetch("/api/integrations/health"),
      ]);

      const connData = connRes.ok ? await connRes.json() : { apps: [] };
      const healthData = healthRes.ok ? await healthRes.json() : { adapters: [] };

      // Build a health lookup by slug
      const healthMap = new Map<string, any>();
      for (const h of healthData.adapters ?? []) {
        healthMap.set(h.slug, h);
      }

      // Map connected apps to adapter health entries
      const connApps: Array<{ appId: string }> = connData.apps ?? [];
      adapters = connApps.map((app) => {
        const slug = app.appId;
        const health = healthMap.get(slug);
        const hasError = !!health?.error;
        return {
          appId: slug,
          appName: slug,
          connected: true,
          status: (hasError ? "degraded" : health ? "healthy" : "unknown") as AdapterHealth["status"],
          lastSyncAt: health?.collectedAt ?? null,
          errorCount: hasError ? 1 : 0,
        };
      });

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
