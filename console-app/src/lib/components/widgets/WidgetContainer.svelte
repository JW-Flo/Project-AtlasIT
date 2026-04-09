<script lang="ts">
  import { cn } from "$lib/utils";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { RefreshCw, AlertTriangle, Download } from "lucide-svelte";
  import type { WidgetState } from "./types";
  import { dashboardContext } from "$lib/stores/dashboard-context";
  import { get } from "svelte/store";

  export let title: string;
  export let state: WidgetState = "ready";
  export let error: string | null = null;
  export let onRetry: (() => void) | null = null;
  /** Widget ID — when set, enables CSV export button. */
  export let widgetId: string | null = null;
  /** Hide the header (for compact/inline widgets like alerts-banner). */
  export let headerless = false;
  /** Extra CSS class on the outer card. */
  let className = "";
  export { className as class };

  function exportCSV() {
    if (!widgetId) return;
    const ctx = get(dashboardContext);
    const params = new URLSearchParams({ widget: widgetId, days: ctx.dateRange });
    if (ctx.frameworkFilter) params.set("framework", ctx.frameworkFilter);
    window.open(`/api/dashboard/export?${params}`, "_blank");
  }
</script>

<Card class={cn("flex flex-col", className)}>
  {#if !headerless}
    <CardHeader class="flex-row items-center justify-between pb-2">
      <CardTitle class="flex items-center gap-2 text-sm font-semibold">
        <slot name="icon" />
        {title}
      </CardTitle>
      <div class="flex items-center gap-1">
        <slot name="actions" />
        {#if widgetId && state === "ready"}
          <Button variant="ghost" size="sm" on:click={exportCSV} class="h-7 w-7 p-0" title="Export CSV">
            <Download class="h-3.5 w-3.5" />
          </Button>
        {/if}
        {#if onRetry && state !== "loading"}
          <Button variant="ghost" size="sm" on:click={onRetry} class="h-7 w-7 p-0">
            <RefreshCw class="h-3.5 w-3.5" />
          </Button>
        {/if}
      </div>
    </CardHeader>
  {/if}

  <CardContent class={headerless ? "p-0" : ""}>
    {#if state === "loading"}
      <div class="space-y-3" aria-busy="true">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-8 w-1/2" />
        <Skeleton class="h-4 w-2/3" />
      </div>
    {:else if state === "error"}
      <div class="flex flex-col items-center gap-2 py-4 text-sm text-destructive">
        <AlertTriangle class="h-5 w-5" />
        <p>{error || "Failed to load data"}</p>
        {#if onRetry}
          <Button variant="outline" size="sm" on:click={onRetry}>Retry</Button>
        {/if}
      </div>
    {:else if state === "empty"}
      <slot name="empty">
        <p class="py-4 text-center text-sm text-muted-foreground">No data available.</p>
      </slot>
    {:else}
      <slot />
    {/if}
  </CardContent>
</Card>
