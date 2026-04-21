<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "$lib/utils";
  import {
    PageHeader,
    StatCard,
    Card,
    Badge,
    EmptyState,
    Button,
    ErrorBoundary,
  } from "$lib/components/ui";
  import { relativeTime } from "$lib/utils/time";
  import { safeFetch, type ClassifiedError } from "$lib/utils/error-handling";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    Activity,
    AlertTriangle,
    AppWindow,
    ArrowUpRight,
    ArrowRight,
    ChevronRight,
    Database,
    FileCheck,
    Gauge,
    KeyRound,
    Plug,
    ShieldCheck,
    TrendingUp,
    TrendingDown,
    Users,
    Workflow,
    Zap,
    X,
  } from "lucide-svelte";
  import Checklist from "$lib/components/ui/checklist.svelte";

  interface DashboardData {
    tenant: { id: string; name: string; slug: string; tier: string; status: string } | null;
    user: { id: string; email: string; role: string };
    stats: {
      evidenceCount: number;
      automationRulesTotal: number;
      automationRulesEnabled: number;
      openIncidents: number;
    };
    recentEvents: Array<{ id: string; type: string; source: string; status: string; created_at: string }>;
  }

  interface Pack {
    id: string;
    label: string;
    framework: string;
    controlCount: number;
    installedAt: string | null;
    lastEvaluatedAt: string | null;
    passCount: number | null;
    failCount: number | null;
    unknownCount: number | null;
  }

  interface EvidenceItem {
    id: string;
    framework: string | null;
    controlId: string | null;
    source: string | null;
    actor: string | null;
    metadata: { impact?: string; eventType?: string; reasoning?: string } | null;
    createdAt: string;
  }

  interface Integration {
    id: string;
    provider: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  interface TrendPoint {
    day: string;
    avgScore: number;
    snapshotCount: number;
  }

  let dashboard: DashboardData | null = null;
  let packs: Pack[] = [];
  let evidence: EvidenceItem[] = [];
  let integrations: Integration[] = [];
  let trend: TrendPoint[] = [];
  let loading = true;
  let error: string | null = null;

  // Per-widget loading states
  let loadingDashboard = true;
  let loadingPacks = true;
  let loadingEvidence = true;
  let loadingIntegrations = true;
  let loadingTrend = true;

  // Per-widget error states
  let errorDashboard: string | null = null;
  let errorPacks: string | null = null;
  let errorEvidence: string | null = null;
  let errorIntegrations: string | null = null;
  let errorTrend: string | null = null;

  const sparklineWidth = 220;
  const sparklineHeight = 56;
  $: sparklinePath = (() => {
    if (trend.length < 2) return "";
    const scores = trend.map((t) => t.avgScore);
    const min = Math.max(0, Math.min(...scores) - 5);
    const max = Math.min(100, Math.max(...scores) + 5);
    const range = max - min || 1;
    const step = sparklineWidth / (trend.length - 1);
    return trend
      .map((t, i) => {
        const x = (i * step).toFixed(1);
        const y = (sparklineHeight - ((t.avgScore - min) / range) * sparklineHeight).toFixed(1);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  })();
  $: sparklineAreaPath = sparklinePath
    ? `${sparklinePath} L${sparklineWidth},${sparklineHeight} L0,${sparklineHeight} Z`
    : "";
  $: trendDelta = (() => {
    if (trend.length < 2) return null;
    const first = trend[0].avgScore;
    const last = trend[trend.length - 1].avgScore;
    return { diff: last - first, first, last, days: trend.length };
  })();

  $: installedPacks = packs.filter((p) => p.installedAt);
  $: totalControls = installedPacks.reduce((s, p) => s + (p.controlCount ?? 0), 0);
  $: totalPass = installedPacks.reduce((s, p) => s + (p.passCount ?? 0), 0);
  $: totalFail = installedPacks.reduce((s, p) => s + (p.failCount ?? 0), 0);
  $: totalUnknown = installedPacks.reduce((s, p) => s + (p.unknownCount ?? 0), 0);
  $: overallScore = totalControls > 0 ? Math.round((totalPass * 100) / totalControls) : 0;
  $: lastEvaluated = installedPacks
    .map((p) => p.lastEvaluatedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] as string | undefined;
  $: activeIntegrations = integrations.filter((i) => i.status === "active").length;

  // Getting Started checklist
  let checklistDismissed = false;
  $: checklistItems = [
    {
      id: "connect-adapter",
      label: "Connect your first application",
      completed: activeIntegrations > 0,
      href: "/console/apps",
    },
    {
      id: "install-pack",
      label: "Install a compliance pack",
      completed: installedPacks.length > 0,
      href: "/console/compliance/packs",
    },
    {
      id: "configure-automation",
      label: "Set up automation rules",
      completed: (dashboard?.stats?.automationRulesTotal ?? 0) > 0,
      href: "/console/automation",
    },
    {
      id: "review-evidence",
      label: "Review collected evidence",
      completed: (dashboard?.stats?.evidenceCount ?? 0) > 0,
      href: "/console/compliance/evidence",
    },
  ];
  $: allCompleted = checklistItems.every((item) => item.completed);
  $: showChecklist = !allCompleted && !checklistDismissed && !loading;

  function dismissChecklist() {
    checklistDismissed = true;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("atlasit_checklist_dismissed", "true");
    }
  }

  const quickActions = [
    { href: "/console/compliance/controls", label: "Controls", hint: "All state across packs", icon: ShieldCheck },
    { href: "/console/policies", label: "Policies", hint: "Create + acknowledge", icon: FileCheck },
    { href: "/console/directory", label: "Directory", hint: "Users + groups", icon: Users },
    { href: "/console/incidents", label: "Incidents", hint: "Investigate + resolve", icon: Activity },
  ];

  async function loadDashboard() {
    loadingDashboard = true;
    errorDashboard = null;
    try {
      const res = await safeFetch("/api/v1/dashboard", { retry: true, context: "load dashboard" });
      if (res.ok) {
        dashboard = (res.data as any).data ?? null;
      } else {
        errorDashboard = res.error.actionable;
        if (res.error.type !== "auth") {
          pushToast({
            variant: "error",
            title: "Dashboard load failed",
            message: res.error.actionable,
          });
        }
      }
    } catch (e) {
      errorDashboard = "Failed to load dashboard data.";
    } finally {
      loadingDashboard = false;
    }
  }

  async function loadPacks() {
    loadingPacks = true;
    errorPacks = null;
    try {
      const res = await safeFetch("/api/compliance/api/v1/compliance-packs", { retry: true, context: "load compliance packs" });
      if (res.ok) {
        packs = (res.data as any).data?.items ?? [];
      } else {
        errorPacks = res.error.actionable;
        if (res.error.type !== "auth") {
          pushToast({
            variant: "warning",
            title: "Compliance packs unavailable",
            message: res.error.actionable,
          });
        }
      }
    } catch (e) {
      errorPacks = "Failed to load compliance packs.";
    } finally {
      loadingPacks = false;
    }
  }

  async function loadEvidence() {
    loadingEvidence = true;
    errorEvidence = null;
    try {
      const res = await safeFetch("/api/compliance/api/v1/evidence?limit=10", { retry: true, context: "load evidence" });
      if (res.ok) {
        evidence = (res.data as any).data?.items ?? [];
      } else {
        errorEvidence = res.error.actionable;
      }
    } catch (e) {
      errorEvidence = "Failed to load evidence.";
    } finally {
      loadingEvidence = false;
    }
  }

  async function loadIntegrations() {
    loadingIntegrations = true;
    errorIntegrations = null;
    try {
      const res = await safeFetch("/api/v1/apps/integrations", { retry: true, context: "load integrations" });
      if (res.ok) {
        integrations = (res.data as any).data?.items ?? [];
      } else {
        errorIntegrations = res.error.actionable;
      }
    } catch (e) {
      errorIntegrations = "Failed to load integrations.";
    } finally {
      loadingIntegrations = false;
    }
  }

  async function loadTrend() {
    loadingTrend = true;
    errorTrend = null;
    try {
      const res = await safeFetch("/api/compliance/api/v1/compliance-packs/history/aggregate?days=30", { retry: true, context: "load trend data" });
      if (res.ok) {
        trend = (res.data as any).data?.series ?? [];
      } else {
        errorTrend = res.error.actionable;
      }
    } catch (e) {
      errorTrend = "Failed to load trend data.";
    } finally {
      loadingTrend = false;
    }
  }

  async function loadAll() {
    // Load all widgets in parallel - each tracks its own state
    await Promise.all([
      loadDashboard(),
      loadPacks(),
      loadEvidence(),
      loadIntegrations(),
      loadTrend(),
    ]);

    // Global loading complete (for backward compatibility)
    loading = false;
  }

  onMount(() => {
    if (typeof localStorage !== "undefined") {
      checklistDismissed = localStorage.getItem("atlasit_checklist_dismissed") === "true";
    }
    loadAll();
  });

  function scoreColorClass(score: number): string {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  }
  function scoreBgClass(score: number): string {
    if (score >= 80) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  }
  function frameworkBadge(key: string) {
    const map: Record<string, "info" | "default" | "success" | "warning" | "destructive"> = {
      SOC2: "info",
      ISO27001: "default",
      NIST_CSF: "success",
      HIPAA: "warning",
      GDPR: "destructive",
    };
    return map[key] ?? "muted";
  }
  function impactBadge(impact?: string): "success" | "destructive" | "muted" {
    if (impact === "positive") return "success";
    if (impact === "negative") return "destructive";
    return "muted";
  }
</script>

<svelte:head>
  <title>Dashboard · AtlasIT</title>
</svelte:head>

<ErrorBoundary onRetry={loadAll}>
<div class="animate-fade-in">
  <PageHeader
    title="Dashboard"
    description={dashboard?.tenant?.name ?? "Loading workspace…"}
  >
    <svelte:fragment slot="actions">
      {#if installedPacks.length > 0}
        <Button variant="outline" size="sm" href="/console/compliance">
          <Gauge class="h-3.5 w-3.5" strokeWidth={2.25} />
          View compliance
        </Button>
      {/if}
      <Button variant="primary" size="sm" href="/console/apps">
        <Plug class="h-3.5 w-3.5" strokeWidth={2.25} />
        Connect app
      </Button>
    </svelte:fragment>
  </PageHeader>

  {#if loading}
    <div class="space-y-4">
      <div class="h-44 skeleton rounded-2xl"></div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {#each Array(4) as _}
          <div class="h-28 skeleton rounded-xl"></div>
        {/each}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="h-64 skeleton rounded-xl"></div>
        <div class="lg:col-span-2 h-64 skeleton rounded-xl"></div>
      </div>
    </div>
  {:else if error}
    <Card padding="lg" class="bg-destructive-muted border-destructive/20">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
        <div class="flex-1">
          <p class="text-sm text-destructive font-medium">{error}</p>
          <Button variant="destructive" size="sm" class="mt-3" on:click={loadAll}>Retry</Button>
        </div>
      </div>
    </Card>
  {:else}
    <!-- Getting Started checklist -->
    {#if showChecklist}
      <Card padding="lg" class="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 relative">
        <button
          on:click={dismissChecklist}
          class="absolute top-4 right-4 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X class="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
        <div class="mb-3">
          <h2 class="text-lg font-semibold text-foreground">Getting Started</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Complete these steps to get the most out of AtlasIT
          </p>
        </div>
        <Checklist items={checklistItems} />
      </Card>
    {/if}

    <!-- Hero compliance score card -->
    {#if loadingPacks || loadingTrend}
      <Card padding="lg" variant="elevated" class="mb-6 relative overflow-hidden" data-tour="hero-score">
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="h-3 w-32 skeleton rounded"></div>
            <div class="h-16 w-40 skeleton rounded"></div>
          </div>
          <div class="flex gap-3">
            <div class="h-4 w-20 skeleton rounded"></div>
            <div class="h-4 w-20 skeleton rounded"></div>
            <div class="h-4 w-20 skeleton rounded"></div>
          </div>
          <div class="h-2 w-full skeleton rounded-full"></div>
        </div>
      </Card>
    {:else if installedPacks.length > 0}
      <Card padding="lg" variant="elevated" class="mb-6 relative overflow-hidden" data-tour="hero-score">
        <div class="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>

        <div class="relative grid lg:grid-cols-[1fr,auto,auto] gap-6 items-end">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <ShieldCheck class="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              <span class="text-2xs uppercase tracking-wider font-semibold text-muted-foreground">Overall Compliance Score</span>
            </div>
            <div class="flex items-baseline gap-3 flex-wrap">
              <div class={cn("text-6xl font-semibold tabular-nums tracking-tight", scoreColorClass(overallScore))}>
                {overallScore}<span class="text-2xl text-muted-foreground/40">%</span>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2.5 flex-wrap text-xs">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                <span class="text-foreground tabular-nums font-medium">{totalPass}</span>
                <span class="text-muted-foreground">passing</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                <span class="text-foreground tabular-nums font-medium">{totalFail}</span>
                <span class="text-muted-foreground">failing</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                <span class="text-foreground tabular-nums font-medium">{totalUnknown}</span>
                <span class="text-muted-foreground">unknown</span>
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="text-muted-foreground tabular-nums">of {totalControls}</span>
            </div>
            <p class="mt-2 text-2xs text-muted-foreground">
              Last evaluated {relativeTime(lastEvaluated)}
            </p>
          </div>

          {#if sparklinePath && trendDelta}
            <div class="flex flex-col items-end gap-1.5">
              <div class="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span>Last {trendDelta.days} days</span>
                {#if Math.abs(trendDelta.diff) >= 0.1}
                  <span
                    class={cn(
                      "inline-flex items-center gap-0.5 font-semibold tabular-nums",
                      trendDelta.diff > 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {#if trendDelta.diff > 0}
                      <TrendingUp class="h-3 w-3" strokeWidth={2.5} />
                    {:else}
                      <TrendingDown class="h-3 w-3" strokeWidth={2.5} />
                    {/if}
                    {Math.abs(trendDelta.diff).toFixed(1)} pts
                  </span>
                {/if}
              </div>
              <svg
                width={sparklineWidth}
                height={sparklineHeight}
                viewBox="0 0 {sparklineWidth} {sparklineHeight}"
                class={cn("overflow-visible", scoreColorClass(overallScore))}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="trendFillDash" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path d={sparklineAreaPath} fill="url(#trendFillDash)" />
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          {/if}
        </div>

        <div class="mt-6 h-2 bg-muted rounded-full overflow-hidden">
          <div
            class={cn("h-full transition-all duration-700 ease-out-quart rounded-full", scoreBgClass(overallScore))}
            style="width: {overallScore}%"
          ></div>
        </div>
      </Card>
    {:else}
      <Card padding="lg" class="mb-6 bg-primary-muted border-primary/20">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck class="h-5 w-5" strokeWidth={2} />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-foreground">No compliance packs installed yet</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              Install a framework pack (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR) to start scoring evidence against controls.
            </p>
            <Button variant="primary" size="sm" href="/console/compliance/packs" class="mt-3">
              Browse packs
              <ArrowRight class="h-3 w-3" strokeWidth={2.25} />
            </Button>
          </div>
        </div>
      </Card>
    {/if}

    <!-- Stats row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {#if loadingDashboard}
        <Card padding="md">
          <div class="space-y-2">
            <div class="h-3 w-24 skeleton rounded"></div>
            <div class="h-8 w-16 skeleton rounded"></div>
            <div class="h-3 w-32 skeleton rounded"></div>
          </div>
        </Card>
        <Card padding="md">
          <div class="space-y-2">
            <div class="h-3 w-24 skeleton rounded"></div>
            <div class="h-8 w-20 skeleton rounded"></div>
            <div class="h-3 w-28 skeleton rounded"></div>
          </div>
        </Card>
        <Card padding="md">
          <div class="space-y-2">
            <div class="h-3 w-20 skeleton rounded"></div>
            <div class="h-8 w-12 skeleton rounded"></div>
            <div class="h-3 w-32 skeleton rounded"></div>
          </div>
        </Card>
      {:else}
        <StatCard
          label="Evidence collected"
          value={dashboard?.stats?.evidenceCount?.toLocaleString() ?? "0"}
          hint="Operational records"
          icon={Database}
        />
        <StatCard
          label="Active automations"
          value="{dashboard?.stats?.automationRulesEnabled ?? 0} / {dashboard?.stats?.automationRulesTotal ?? 0}"
          hint="Rules enabled / total"
          icon={Zap}
        />
        <StatCard
          label="Open incidents"
          value={dashboard?.stats?.openIncidents ?? 0}
          hint="Awaiting resolution"
          icon={AlertTriangle}
          intent={(dashboard?.stats?.openIncidents ?? 0) > 0 ? "warning" : "default"}
        />
      {/if}
      {#if loadingIntegrations}
        <Card padding="md">
          <div class="space-y-2">
            <div class="h-3 w-24 skeleton rounded"></div>
            <div class="h-8 w-16 skeleton rounded"></div>
            <div class="h-3 w-32 skeleton rounded"></div>
          </div>
        </Card>
      {:else}
        <StatCard
          label="Connected apps"
          value="{activeIntegrations} / {integrations.length}"
          hint="Active live-data sources"
          icon={Plug}
        />
      {/if}
    </div>

    <!-- Per-pack scores -->
    {#if loadingPacks}
      <section class="mb-6">
        <div class="flex items-baseline justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</h2>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {#each Array(4) as _}
            <Card padding="md">
              <div class="space-y-3">
                <div class="h-5 w-20 skeleton rounded"></div>
                <div class="h-3 w-32 skeleton rounded"></div>
                <div class="h-8 w-16 skeleton rounded"></div>
                <div class="h-1 w-full skeleton rounded-full"></div>
              </div>
            </Card>
          {/each}
        </div>
      </section>
    {:else if installedPacks.length > 0}
      <section class="mb-6">
        <div class="flex items-baseline justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</h2>
          <a
            href="/console/compliance/packs"
            class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            Manage packs <ChevronRight class="h-3 w-3" strokeWidth={2.25} />
          </a>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3" data-tour="framework-cards">
          {#each installedPacks as p (p.id)}
            {@const score = p.controlCount > 0 && p.passCount !== null ? Math.round((p.passCount * 100) / p.controlCount) : 0}
            <a
              href="/console/compliance/packs"
              class="group surface p-4 hover:shadow-sm hover:border-border-strong transition-all duration-fast block"
            >
              <div class="flex items-start justify-between mb-3">
                <Badge variant={frameworkBadge(p.framework)} size="sm">
                  {p.framework.replace("_", " ")}
                </Badge>
                <ArrowUpRight class="h-3 w-3 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-fast" strokeWidth={2.25} />
              </div>
              <div class="text-2xs font-medium text-foreground/80 truncate mb-2">{p.label}</div>
              <div class="flex items-baseline gap-1.5">
                <div class={cn("text-2xl font-semibold tabular-nums tracking-tight", scoreColorClass(score))}>
                  {score}<span class="text-sm text-muted-foreground/50">%</span>
                </div>
                <span class="text-2xs text-muted-foreground tabular-nums">{p.passCount ?? 0}/{p.controlCount}</span>
              </div>
              <div class="mt-2.5 h-1 bg-muted rounded-full overflow-hidden">
                <div class={cn("h-full transition-all duration-500 ease-out-quart", scoreBgClass(score))} style="width: {score}%"></div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Two-column: integrations + evidence stream -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Connected apps -->
      <Card padding="none" class="overflow-hidden" data-tour="connected-apps">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 class="text-sm font-semibold text-foreground">Connected Apps</h2>
          {#if !loadingIntegrations}
            <a
              href="/console/apps"
              class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              All <ChevronRight class="h-3 w-3" strokeWidth={2.25} />
            </a>
          {/if}
        </div>
        {#if loadingIntegrations}
          <div class="px-4 py-4">
            <ul class="space-y-3">
              {#each Array(3) as _}
                <li class="flex items-center justify-between">
                  <div class="space-y-2 flex-1">
                    <div class="h-4 w-32 skeleton rounded"></div>
                    <div class="h-3 w-24 skeleton rounded"></div>
                  </div>
                  <div class="h-5 w-16 skeleton rounded"></div>
                </li>
              {/each}
            </ul>
          </div>
        {:else if errorIntegrations}
          <div class="px-4 py-6 text-center">
            <AlertTriangle class="h-5 w-5 text-destructive mx-auto mb-2" />
            <p class="text-sm text-destructive">{errorIntegrations}</p>
            <Button variant="outline" size="sm" class="mt-2" on:click={loadIntegrations}>Retry</Button>
          </div>
        {:else if integrations.length === 0}
          <EmptyState
            title="No apps connected"
            description="Connect your first integration to start collecting evidence."
            icon={AppWindow}
          >
            <svelte:fragment slot="action">
              <Button variant="primary" size="sm" href="/console/apps">
                <Plug class="h-3 w-3" strokeWidth={2.25} />
                Connect app
              </Button>
            </svelte:fragment>
          </EmptyState>
        {:else}
          <ul class="divide-y divide-border">
            {#each integrations.slice(0, 5) as i (i.id)}
              <li class="px-4 py-2.5 flex items-center justify-between row-hover">
                <div class="min-w-0">
                  <div class="font-medium text-foreground capitalize text-sm truncate">{i.provider}</div>
                  <div class="text-2xs text-muted-foreground">Synced {relativeTime(i.updated_at)}</div>
                </div>
                <Badge
                  variant={i.status === "active" ? "success" : i.status === "error" ? "destructive" : "muted"}
                  size="sm"
                  dot
                >
                  {i.status}
                </Badge>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>

      <!-- Evidence stream -->
      <Card padding="none" class="lg:col-span-2 overflow-hidden" data-tour="evidence-feed">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-foreground">Recent Evidence</h2>
            <p class="text-2xs text-muted-foreground">Latest operational records scored against controls</p>
          </div>
          {#if !loadingEvidence}
            <a
              href="/console/compliance/evidence"
              class="text-2xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              All <ChevronRight class="h-3 w-3" strokeWidth={2.25} />
            </a>
          {/if}
        </div>
        {#if loadingEvidence}
          <div class="px-4 py-4">
            <ul class="space-y-3">
              {#each Array(5) as _}
                <li class="flex items-start gap-3">
                  <div class="h-5 w-16 skeleton rounded mt-0.5"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 w-3/4 skeleton rounded"></div>
                    <div class="h-3 w-1/2 skeleton rounded"></div>
                  </div>
                  <div class="h-3 w-12 skeleton rounded"></div>
                </li>
              {/each}
            </ul>
          </div>
        {:else if errorEvidence}
          <div class="px-4 py-6 text-center">
            <AlertTriangle class="h-5 w-5 text-destructive mx-auto mb-2" />
            <p class="text-sm text-destructive">{errorEvidence}</p>
            <Button variant="outline" size="sm" class="mt-2" on:click={loadEvidence}>Retry</Button>
          </div>
        {:else if evidence.length === 0}
          <EmptyState
            title="No evidence yet"
            description="Connect an app and the compliance engine will start scoring its events."
            icon={FileCheck}
          />
        {:else}
          <ul class="divide-y divide-border">
            {#each evidence as e (e.id)}
              <li class="px-4 py-2.5 row-hover">
                <div class="flex items-start gap-3">
                  <Badge variant={impactBadge(e.metadata?.impact)} size="sm" class="shrink-0 mt-0.5">
                    {e.metadata?.impact ?? "—"}
                  </Badge>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 text-sm flex-wrap">
                      {#if e.framework}
                        <span class="font-mono text-2xs text-muted-foreground">{e.framework}</span>
                      {/if}
                      <span class="font-mono text-xs font-medium text-foreground tabular-nums">{e.controlId ?? "—"}</span>
                      <span class="text-muted-foreground/30 text-xs">·</span>
                      <span class="text-2xs text-muted-foreground capitalize">{e.source}</span>
                    </div>
                    {#if e.metadata?.reasoning}
                      <p class="mt-0.5 text-xs text-muted-foreground truncate">{e.metadata.reasoning}</p>
                    {/if}
                  </div>
                  <div class="text-2xs text-muted-foreground shrink-0 tabular-nums">{relativeTime(e.createdAt)}</div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>

    <!-- Quick actions -->
    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump to</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {#each quickActions as a}
          <a
            href={a.href}
            class="group surface p-4 hover:shadow-sm hover:border-primary/40 transition-all duration-fast"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <svelte:component this={a.icon} class="h-4 w-4" strokeWidth={2} />
              </div>
              <ArrowUpRight class="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
            </div>
            <div class="font-medium text-foreground text-sm">{a.label}</div>
            <div class="text-2xs text-muted-foreground mt-0.5">{a.hint}</div>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>
</ErrorBoundary>
