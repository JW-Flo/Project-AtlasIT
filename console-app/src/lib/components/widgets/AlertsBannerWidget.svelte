<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { AlertTriangle, Info, X } from "lucide-svelte";
  import type { WidgetState, AlertItem } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let alerts: AlertItem[] = [];

  function severityClasses(s: AlertItem["severity"]): string {
    if (s === "critical") return "border-destructive/30 bg-destructive/10";
    if (s === "warning") return "border-warning/30 bg-warning/10";
    return "border-blue-500/30 bg-blue-500/10";
  }

  function severityIcon(s: AlertItem["severity"]): typeof AlertTriangle {
    if (s === "critical" || s === "warning") return AlertTriangle;
    return Info;
  }

  async function dismiss(id: string) {
    alerts = alerts.filter((a) => a.id !== id);
    if (alerts.length === 0) state = "empty";
    try {
      await fetch(`/api/alerts/${id}/dismiss`, { method: "POST" });
    } catch {
      // non-blocking
    }
  }

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/alerts?active=true");
      if (!res.ok) {
        // Alerts API may not exist yet — degrade gracefully
        state = "empty";
        return;
      }
      const data = await res.json();
      alerts = Array.isArray(data.alerts) ? data.alerts : [];
      state = alerts.length > 0 ? "ready" : "empty";
    } catch {
      // Graceful fallback — alerts are non-critical
      state = "empty";
    }
  }

  onMount(load);
</script>

{#if state !== "empty"}
<WidgetContainer title="Alerts" {state} {error} onRetry={load} class={className}>
  <AlertTriangle slot="icon" class="h-4 w-4 text-orange-500" />

  <div class="space-y-2">
    {#each alerts as alert (alert.id)}
      <div class="flex items-start gap-3 rounded-lg border p-3 {severityClasses(alert.severity)}">
        <svelte:component this={severityIcon(alert.severity)} class="mt-0.5 h-4 w-4 shrink-0 {alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'warning' ? 'text-warning' : 'text-blue-500'}" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{alert.title}</span>
            <Badge variant={alert.severity === "critical" ? "destructive" : alert.severity === "warning" ? "warning" : "info"} class="text-[10px]">
              {alert.severity}
            </Badge>
          </div>
          <p class="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
          {#if alert.actionUrl}
            <Button href={alert.actionUrl} variant="outline" size="sm" class="mt-2 h-6 text-xs">
              {alert.actionLabel || "View"}
            </Button>
          {/if}
        </div>
        {#if alert.dismissible}
          <button class="shrink-0 text-muted-foreground hover:text-foreground" on:click={() => dismiss(alert.id)}>
            <X class="h-4 w-4" />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</WidgetContainer>
{/if}
