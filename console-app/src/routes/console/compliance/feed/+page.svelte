<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle } from "lucide-svelte";

  type Impact = "positive" | "detrimental" | "neutral";

  interface EvidenceFeedItem {
    id: string;
    framework: string;
    controlId: string;
    controlName: string;
    category: string;
    source: string;
    actor: string;
    subject: string;
    impact: Impact;
    confidence: number;
    reasoning: string;
    eventType: string;
    contentHash: string;
    createdAt: string;
  }

  interface FeedSummary {
    totalEvidence: number;
    frameworksCovered: number;
    controlsCovered: number;
    positiveCount: number;
    detrimentalCount: number;
  }

  let loading = true;
  let error: string | null = null;

  let feed: EvidenceFeedItem[] = [];
  let summary: FeedSummary = {
    totalEvidence: 0,
    frameworksCovered: 0,
    controlsCovered: 0,
    positiveCount: 0,
    detrimentalCount: 0,
  };

  let FRAMEWORKS: string[] = [];
  const CATEGORIES = [
    "access_grant", "access_revoke", "onboarding", "offboarding",
    "policy_change", "config_change", "adapter_pull", "incident",
    "review_complete", "mfa_enforcement", "sso_enforcement",
  ];

  let framework = "";
  let controlId = "";
  let category = "";
  let impact: "all" | Impact = "all";
  let since = "";

  let limit = 25;
  let offset = 0;
  let total = 0;
  let expandedId: string | null = null;

  $: pageStart = total === 0 ? 0 : offset + 1;
  $: pageEnd = Math.min(offset + limit, total);
  $: canPrev = offset > 0;
  $: canNext = offset + limit < total;

  function impactVariant(value: Impact): "success" | "destructive" | "secondary" {
    if (value === "positive") return "success";
    if (value === "detrimental") return "destructive";
    return "secondary";
  }

  function confidencePct(value: number): string {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${Math.round(value * 100)}%`;
  }

  function shortHash(hash: string): string {
    if (!hash) return "--";
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }

  async function copyHash(hash: string) {
    try {
      await navigator.clipboard.writeText(hash);
    } catch {
      // clipboard access not available
    }
  }

  function buildQuery(): string {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    if (framework.trim()) params.set("framework", framework.trim());
    if (controlId.trim()) params.set("controlId", controlId.trim());
    if (category.trim()) params.set("category", category.trim());
    if (impact !== "all") params.set("impact", impact);
    if (since.trim()) params.set("since", since.trim());

    return params.toString();
  }

  async function loadFeed() {
    loading = true;
    error = null;

    try {
      const res = await fetch(`/api/evidence-feed?${buildQuery()}`);
      if (!res.ok) throw new Error(`Failed to load evidence feed (${res.status})`);

      const data = await res.json();
      feed = Array.isArray(data?.feed) ? data.feed : [];
      total = Number(data?.meta?.total ?? 0);
      limit = Number(data?.meta?.limit ?? limit);
      offset = Number(data?.meta?.offset ?? offset);
      summary = {
        totalEvidence: Number(data?.summary?.totalEvidence ?? 0),
        frameworksCovered: Number(data?.summary?.frameworksCovered ?? 0),
        controlsCovered: Number(data?.summary?.controlsCovered ?? 0),
        positiveCount: Number(data?.summary?.positiveCount ?? 0),
        detrimentalCount: Number(data?.summary?.detrimentalCount ?? 0),
      };
    } catch (e: any) {
      error = e?.message || "Failed to load evidence feed";
      feed = [];
      total = 0;
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    offset = 0;
    loadFeed();
  }

  function clearFilters() {
    framework = "";
    controlId = "";
    category = "";
    impact = "all";
    since = "";
    offset = 0;
    loadFeed();
  }

  function prevPage() {
    if (!canPrev) return;
    offset = Math.max(0, offset - limit);
    loadFeed();
  }

  function nextPage() {
    if (!canNext) return;
    offset += limit;
    loadFeed();
  }

  async function loadFrameworks() {
    try {
      const res = await fetch("/api/tenant-compliance/controls");
      if (res.ok) {
        const data = await res.json();
        FRAMEWORKS = data.frameworks || [];
      }
    } catch {
      // fall back to empty — filter dropdown will just be "All Frameworks"
    }
  }

  onMount(async () => {
    await Promise.all([loadFrameworks(), loadFeed()]);
  });
</script>

<div class="space-y-6">
  <div>
    <a href="/console/compliance" class="text-sm text-primary hover:underline">← Back to Compliance</a>
    <h1 class="text-2xl font-semibold tracking-tight">Evidence Activity Feed</h1>
    <p class="text-sm text-muted-foreground">Lifecycle operations mapped to compliance controls with evidence impact.</p>
  </div>

  <!-- Summary hero -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Total Evidence</div><div class="text-2xl font-bold mt-1">{summary.totalEvidence}</div></CardContent></Card>
    <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Frameworks Covered</div><div class="text-2xl font-bold mt-1">{summary.frameworksCovered}</div></CardContent></Card>
    <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Controls Covered</div><div class="text-2xl font-bold mt-1">{summary.controlsCovered}</div></CardContent></Card>
    <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Positive Events</div><div class="text-2xl font-bold mt-1 text-success">{summary.positiveCount}</div></CardContent></Card>
    <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Detrimental Events</div><div class="text-2xl font-bold mt-1 text-destructive">{summary.detrimentalCount}</div></CardContent></Card>
  </div>

  <!-- Filters -->
  <Card>
    <CardContent class="pt-5">
      <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div class="space-y-1.5">
          <Label>Framework</Label>
          <select bind:value={framework} class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full">
            <option value="">All Frameworks</option>
            {#each FRAMEWORKS as fw}
              <option value={fw}>{fw}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1.5">
          <Label>Control ID</Label>
          <Input bind:value={controlId} placeholder="e.g. CC6.1" />
        </div>
        <div class="space-y-1.5">
          <Label>Category</Label>
          <select bind:value={category} class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full">
            <option value="">All Categories</option>
            {#each CATEGORIES as cat}
              <option value={cat}>{cat.replace(/_/g, " ")}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-1.5">
          <Label>Impact</Label>
          <select bind:value={impact} class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full">
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="detrimental">Detrimental</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <Label>Since</Label>
          <input type="date" bind:value={since} class="h-10 rounded-md border border-input bg-background px-3 text-sm w-full" />
        </div>
        <div class="flex items-end gap-2">
          <Button on:click={applyFilters}>Apply</Button>
          <Button variant="outline" on:click={clearFilters}>Reset</Button>
        </div>
      </div>
    </CardContent>
  </Card>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-16 rounded-lg" />
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else if feed.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">No evidence activity matches your filters.</CardContent>
    </Card>
  {:else}
    <div class="space-y-3">
      {#each feed as item}
        <Card class="cursor-pointer" on:click={() => expandedId = expandedId === item.id ? null : item.id}>
          <CardContent class="pt-4">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{item.framework}</Badge>
                  <Badge variant="secondary">{item.controlId}</Badge>
                  <Badge variant={impactVariant(item.impact)}>{item.impact}</Badge>
                  <span class="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div class="text-sm font-medium">{item.controlName}</div>
                <div class="text-sm text-muted-foreground">{item.reasoning}</div>
                <div class="text-xs text-muted-foreground">
                  {item.eventType} • {item.category} • source: {item.source} • actor: {item.actor || "system"} • subject: {item.subject || "--"}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs text-muted-foreground">Confidence</div>
                <div class="text-sm font-semibold">{confidencePct(item.confidence)}</div>
                <div class="text-[11px] text-muted-foreground mt-1" title={item.contentHash}>hash: {shortHash(item.contentHash)}</div>
              </div>
            </div>
            {#if expandedId === item.id}
              <div class="mt-3 pt-3 border-t space-y-2" on:click|stopPropagation>
                <div>
                  <div class="text-xs font-semibold text-muted-foreground mb-1">Full Hash</div>
                  <div class="flex items-center gap-2">
                    <code class="text-[11px] bg-muted px-2 py-1 rounded break-all">{item.contentHash || "--"}</code>
                    {#if item.contentHash}
                      <Button size="sm" variant="outline" on:click={() => copyHash(item.contentHash)}>Copy</Button>
                    {/if}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-muted-foreground mb-1">Metadata</div>
                  <pre class="text-[11px] bg-muted px-2 py-1.5 rounded overflow-x-auto whitespace-pre-wrap">{JSON.stringify({ id: item.id, framework: item.framework, controlId: item.controlId, controlName: item.controlName, category: item.category, source: item.source, actor: item.actor, subject: item.subject, impact: item.impact, confidence: item.confidence, eventType: item.eventType, createdAt: item.createdAt }, null, 2)}</pre>
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>
      {/each}
    </div>

    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <div>Showing {pageStart}–{pageEnd} of {total}</div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="outline" on:click={prevPage} disabled={!canPrev}>Previous</Button>
        <Button size="sm" variant="outline" on:click={nextPage} disabled={!canNext}>Next</Button>
      </div>
    </div>
  {/if}
</div>
