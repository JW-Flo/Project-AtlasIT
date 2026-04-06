<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Activity, ArrowRight } from "lucide-svelte";
  import { sinceDate, dashboardContext } from "$lib/stores/dashboard-context";
  import type { WidgetState, EvidenceFeedItem } from "./types";

  let className = "";
  export { className as class };
  export let limit = 8;

  let state: WidgetState = "loading";
  let error: string | null = null;
  let feed: EvidenceFeedItem[] = [];
  let totalEvidence = 0;

  async function load() {
    state = "loading";
    error = null;
    try {
      const since = $sinceDate;
      const fw = $dashboardContext.frameworkFilter;
      let url = `/api/evidence-feed?limit=${limit}&since=${encodeURIComponent(since)}`;
      if (fw) url += `&framework=${encodeURIComponent(fw)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      feed = Array.isArray(data.feed) ? data.feed : [];
      totalEvidence = data.summary?.totalEvidence ?? 0;
      state = feed.length > 0 ? "ready" : "empty";
    } catch (e: any) {
      error = e?.message || "Failed to load evidence feed";
      state = "error";
    }
  }

  // Reload on context changes
  $: if ($dashboardContext) load();

  onMount(load);
</script>

<WidgetContainer title="Live Evidence Stream" {state} {error} onRetry={load} class={className}>
  <Activity slot="icon" class="h-4 w-4 text-primary" />
  <svelte:fragment slot="actions">
    <Badge variant="secondary">{totalEvidence} total</Badge>
    <Button href="/console/compliance/feed" variant="ghost" size="sm" class="h-7 text-xs">
      Full feed <ArrowRight class="ml-1 h-3 w-3" />
    </Button>
  </svelte:fragment>

  <div class="-mx-6 divide-y">
    {#each feed as item (item.id)}
      <div class="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-2 w-2 shrink-0 rounded-full {item.impact === 'positive' ? 'bg-green-500' : item.impact === 'detrimental' ? 'bg-red-500' : 'bg-gray-400'}"></div>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">
              {item.eventType || item.source}
              <span class="font-normal text-muted-foreground"> → {item.framework} {item.controlId}</span>
            </div>
            <div class="text-xs text-muted-foreground">{item.actor || "system"} · {item.source}</div>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Badge variant={item.impact === "positive" ? "success" : item.impact === "detrimental" ? "destructive" : "secondary"}>
            {item.impact}
          </Badge>
          <span class="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
    {/each}
  </div>
</WidgetContainer>
