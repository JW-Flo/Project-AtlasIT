<script lang="ts">
  import { onMount } from "svelte";
  import { PageHeader, Card, Badge, EmptyState, Button, ErrorBoundary } from "$lib/components/ui";
  import { relativeTime } from "$lib/utils/time";
  import { safeFetch } from "$lib/utils/error-handling";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    AlertCircle,
    ArrowRight,
    Database,
    RefreshCw,
    ShieldCheck,
  } from "lucide-svelte";

  interface FrameworkSummary {
    framework: string;
    controlsTotal: number;
    controlsPassing: number;
    evidenceCount: number;
    score: number;
  }

  interface SummaryData {
    frameworks: FrameworkSummary[];
    totalEvidence: number;
    lastUpdated: string;
    hasSyntheticEvidence?: boolean;
  }

  interface EvidenceItem {
    id: string;
    framework: string;
    controlId: string;
    controlName: string;
    source: string;
    createdAt: string;
  }

  let summaryLoading = true;
  let summaryError: string | null = null;
  let summary: SummaryData | null = null;

  let evidenceLoading = true;
  let evidenceError: string | null = null;
  let evidenceItems: EvidenceItem[] = [];
  let evidenceNextCursor: string | null = null;
  let evidenceLoadingMore = false;

  function scoreColorClass(score: number): string {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  }
  function scoreBgClass(score: number): string {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  }
  function frameworkBadge(key: string | null): "info" | "default" | "success" | "warning" | "destructive" | "muted" {
    if (!key) return "muted";
    const map: Record<string, "info" | "default" | "success" | "warning" | "destructive"> = {
      SOC2: "info",
      ISO27001: "default",
      NIST_CSF: "success",
      HIPAA: "warning",
      GDPR: "destructive",
    };
    return map[key] ?? "muted";
  }

  async function loadSummary() {
    summaryLoading = true;
    summaryError = null;
    try {
      const res = await safeFetch("/api/compliance/api/v1/compliance/summary", {
        context: "load compliance summary",
        retry: true,
      });

      if (res.ok) {
        const result = res.data as any;
        if (result.data) {
          const d = result.data;
          const rawFw: Record<string, unknown>[] = d.frameworks ?? [];
          summary = {
            frameworks: rawFw.map((f) => ({
              framework: String(f.framework ?? ""),
              controlsTotal: Number(f.controlsTotal ?? f.controls_total ?? 0),
              controlsPassing: Number(f.controlsPassing ?? f.controls_passing ?? 0),
              evidenceCount: Number(f.evidenceCount ?? f.evidence_count ?? 0),
              score: Number(f.score ?? 0),
            })),
            totalEvidence: Number(d.totalEvidence ?? d.total_evidence ?? 0),
            lastUpdated: String(d.lastUpdated ?? d.last_updated ?? ""),
            hasSyntheticEvidence: Boolean(d.hasSyntheticEvidence ?? d.has_synthetic_evidence ?? false),
          };
        } else {
          summaryError = "No summary data returned";
        }
      } else {
        summaryError = res.error.actionable;
        pushToast({
          variant: "error",
          title: "Failed to load compliance summary",
          message: res.error.actionable,
        });
      }
    } catch (e) {
      summaryError = "Failed to load compliance summary. Please try again.";
      pushToast({
        variant: "error",
        title: "Load failed",
        message: "Unable to load compliance data. Check your connection and try again.",
      });
    } finally {
      summaryLoading = false;
    }
  }

  async function loadEvidence(cursor?: string) {
    if (!cursor) {
      evidenceLoading = true;
      evidenceError = null;
    } else {
      evidenceLoadingMore = true;
    }
    try {
      const url = cursor
        ? `/api/compliance/api/v1/evidence?limit=25&cursor=${encodeURIComponent(cursor)}`
        : "/api/compliance/api/v1/evidence?limit=25";

      const res = await safeFetch(url, {
        context: "load evidence",
        retry: true,
      });

      if (res.ok) {
        const result = res.data as any;
        if (result.data) {
          const raw: Record<string, unknown>[] = result.data.items ?? [];
          const mapped: EvidenceItem[] = raw.map((r) => ({
            id: String(r.id ?? ""),
            framework: String(r.framework ?? ""),
            controlId: String(r.controlId ?? r.control_id ?? ""),
            controlName: String(r.controlName ?? r.control_name ?? ""),
            source: String(r.source ?? ""),
            createdAt: String(r.createdAt ?? r.created_at ?? ""),
          }));
          if (cursor) {
            evidenceItems = [...evidenceItems, ...mapped];
          } else {
          evidenceItems = mapped;
        }
        evidenceNextCursor = result.data.nextCursor ?? result.data.next_cursor ?? null;
      } else {
        evidenceError = "No evidence data returned";
      }
      } else {
        evidenceError = res.error.actionable;
        if (!cursor) {
          pushToast({
            variant: "error",
            title: "Failed to load evidence",
            message: res.error.actionable,
          });
        }
      }
    } catch (e) {
      evidenceError = "Failed to load evidence. Please try again.";
      pushToast({
        variant: "error",
        title: "Load failed",
        message: "Unable to load evidence. Check your connection and try again.",
      });
    } finally {
      evidenceLoading = false;
      evidenceLoadingMore = false;
    }
  }

  function refresh() {
    loadSummary();
    loadEvidence();
  }

  onMount(() => {
    loadSummary();
    loadEvidence();
  });
</script>

<script context="module" lang="ts">
  // Avoid duplicate import — these load at runtime via the inline script
</script>

<svelte:head>
  <title>Compliance · AtlasIT</title>
</svelte:head>

<ErrorBoundary onRetry={refresh}>
<div class="animate-fade-in">
  <PageHeader title="Compliance" description="Live framework scoring grounded in operational evidence">
    <svelte:fragment slot="actions">
      {#if summary}
        <Badge variant="muted" size="md">
          <Database class="h-3 w-3" strokeWidth={2.25} />
          <span class="tabular-nums">{summary.totalEvidence.toLocaleString()}</span> evidence records
        </Badge>
      {/if}
      <Button variant="outline" size="sm" on:click={refresh}>
        <RefreshCw class="h-3.5 w-3.5" strokeWidth={2.25} />
        Refresh
      </Button>
    </svelte:fragment>
  </PageHeader>

  <!-- Synthetic Evidence Banner (F-28 quick-start) -->
  {#if summary?.hasSyntheticEvidence}
    <Card padding="md" class="mb-6 bg-info-muted border-info/20">
      <div class="flex items-start gap-3">
        <ShieldCheck class="h-5 w-5 text-info shrink-0 mt-0.5" strokeWidth={2} />
        <div class="flex-1">
          <p class="font-medium text-info">Estimated Compliance Score</p>
          <p class="text-sm text-muted-foreground mt-1">
            Your current score is based on industry benchmarks and estimated evidence.
            Connect adapters to see your actual compliance posture with real-time data.
          </p>
          <a href="/console/marketplace" class="text-sm font-medium text-info underline underline-offset-2 mt-2 inline-flex items-center gap-1.5 hover:text-info/80 transition-colors">
            Connect Adapters
            <ArrowRight class="h-3.5 w-3.5" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </Card>
  {/if}

  <!-- Framework cards -->
  {#if summaryLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {#each Array(5) as _}
        <div class="h-36 skeleton rounded-xl"></div>
      {/each}
    </div>
  {:else if summaryError}
    <Card padding="md" class="mb-8 bg-destructive-muted border-destructive/20">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
        <div class="flex-1">
          <p class="text-sm text-destructive font-medium">{summaryError}</p>
          <Button variant="destructive" size="sm" class="mt-3" on:click={loadSummary}>Retry</Button>
        </div>
      </div>
    </Card>
  {:else if summary && summary.frameworks.length === 0}
    <Card padding="lg" class="mb-8">
      <EmptyState
        title="No framework data yet"
        description="Install a compliance pack and connect an integration — scores appear as evidence flows in."
        icon={ShieldCheck}
      >
        <svelte:fragment slot="action">
          <Button variant="primary" size="sm" href="/console/compliance/packs">
            Browse packs
            <ArrowRight class="h-3 w-3" strokeWidth={2.25} />
          </Button>
        </svelte:fragment>
      </EmptyState>
    </Card>
  {:else if summary}
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {#each summary.frameworks as fw}
        {@const passPct = fw.controlsTotal > 0 ? Math.round((fw.controlsPassing * 100) / fw.controlsTotal) : 0}
        <Card padding="md" class="relative overflow-hidden group hover:shadow-sm hover:border-border-strong transition-all duration-fast">
          <div class="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/3 blur-2xl pointer-events-none"></div>
          <div class="relative">
            <div class="flex items-start justify-between mb-3">
              <Badge variant={frameworkBadge(fw.framework)} size="md">
                {fw.framework.replace("_", " ")}
              </Badge>
              <span class={"h-2 w-2 rounded-full mt-1.5 " + scoreBgClass(fw.score)}></span>
            </div>
            <div class="flex items-baseline gap-2 mb-3">
              <div class={"text-5xl font-semibold tabular-nums tracking-tight " + scoreColorClass(fw.score)}>
                {fw.score}<span class="text-xl text-muted-foreground/40">%</span>
              </div>
            </div>
            <div class="text-sm text-foreground tabular-nums">
              <span class="font-medium">{fw.controlsPassing}</span>
              <span class="text-muted-foreground"> of {fw.controlsTotal} controls passing</span>
            </div>
            <div class="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div class={"h-full transition-all duration-700 ease-out-quart rounded-full " + scoreBgClass(passPct)} style="width: {passPct}%"></div>
            </div>
            <div class="mt-2 text-2xs text-muted-foreground tabular-nums">
              {fw.evidenceCount.toLocaleString()} evidence records
            </div>
          </div>
        </Card>
      {/each}
    </section>
  {/if}

  <!-- Evidence stream -->
  <Card padding="none" class="overflow-hidden">
    <div class="px-5 py-3 border-b border-border flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-foreground">Recent Evidence</h2>
        <p class="text-2xs text-muted-foreground">Continuous stream of operational records scored against controls</p>
      </div>
    </div>

    {#if evidenceLoading}
      <div class="divide-y divide-border">
        {#each Array(6) as _}
          <div class="px-5 py-3 flex gap-4 items-center">
            <div class="h-4 skeleton w-20"></div>
            <div class="h-4 skeleton w-32"></div>
            <div class="h-4 skeleton w-24"></div>
            <div class="h-4 skeleton w-16 ml-auto"></div>
          </div>
        {/each}
      </div>
    {:else if evidenceError}
      <div class="p-5">
        <div class="flex items-start gap-3 p-3 bg-destructive-muted border border-destructive/20 rounded-lg">
          <AlertCircle class="h-4 w-4 text-destructive shrink-0 mt-0.5" strokeWidth={2.25} />
          <div class="flex-1">
            <p class="text-sm text-destructive">{evidenceError}</p>
            <Button variant="destructive" size="sm" class="mt-2" on:click={() => loadEvidence()}>Retry</Button>
          </div>
        </div>
      </div>
    {:else if evidenceItems.length === 0}
      <EmptyState
        title="No evidence records yet"
        description="Connect an integration and the compliance engine will start scoring its events."
        icon={Database}
      />
    {:else}
      <div class="overflow-x-auto mobile-table-wrapper">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-muted/40 border-b border-border">
              <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Framework</th>
              <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Control</th>
              <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
              <th class="px-5 py-2.5 text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Collected</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each evidenceItems as item (item.id)}
              <tr class="row-hover">
                <td class="px-5 py-2.5 whitespace-nowrap">
                  <Badge variant={frameworkBadge(item.framework)} size="sm">
                    {(item.framework ?? "—").replace("_", " ")}
                  </Badge>
                </td>
                <td class="px-5 py-2.5 max-w-md">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="font-mono text-xs font-medium text-foreground tabular-nums shrink-0">{item.controlId}</span>
                    {#if item.controlName}
                      <span class="text-xs text-muted-foreground truncate">{item.controlName}</span>
                    {/if}
                  </div>
                </td>
                <td class="px-5 py-2.5 whitespace-nowrap text-xs text-muted-foreground capitalize">
                  {item.source ?? "—"}
                </td>
                <td class="px-5 py-2.5 whitespace-nowrap text-right text-2xs text-muted-foreground tabular-nums">
                  {relativeTime(item.createdAt)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if evidenceNextCursor}
        <div class="px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" on:click={() => loadEvidence(evidenceNextCursor ?? undefined)} loading={evidenceLoadingMore}>
            {evidenceLoadingMore ? "Loading…" : "Show more"}
          </Button>
        </div>
      {/if}
    {/if}
  </Card>
</div>
</ErrorBoundary>
