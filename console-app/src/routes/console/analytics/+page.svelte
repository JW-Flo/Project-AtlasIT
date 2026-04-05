<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    TrendingUp,
    BarChart3,
    Shield,
    Activity,
    AlertTriangle,
    Download,
    Calendar,
    Target,
  } from "lucide-svelte";

  // ── Types ──────────────────────────────────────────────────────────────────

  interface TrendPoint {
    week: string;
    score: number;
  }

  interface FrameworkBreakdown {
    framework: string;
    score: number;
    grade: string;
    controlsTotal: number;
    controlsImplemented: number;
    controlsVerified: number;
  }

  interface EvidenceVolume {
    week: string;
    count: number;
  }

  interface AutomationMetrics {
    totalRules: number;
    activeRules: number;
    rulesExecuted: number;
    successRate: number;
    failureCount: number;
    timeSavedHours: number;
  }

  interface SecurityPosture {
    openIncidents: number;
    resolvedIncidents: number;
    criticalIncidents: number;
    accessReviewsTotal: number;
    accessReviewsCompleted: number;
    accessReviewCompletionRate: number;
  }

  interface TopRisk {
    controlRef: string;
    title: string;
    framework: string;
    score: number;
    status: string;
  }

  interface DashboardData {
    overallScore: number;
    trendDelta: number;
    complianceTrend: TrendPoint[];
    frameworkBreakdown: FrameworkBreakdown[];
    evidenceVolume: EvidenceVolume[];
    totalEvidence: number;
    automationMetrics: AutomationMetrics;
    securityPosture: SecurityPosture;
    topRisks: TopRisk[];
  }

  // ── State ──────────────────────────────────────────────────────────────────

  let loading = true;
  let error: string | null = null;
  let data: DashboardData | null = null;
  let dateRange = "30";

  // ── Derived ────────────────────────────────────────────────────────────────

  $: overallScore = data?.overallScore ?? 0;
  $: trendDelta = data?.trendDelta ?? 0;
  $: complianceTrend = data?.complianceTrend ?? [];
  $: frameworkBreakdown = data?.frameworkBreakdown ?? [];
  $: evidenceVolume = data?.evidenceVolume ?? [];
  $: totalEvidence = data?.totalEvidence ?? 0;
  $: automationMetrics = data?.automationMetrics ?? {
    totalRules: 0,
    activeRules: 0,
    rulesExecuted: 0,
    successRate: 0,
    failureCount: 0,
    timeSavedHours: 0,
  };
  $: securityPosture = data?.securityPosture ?? {
    openIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    accessReviewsTotal: 0,
    accessReviewsCompleted: 0,
    accessReviewCompletionRate: 0,
  };
  $: topRisks = data?.topRisks ?? [];

  // ── Chart helpers ──────────────────────────────────────────────────────────

  /** Compute SVG polyline points string for a line chart */
  function trendPolyline(
    points: TrendPoint[],
    width: number,
    height: number,
    padding = 8,
  ): string {
    if (points.length === 0) return "";
    const scores = points.map((p) => p.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 1;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;
    return points
      .map((p, i) => {
        const x = padding + (points.length === 1 ? usableW / 2 : (i / (points.length - 1)) * usableW);
        const y = padding + usableH - ((p.score - minScore) / range) * usableH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  /** Area path (filled region under the polyline) */
  function trendAreaPath(
    points: TrendPoint[],
    width: number,
    height: number,
    padding = 8,
  ): string {
    if (points.length === 0) return "";
    const polyline = trendPolyline(points, width, height, padding);
    const coords = polyline.split(" ");
    const firstX = coords[0].split(",")[0];
    const lastX = coords[coords.length - 1].split(",")[0];
    const bottom = height - padding;
    return `M ${firstX},${bottom} L ${polyline.replace(/(\S+),(\S+)/g, "$1,$2")} L ${lastX},${bottom} Z`;
  }

  /** Compute SVG bar positions for evidence volume */
  function barRects(
    points: EvidenceVolume[],
    width: number,
    height: number,
    padding = 8,
  ): Array<{ x: number; y: number; w: number; h: number; count: number; week: string }> {
    if (points.length === 0) return [];
    const maxCount = Math.max(...points.map((p) => p.count), 1);
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;
    const barW = Math.max(2, usableW / points.length - 2);
    return points.map((p, i) => {
      const barH = (p.count / maxCount) * usableH;
      const x = padding + (i / points.length) * usableW + 1;
      const y = padding + usableH - barH;
      return { x, y, w: barW, h: Math.max(1, barH), count: p.count, week: p.week };
    });
  }

  function statusVariant(status: string): "default" | "destructive" | "warning" | "secondary" | "success" {
    if (status === "verified") return "success";
    if (status === "implemented") return "success";
    if (status === "in_progress") return "warning";
    if (status === "not_started") return "destructive";
    return "secondary";
  }

  function statusLabel(status: string): string {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      implemented: "Implemented",
      verified: "Verified",
    };
    return labels[status] ?? status;
  }

  function gradeVariant(grade: string): "default" | "destructive" | "warning" | "secondary" | "success" {
    if (grade === "A") return "success";
    if (grade === "B") return "default";
    if (grade === "C") return "warning";
    if (grade === "D") return "warning";
    return "destructive";
  }

  function shortWeek(week: string): string {
    // week is YYYY-MM-DD or YYYY-WW; show short form
    if (week.length === 10) {
      const d = new Date(week);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return week.slice(5); // strip year
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  async function loadDashboard() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/analytics/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        error = (body as any).error ?? `Request failed (${res.status})`;
        return;
      }
      data = await res.json();
    } catch (e) {
      error = "Failed to load analytics data";
    } finally {
      loading = false;
    }
  }

  function handleExport() {
    pushToast({ message: "Report generation coming soon", variant: "default" });
  }

  onMount(() => {
    loadDashboard();
  });
</script>

<div class="flex flex-col gap-6 p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Analytics & Reporting</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Compliance posture, automation performance, and security trends
      </p>
    </div>

    <div class="flex items-center gap-2">
      <!-- Date range selector -->
      <div class="flex items-center gap-1 rounded-md border border-border bg-background p-1">
        <Calendar class="ml-1 h-4 w-4 text-muted-foreground" />
        {#each [
          { value: "7", label: "7 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "365", label: "12 months" },
        ] as range}
          <button
            class="rounded px-3 py-1 text-xs font-medium transition-colors
              {dateRange === range.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
            on:click={() => (dateRange = range.value)}
          >
            {range.label}
          </button>
        {/each}
      </div>

      <Button variant="outline" size="sm" on:click={handleExport}>
        <Download class="mr-2 h-4 w-4" />
        Download Report
      </Button>
    </div>
  </div>

  <!-- KPI Row -->
  {#if loading}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each [0, 1, 2, 3] as _}
        <Card>
          <CardContent class="p-6">
            <Skeleton class="h-4 w-32 mb-2" />
            <Skeleton class="h-8 w-20 mb-1" />
            <Skeleton class="h-3 w-24" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if error}
    <div class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {error}
    </div>
  {:else if data}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Overall Compliance Score -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Overall Compliance</p>
              <p class="mt-1 text-3xl font-bold text-foreground">{overallScore}%</p>
              <div class="mt-1 flex items-center gap-1 text-xs">
                {#if trendDelta > 0}
                  <TrendingUp class="h-3 w-3 text-green-500" />
                  <span class="text-green-600">+{trendDelta}% this week</span>
                {:else if trendDelta < 0}
                  <TrendingUp class="h-3 w-3 rotate-180 text-red-500" />
                  <span class="text-red-600">{trendDelta}% this week</span>
                {:else}
                  <span class="text-muted-foreground">No change this week</span>
                {/if}
              </div>
            </div>
            <div class="rounded-full bg-primary/10 p-2">
              <Shield class="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Evidence Collected -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Evidence Collected</p>
              <p class="mt-1 text-3xl font-bold text-foreground">{totalEvidence.toLocaleString()}</p>
              <p class="mt-1 text-xs text-muted-foreground">items across all frameworks</p>
            </div>
            <div class="rounded-full bg-blue-500/10 p-2">
              <BarChart3 class="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Automation Runs -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Automation Runs</p>
              <p class="mt-1 text-3xl font-bold text-foreground">{automationMetrics.rulesExecuted.toLocaleString()}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {automationMetrics.successRate}% success · ~{automationMetrics.timeSavedHours}h saved
              </p>
            </div>
            <div class="rounded-full bg-violet-500/10 p-2">
              <Activity class="h-5 w-5 text-violet-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Open Risks -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Open Risks</p>
              <p class="mt-1 text-3xl font-bold text-foreground">{securityPosture.openIncidents}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {securityPosture.criticalIncidents} critical · {securityPosture.resolvedIncidents} resolved
              </p>
            </div>
            <div class="rounded-full bg-orange-500/10 p-2">
              <AlertTriangle class="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Row 1: Compliance Trend + Framework Comparison -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Compliance Trend -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="h-4 w-4 text-primary" />
            Compliance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {#if complianceTrend.length > 0}
            {@const chartW = 480}
            {@const chartH = 160}
            {@const pad = 10}
            {@const polyline = trendPolyline(complianceTrend, chartW, chartH, pad)}
            {@const areaPath = trendAreaPath(complianceTrend, chartW, chartH, pad)}
            <div class="overflow-hidden rounded-md">
              <svg
                viewBox="0 0 {chartW} {chartH}"
                class="w-full"
                aria-label="Compliance score trend over time"
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0.02" />
                  </linearGradient>
                </defs>

                <!-- Grid lines -->
                {#each [25, 50, 75, 100] as gridVal}
                  {@const scores = complianceTrend.map((p) => p.score)}
                  {@const minScore = Math.min(...scores)}
                  {@const maxScore = Math.max(...scores)}
                  {@const range = maxScore - minScore || 1}
                  {@const gy = pad + (chartH - pad * 2) - ((gridVal - minScore) / range) * (chartH - pad * 2)}
                  {#if gy >= pad && gy <= chartH - pad}
                    <line
                      x1={pad}
                      y1={gy}
                      x2={chartW - pad}
                      y2={gy}
                      stroke="hsl(var(--border))"
                      stroke-width="0.5"
                      stroke-dasharray="4,4"
                    />
                    <text x={pad + 2} y={gy - 2} font-size="9" fill="hsl(var(--muted-foreground))">{gridVal}%</text>
                  {/if}
                {/each}

                <!-- Area fill -->
                <path d={areaPath} fill="url(#trendGrad)" />

                <!-- Line -->
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  stroke-width="2"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />

                <!-- Data points -->
                {#each complianceTrend as point, i}
                  {@const x = pad + (complianceTrend.length === 1 ? (chartW - pad * 2) / 2 : (i / (complianceTrend.length - 1)) * (chartW - pad * 2))}
                  {@const scores2 = complianceTrend.map((p) => p.score)}
                  {@const minS = Math.min(...scores2)}
                  {@const maxS = Math.max(...scores2)}
                  {@const rng = maxS - minS || 1}
                  {@const y = pad + (chartH - pad * 2) - ((point.score - minS) / rng) * (chartH - pad * 2)}
                  {#if i === 0 || i === complianceTrend.length - 1 || i % 3 === 0}
                    <circle cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
                  {/if}
                {/each}
              </svg>
            </div>

            <!-- X-axis labels -->
            <div class="mt-1 flex justify-between text-xs text-muted-foreground">
              {#if complianceTrend.length > 0}
                <span>{shortWeek(complianceTrend[0].week)}</span>
                <span>{shortWeek(complianceTrend[Math.floor(complianceTrend.length / 2)].week)}</span>
                <span>{shortWeek(complianceTrend[complianceTrend.length - 1].week)}</span>
              {/if}
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">No trend data available yet.</p>
          {/if}
        </CardContent>
      </Card>

      <!-- Framework Comparison -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Target class="h-4 w-4 text-primary" />
            Framework Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {#if frameworkBreakdown.length > 0}
            <div class="space-y-4">
              {#each frameworkBreakdown as fw}
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-foreground">{fw.framework}</span>
                    <div class="flex items-center gap-2">
                      <Badge variant={gradeVariant(fw.grade)} class="text-xs">{fw.grade}</Badge>
                      <span class="text-muted-foreground w-12 text-right">{fw.score.toFixed(1)}%</span>
                    </div>
                  </div>
                  <!-- Horizontal bar -->
                  <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      class="h-full rounded-full bg-primary transition-all duration-500"
                      style="width: {Math.min(100, fw.score)}%"
                    ></div>
                  </div>
                  <div class="flex gap-3 text-xs text-muted-foreground">
                    <span>{fw.controlsTotal} controls</span>
                    <span>{fw.controlsImplemented} implemented</span>
                    <span>{fw.controlsVerified} verified</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">No framework data available. Configure compliance frameworks to see scores.</p>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Charts Row 2: Evidence Volume + Top Risks -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Evidence Volume -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-4 w-4 text-blue-500" />
            Evidence Volume (Weekly)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {#if evidenceVolume.length > 0}
            {@const chartW = 480}
            {@const chartH = 120}
            {@const pad = 8}
            {@const rects = barRects(evidenceVolume, chartW, chartH, pad)}
            <div class="overflow-hidden rounded-md">
              <svg
                viewBox="0 0 {chartW} {chartH}"
                class="w-full"
                aria-label="Evidence collected per week"
              >
                {#each rects as rect}
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx="2"
                    fill="hsl(var(--primary))"
                    opacity="0.75"
                  />
                {/each}
              </svg>
            </div>
            <!-- X-axis labels -->
            <div class="mt-1 flex justify-between text-xs text-muted-foreground">
              {#if evidenceVolume.length > 0}
                <span>{shortWeek(evidenceVolume[0].week)}</span>
                <span>{shortWeek(evidenceVolume[Math.floor(evidenceVolume.length / 2)].week)}</span>
                <span>{shortWeek(evidenceVolume[evidenceVolume.length - 1].week)}</span>
              {/if}
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              {totalEvidence.toLocaleString()} total evidence items collected
            </p>
          {:else}
            <p class="text-sm text-muted-foreground">No evidence volume data available yet.</p>
          {/if}
        </CardContent>
      </Card>

      <!-- Automation Summary -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Activity class="h-4 w-4 text-violet-500" />
            Automation Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-lg bg-muted/50 p-3">
                <p class="text-xs text-muted-foreground">Active Rules</p>
                <p class="text-2xl font-bold text-foreground">{automationMetrics.activeRules}</p>
                <p class="text-xs text-muted-foreground">of {automationMetrics.totalRules} total</p>
              </div>
              <div class="rounded-lg bg-muted/50 p-3">
                <p class="text-xs text-muted-foreground">Success Rate</p>
                <p class="text-2xl font-bold text-foreground">{automationMetrics.successRate}%</p>
                <p class="text-xs text-muted-foreground">{automationMetrics.failureCount} failures</p>
              </div>
              <div class="rounded-lg bg-muted/50 p-3">
                <p class="text-xs text-muted-foreground">Executions</p>
                <p class="text-2xl font-bold text-foreground">{automationMetrics.rulesExecuted.toLocaleString()}</p>
                <p class="text-xs text-muted-foreground">total runs</p>
              </div>
              <div class="rounded-lg bg-muted/50 p-3">
                <p class="text-xs text-muted-foreground">Time Saved</p>
                <p class="text-2xl font-bold text-foreground">~{automationMetrics.timeSavedHours}h</p>
                <p class="text-xs text-muted-foreground">estimated</p>
              </div>
            </div>

            <!-- Access review completion -->
            {#if securityPosture.accessReviewsTotal > 0}
              <div class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">Access Review Completion</span>
                  <span class="font-medium text-foreground">{securityPosture.accessReviewCompletionRate}%</span>
                </div>
                <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    class="h-full rounded-full bg-green-500 transition-all duration-500"
                    style="width: {securityPosture.accessReviewCompletionRate}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">
                  {securityPosture.accessReviewsCompleted} of {securityPosture.accessReviewsTotal} reviews completed
                </p>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Top Risks Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-orange-500" />
          Top Risks — Controls with Lowest Scores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {#if topRisks.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left">
                  <th class="pb-2 pr-4 font-medium text-muted-foreground">Control Ref</th>
                  <th class="pb-2 pr-4 font-medium text-muted-foreground">Title</th>
                  <th class="pb-2 pr-4 font-medium text-muted-foreground">Framework</th>
                  <th class="pb-2 pr-4 font-medium text-muted-foreground text-right">Score</th>
                  <th class="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {#each topRisks as risk}
                  <tr class="hover:bg-muted/30 transition-colors">
                    <td class="py-3 pr-4 font-mono text-xs text-foreground">{risk.controlRef}</td>
                    <td class="py-3 pr-4 text-foreground max-w-[240px] truncate" title={risk.title}>
                      {risk.title}
                    </td>
                    <td class="py-3 pr-4">
                      <Badge variant="secondary" class="text-xs">{risk.framework}</Badge>
                    </td>
                    <td class="py-3 pr-4 text-right">
                      <span
                        class="font-semibold {risk.score < 25
                          ? 'text-red-500'
                          : risk.score < 50
                            ? 'text-orange-500'
                            : risk.score < 75
                              ? 'text-yellow-500'
                              : 'text-green-500'}"
                      >
                        {risk.score}%
                      </span>
                    </td>
                    <td class="py-3">
                      <Badge variant={statusVariant(risk.status)} class="text-xs">
                        {statusLabel(risk.status)}
                      </Badge>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-sm text-muted-foreground">
            No risk data available. Configure compliance controls to see top risks.
          </p>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
