<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Zap, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-svelte";

  interface SmartAlert {
    id: string;
    type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    detail: string;
    impact: string;
    recommendedAction: string;
    affectedControls: string[];
    detectedAt: string;
    acknowledged: boolean;
  }

  let alerts: SmartAlert[] = [];
  let evaluatedAt: string | null = null;
  let loading = true;
  let expandedId: string | null = null;

  async function loadAlerts() {
    try {
      const res = await fetch("/api/copilot/smart-alerts");
      if (res.ok) {
        const data = await res.json();
        alerts = data.alerts ?? [];
        evaluatedAt = data.evaluatedAt;
      }
    } catch {}
    loading = false;
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const res = await fetch("/api/copilot/smart-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        alerts = alerts.map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a,
        );
      }
    } catch {}
  }

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  $: activeAlerts = alerts.filter((a) => !a.acknowledged);
  $: acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  function severityIcon(s: string) {
    if (s === "critical") return XCircle;
    if (s === "warning") return AlertTriangle;
    return Zap;
  }

  function severityColor(s: string): string {
    if (s === "critical") return "text-red-500";
    if (s === "warning") return "text-yellow-500";
    return "text-blue-500";
  }

  function severityBg(s: string): string {
    if (s === "critical") return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950";
    if (s === "warning") return "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950";
    return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950";
  }

  function formatAlertType(type: string): string {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  onMount(loadAlerts);
</script>

{#if loading}
  <Skeleton class="h-48 w-full" />
{:else if alerts.length > 0}
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Zap class="h-5 w-5 text-primary" />
          Smart Alerts
          {#if activeAlerts.length > 0}
            <Badge variant="destructive" class="text-xs">{activeAlerts.length}</Badge>
          {/if}
        </CardTitle>
        {#if evaluatedAt}
          <span class="text-xs text-muted-foreground">Updated {timeAgo(evaluatedAt)}</span>
        {/if}
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      {#each activeAlerts as alert (alert.id)}
        <div class="rounded-lg border {severityBg(alert.severity)} p-3">
          <button
            class="w-full text-left flex items-start justify-between gap-2"
            on:click={() => toggle(alert.id)}
          >
            <div class="flex items-start gap-2 min-w-0">
              <svelte:component this={severityIcon(alert.severity)} class="h-4 w-4 shrink-0 mt-0.5 {severityColor(alert.severity)}" />
              <div class="min-w-0">
                <span class="text-sm font-medium block">{alert.title}</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" class="text-xs">{formatAlertType(alert.type)}</Badge>
                  <span class="text-xs text-muted-foreground">{timeAgo(alert.detectedAt)}</span>
                </div>
              </div>
            </div>
            {#if expandedId === alert.id}
              <ChevronUp class="h-4 w-4 shrink-0 text-muted-foreground" />
            {:else}
              <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
            {/if}
          </button>

          {#if expandedId === alert.id}
            <div class="mt-3 ml-6 space-y-2 text-sm">
              <p class="text-foreground">{alert.detail}</p>
              <div class="rounded-md bg-background/50 p-2">
                <p class="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Impact</p>
                <p>{alert.impact}</p>
              </div>
              <div class="rounded-md bg-background/50 p-2">
                <p class="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Recommended Action</p>
                <p>{alert.recommendedAction}</p>
              </div>
              {#if alert.affectedControls.length > 0}
                <p class="text-xs text-muted-foreground">
                  Affected controls: {alert.affectedControls.join(", ")}
                </p>
              {/if}
              <div class="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  on:click|stopPropagation={() => acknowledgeAlert(alert.id)}
                >
                  <CheckCircle class="h-3.5 w-3.5 mr-1" />
                  Acknowledge
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}

      {#if acknowledgedAlerts.length > 0}
        <details class="text-sm">
          <summary class="cursor-pointer text-muted-foreground hover:text-foreground py-1">
            {acknowledgedAlerts.length} acknowledged alert{acknowledgedAlerts.length > 1 ? "s" : ""}
          </summary>
          <div class="mt-2 space-y-2">
            {#each acknowledgedAlerts as alert (alert.id)}
              <div class="flex items-center gap-2 rounded-md border border-border px-3 py-2 opacity-60">
                <CheckCircle class="h-4 w-4 text-green-500 shrink-0" />
                <span class="text-sm">{alert.title}</span>
                <Badge variant="outline" class="text-xs ml-auto">{formatAlertType(alert.type)}</Badge>
              </div>
            {/each}
          </div>
        </details>
      {/if}
    </CardContent>
  </Card>
{/if}
