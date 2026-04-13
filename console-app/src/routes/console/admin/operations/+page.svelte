<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Progress from "$lib/components/ui/progress.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import {
    Activity, AlertTriangle, RotateCw, ChevronDown, ChevronRight,
    Inbox, CheckCircle, XCircle, Clock, Shield, Zap, Database,
    HeartPulse, Bell,
  } from "lucide-svelte";

  // ── Types ──────────────────────────────────────────────────────────

  interface DlqEntry {
    id: string;
    eventType: string;
    agentId: string;
    tenantId: string;
    attempts: number;
    deadLetteredAt: string;
    replayStatus: string | null;
    replayedAt: string | null;
    eventPayload: unknown;
  }

  interface WorkflowRun {
    id: string;
    type: string;
    status: string;
    email: string;
    userId: string | null;
    trigger: string | null;
    startedAt: string;
    completedAt: string | null;
    stepsDone: number;
    stepsTotal: number;
    durationMs: number | null;
    error: string | null;
    context: string | null;
  }

  interface JmlMetrics {
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
    byType: Record<string, { total: number; completed: number; failed: number }>;
    avgDurationMs: number | null;
  }

  interface AdapterProvisionMetrics {
    adapter: string;
    provisions: number;
    deprovisions: number;
    failures: number;
    failureRate: number;
    lastActivity: string | null;
  }

  interface EvidenceHealthItem {
    adapter: string;
    totalItems: number;
    lastCollected: string | null;
    staleHours: number | null;
    isStale: boolean;
  }

  interface AlertItem {
    severity: "critical" | "warning" | "info";
    type: string;
    message: string;
    detail?: string;
  }

  // ── State ──────────────────────────────────────────────────────────

  let activeTab = "dashboard";

  let dlqEntries: DlqEntry[] = [];
  let dlqLoading = true;
  let dlqError = "";
  let expandedDlq: string | null = null;
  let replayingIds = new Set<string>();

  let runs: WorkflowRun[] = [];
  let runsLoading = true;
  let runsError = "";
  let expandedRun: string | null = null;

  let jml: JmlMetrics | null = null;
  let adapterProvisions: AdapterProvisionMetrics[] = [];
  let evidenceHealth: EvidenceHealthItem[] = [];
  let alerts: AlertItem[] = [];
  let metricsLoading = true;
  let metricsError = "";

  // ── Helpers ────────────────────────────────────────────────────────

  function truncateId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + "..." : id;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function dlqBadgeVariant(entry: DlqEntry): "destructive" | "success" | "warning" {
    if (!entry.replayStatus) return "destructive";
    if (entry.replayStatus === "success") return "success";
    return "warning";
  }

  function dlqBadgeLabel(entry: DlqEntry): string {
    if (!entry.replayStatus) return "Unreplayed";
    if (entry.replayStatus === "success") return "Replayed";
    return "Replay Failed";
  }

  function runStatusVariant(status: string): "success" | "default" | "destructive" | "warning" | "info" {
    switch (status) {
      case "completed": return "success";
      case "running": return "info";
      case "failed": return "destructive";
      case "compensating": return "warning";
      default: return "default";
    }
  }

  function runStatusColor(status: string): string {
    switch (status) {
      case "completed": return "text-success";
      case "running": return "text-primary";
      case "failed": return "text-destructive";
      case "compensating": return "text-orange-600 dark:text-orange-400";
      default: return "text-muted-foreground";
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────

  async function loadDlq() {
    dlqLoading = true;
    dlqError = "";
    try {
      const res = await fetch("/api/dead-letter?limit=25");
      if (!res.ok) throw new Error(`Failed to load DLQ (${res.status})`);
      const data = await res.json();
      dlqEntries = data.entries ?? data.items ?? data ?? [];
    } catch (e: any) {
      dlqError = e?.message || "Failed to load dead letter entries";
    } finally {
      dlqLoading = false;
    }
  }

  async function loadRuns() {
    runsLoading = true;
    runsError = "";
    try {
      const res = await fetch("/api/jml/runs?limit=25");
      if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
      const data = await res.json();
      runs = data.runs ?? [];
    } catch (e: any) {
      runsError = e?.message || "Failed to load workflow runs";
    } finally {
      runsLoading = false;
    }
  }

  async function replayEntry(id: string) {
    replayingIds.add(id);
    replayingIds = replayingIds;
    try {
      const res = await fetch(`/api/dead-letter/${id}`, { method: "POST" });
      if (!res.ok) throw new Error(`Replay failed (${res.status})`);
      pushToast({ message: "Replay initiated", variant: "success" });
      await loadDlq();
    } catch (e: any) {
      pushToast({ message: e?.message || "Replay failed", variant: "error" });
    } finally {
      replayingIds.delete(id);
      replayingIds = replayingIds;
    }
  }

  function toggleDlqExpand(id: string) {
    expandedDlq = expandedDlq === id ? null : id;
  }

  function toggleRunExpand(id: string) {
    expandedRun = expandedRun === id ? null : id;
  }

  async function loadMetrics() {
    metricsLoading = true;
    metricsError = "";
    try {
      const res = await fetch("/api/operations/metrics");
      if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
      const data = await res.json();
      jml = data.jml ?? null;
      adapterProvisions = data.adapterProvisions ?? [];
      evidenceHealth = data.evidenceHealth ?? [];
      alerts = data.alerts ?? [];
    } catch (e: any) {
      metricsError = e?.message || "Failed to load operational metrics";
    } finally {
      metricsLoading = false;
    }
  }

  function alertSeverityVariant(severity: string): "destructive" | "warning" | "default" {
    if (severity === "critical") return "destructive";
    if (severity === "warning") return "warning";
    return "default";
  }

  onMount(() => {
    loadMetrics();
    loadDlq();
    loadRuns();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Operations</h1>
      <p class="text-sm text-muted-foreground">Pipeline health, workflow runs, and dead letter queue</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Activity class="h-5 w-5 text-primary" />
    </div>
  </div>

  <!-- Alerts Banner -->
  {#if alerts.length > 0}
    <div class="space-y-2">
      {#each alerts as alert}
        <Alert variant={alertSeverityVariant(alert.severity)}>
          <div class="flex items-start gap-2">
            {#if alert.severity === "critical"}
              <XCircle class="h-4 w-4 mt-0.5 shrink-0" />
            {:else}
              <AlertTriangle class="h-4 w-4 mt-0.5 shrink-0" />
            {/if}
            <div class="pl-1">
              <p class="text-sm font-medium">{alert.message}</p>
              {#if alert.detail}
                <p class="text-xs opacity-80 mt-0.5">{alert.detail}</p>
              {/if}
            </div>
          </div>
        </Alert>
      {/each}
    </div>
  {/if}

  <!-- Tabs -->
  <Tabs bind:value={activeTab}>
    <TabsList>
      <TabsTrigger value="dashboard" active={activeTab === "dashboard"} on:click={() => activeTab = "dashboard"}>Dashboard</TabsTrigger>
      <TabsTrigger value="evidence" active={activeTab === "evidence"} on:click={() => activeTab = "evidence"}>Evidence Health</TabsTrigger>
      <TabsTrigger value="runs" active={activeTab === "runs"} on:click={() => activeTab = "runs"}>Workflow Runs</TabsTrigger>
      <TabsTrigger value="dlq" active={activeTab === "dlq"} on:click={() => activeTab = "dlq"}>Dead Letter Queue</TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Tab: Dashboard (JML Metrics) -->
  {#if activeTab === "dashboard"}
    {#if metricsLoading}
      <div class="grid gap-4 md:grid-cols-4">
        {#each [1, 2, 3, 4] as _}
          <Skeleton class="h-24 rounded-lg" />
        {/each}
      </div>
    {:else if metricsError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{metricsError}</p>
      </Alert>
    {:else if jml}
      <!-- Summary Cards -->
      <div class="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">Total Runs</p>
              <Zap class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="text-2xl font-bold mt-1">{jml.total}</p>
            <p class="text-xs text-muted-foreground mt-1">{jml.running} currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">Success Rate</p>
              <CheckCircle class="h-4 w-4 {jml.successRate >= 80 ? 'text-green-500' : jml.successRate >= 50 ? 'text-yellow-500' : 'text-destructive'}" />
            </div>
            <p class="text-2xl font-bold mt-1">{jml.successRate}%</p>
            <Progress value={jml.successRate} max={100} class="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">Completed</p>
              <CheckCircle class="h-4 w-4 text-green-500" />
            </div>
            <p class="text-2xl font-bold mt-1 text-success">{jml.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted-foreground">Failed</p>
              <XCircle class="h-4 w-4 text-destructive" />
            </div>
            <p class="text-2xl font-bold mt-1 text-destructive">{jml.failed}</p>
            {#if jml.avgDurationMs}
              <p class="text-xs text-muted-foreground mt-1">Avg: {jml.avgDurationMs}ms</p>
            {/if}
          </CardContent>
        </Card>
      </div>

      <!-- By Type Breakdown -->
      {#if Object.keys(jml.byType).length > 0}
        <h2 class="text-lg font-semibold">Workflow Types</h2>
        <div class="grid gap-3 md:grid-cols-3">
          {#each Object.entries(jml.byType) as [type, stats]}
            <Card>
              <CardContent class="pt-4 pb-3">
                <div class="flex items-center justify-between mb-2">
                  <Badge variant="outline" class="capitalize">{type}</Badge>
                  <span class="text-xs text-muted-foreground">{stats.total} runs</span>
                </div>
                <div class="flex gap-3 text-xs">
                  <span class="text-success">{stats.completed} passed</span>
                  <span class="text-destructive">{stats.failed} failed</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} max={100} class="mt-2" />
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}

      <!-- Adapter Provision Metrics -->
      {#if adapterProvisions.length > 0}
        <h2 class="text-lg font-semibold">Adapter Provisioning</h2>
        <Card>
          <CardContent class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                    <th class="px-4 py-3 font-medium">Adapter</th>
                    <th class="px-4 py-3 font-medium text-center">Provisions</th>
                    <th class="px-4 py-3 font-medium text-center">Deprovisions</th>
                    <th class="px-4 py-3 font-medium text-center">Failures</th>
                    <th class="px-4 py-3 font-medium text-center">Failure Rate</th>
                    <th class="px-4 py-3 font-medium hidden sm:table-cell">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {#each adapterProvisions as ap}
                    <tr class="border-t hover:bg-muted/50">
                      <td class="px-4 py-3 font-medium capitalize">{ap.adapter.replace(/-/g, ' ')}</td>
                      <td class="px-4 py-3 text-center text-success">{ap.provisions}</td>
                      <td class="px-4 py-3 text-center text-primary">{ap.deprovisions}</td>
                      <td class="px-4 py-3 text-center text-destructive">{ap.failures}</td>
                      <td class="px-4 py-3 text-center">
                        <Badge variant={ap.failureRate > 50 ? 'destructive' : ap.failureRate > 20 ? 'warning' : 'success'}>
                          {ap.failureRate}%
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {ap.lastActivity ? timeAgo(ap.lastActivity) : '—'}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      {/if}

      <div class="flex justify-end">
        <Button variant="outline" size="sm" on:click={loadMetrics} disabled={metricsLoading}>
          <RotateCw class="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    {:else}
      <Card>
        <CardContent class="py-12 text-center">
          <Activity class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No operational metrics available yet</p>
        </CardContent>
      </Card>
    {/if}
  {/if}

  <!-- Tab: Evidence Pipeline Health -->
  {#if activeTab === "evidence"}
    {#if metricsLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-20 rounded-lg" />
        {/each}
      </div>
    {:else if evidenceHealth.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <Database class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No evidence collection data available yet</p>
          <p class="text-xs text-muted-foreground mt-1">Evidence is collected automatically on a 5-minute cron cycle</p>
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each evidenceHealth as eh}
          <Card class={eh.isStale ? 'border-amber-500/50' : ''}>
            <CardContent class="pt-4 pb-3">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm capitalize">{eh.adapter.replace(/-/g, ' ')}</span>
                {#if eh.isStale}
                  <Badge variant="warning" class="text-[10px] gap-1">
                    <Clock class="h-3 w-3" />
                    Stale
                  </Badge>
                {:else}
                  <Badge variant="success" class="text-[10px] gap-1">
                    <HeartPulse class="h-3 w-3" />
                    Healthy
                  </Badge>
                {/if}
              </div>
              <div class="space-y-1 text-xs text-muted-foreground">
                <p>{eh.totalItems} evidence items collected</p>
                {#if eh.lastCollected}
                  <p>Last collection: {timeAgo(eh.lastCollected)}</p>
                {:else}
                  <p>Never collected</p>
                {/if}
                {#if eh.staleHours !== null && eh.staleHours > 0}
                  <p class={eh.isStale ? 'text-warning font-medium' : ''}>
                    {eh.staleHours}h since last update
                  </p>
                {/if}
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>

      <div class="flex justify-end">
        <Button variant="outline" size="sm" on:click={loadMetrics} disabled={metricsLoading}>
          <RotateCw class="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    {/if}
  {/if}

  <!-- Tab: Dead Letter Queue -->
  {#if activeTab === "dlq"}
    {#if dlqError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{dlqError}</p>
      </Alert>
    {/if}

    {#if dlqLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-16 rounded-lg" />
        {/each}
      </div>
    {:else if dlqEntries.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <Inbox class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No dead letter entries — all workflow steps completed successfully</p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-3 sm:px-4 py-3 font-medium w-8"></th>
                  <th class="px-3 sm:px-4 py-3 font-medium">ID</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Event Type</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Agent</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Tenant</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Attempts</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Dead-lettered</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Status</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each dlqEntries as entry}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-3 sm:px-4 py-3">
                      <button
                        class="text-muted-foreground hover:text-foreground transition-colors"
                        on:click={() => toggleDlqExpand(entry.id)}
                        aria-label="Toggle details"
                      >
                        {#if expandedDlq === entry.id}
                          <ChevronDown class="h-4 w-4" />
                        {:else}
                          <ChevronRight class="h-4 w-4" />
                        {/if}
                      </button>
                    </td>
                    <td class="px-3 sm:px-4 py-3 font-mono text-xs" title={entry.id}>{truncateId(entry.id)}</td>
                    <td class="px-3 sm:px-4 py-3">{entry.eventType}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">{entry.agentId}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{truncateId(entry.tenantId)}</td>
                    <td class="px-3 sm:px-4 py-3 text-center">{entry.attempts}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{timeAgo(entry.deadLetteredAt)}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant={dlqBadgeVariant(entry)}>{dlqBadgeLabel(entry)}</Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={replayingIds.has(entry.id)}
                        on:click={() => replayEntry(entry.id)}
                      >
                        <RotateCw class="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    </td>
                  </tr>
                  {#if expandedDlq === entry.id}
                    <tr class="bg-muted/30">
                      <td colspan="9" class="px-4 py-4">
                        <div class="text-xs font-medium text-muted-foreground mb-2">Event Payload</div>
                        <pre class="text-xs bg-background rounded-md p-3 overflow-x-auto max-h-64 border">{JSON.stringify(entry.eventPayload, null, 2)}</pre>
                        {#if entry.replayedAt}
                          <div class="mt-2 text-xs text-muted-foreground">
                            Replayed at: {formatDate(entry.replayedAt)}
                          </div>
                        {/if}
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}

    <div class="flex justify-end">
      <Button variant="outline" size="sm" on:click={loadDlq} disabled={dlqLoading}>
        <RotateCw class="h-3 w-3 mr-1" />
        Refresh
      </Button>
    </div>
  {/if}

  <!-- Tab 2: Workflow Runs -->
  {#if activeTab === "runs"}
    {#if runsError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{runsError}</p>
      </Alert>
    {/if}

    {#if runsLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-16 rounded-lg" />
        {/each}
      </div>
    {:else if runs.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <CheckCircle class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No workflow runs found</p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-3 sm:px-4 py-3 font-medium w-8"></th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Run ID</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Type</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">User Email</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Status</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Steps</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Started</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Completed</th>
                </tr>
              </thead>
              <tbody>
                {#each runs as run}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-3 sm:px-4 py-3">
                      <button
                        class="text-muted-foreground hover:text-foreground transition-colors"
                        on:click={() => toggleRunExpand(run.id)}
                        aria-label="Toggle details"
                      >
                        {#if expandedRun === run.id}
                          <ChevronDown class="h-4 w-4" />
                        {:else}
                          <ChevronRight class="h-4 w-4" />
                        {/if}
                      </button>
                    </td>
                    <td class="px-3 sm:px-4 py-3 font-mono text-xs" title={run.id}>{truncateId(run.id)}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant="outline">{run.type}</Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{run.email || run.userId || "—"}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant={runStatusVariant(run.status)} class="capitalize">
                        {run.status}
                      </Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <span class="text-muted-foreground">{run.stepsDone}/{run.stepsTotal}</span>
                    </td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{timeAgo(run.startedAt)}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{run.completedAt ? timeAgo(run.completedAt) : "-"}</td>
                  </tr>
                  {#if expandedRun === run.id}
                    <tr class="bg-muted/30">
                      <td colspan="8" class="px-4 py-4">
                        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span class="font-medium text-muted-foreground">Run ID:</span>
                            <span class="font-mono ml-1">{run.id}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Subject:</span>
                            <span class="ml-1">{run.email || run.userId || "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Trigger:</span>
                            <span class="ml-1">{run.trigger || "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Started:</span>
                            <span class="ml-1">{formatDate(run.startedAt)}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Completed:</span>
                            <span class="ml-1">{formatDate(run.completedAt)}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Duration:</span>
                            <span class="ml-1">{run.durationMs ? `${run.durationMs}ms` : "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Progress:</span>
                            <span class="ml-1">{run.stepsDone ?? 0} of {run.stepsTotal ?? 0} steps</span>
                          </div>
                          {#if run.error}
                            <div class="col-span-2">
                              <span class="font-medium text-destructive">Error:</span>
                              <span class="ml-1 text-destructive">{run.error}</span>
                            </div>
                          {/if}
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}

    <div class="flex justify-end">
      <Button variant="outline" size="sm" on:click={loadRuns} disabled={runsLoading}>
        <RotateCw class="h-3 w-3 mr-1" />
        Refresh
      </Button>
    </div>
  {/if}
</div>
