<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, iconMap } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import Separator from "$lib/components/ui/separator.svelte";
  import Progress from "$lib/components/ui/progress.svelte";
  import {
    Link, ChevronDown, Play, CheckCircle, XCircle, Minus,
    Activity, Settings, Users, Clock, AlertTriangle, RefreshCw,
    Save, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  } from "lucide-svelte";

  // ── Types ──────────────────────────────────────────────────────

  interface WorkflowStep {
    name: string;
    description: string;
  }

  interface AppWorkflow {
    appId: string;
    appName: string;
    category: string;
    connected: boolean;
    joiner: WorkflowStep[];
    mover: WorkflowStep[];
    leaver: WorkflowStep[];
  }

  interface ExecutionResult {
    success: boolean;
    steps: { name: string; status: "success" | "failed" | "skipped" }[];
    message?: string;
  }

  interface WorkflowRun {
    id: string;
    type: "joiner" | "leaver" | "mover" | "rehire";
    user_id: string;
    email?: string;
    status: "queued" | "running" | "completed" | "failed" | "compensating";
    trigger: "jml_auto" | "manual" | "schedule" | "api";
    steps_total: number;
    steps_done: number;
    started_at: string;
    completed_at?: string;
    duration_ms?: number;
    error?: string;
    context: Record<string, unknown>;
  }

  interface ChangelogEntry {
    id: string;
    user_id: string;
    email?: string;
    change_type: "created" | "updated" | "deactivated" | "deleted" | "reactivated";
    delta: Record<string, { old?: unknown; new?: unknown }>;
    jml_action?: "joiner" | "leaver" | "mover" | "rehire";
    workflow_run_id?: string;
    source: string;
    processed: boolean;
    created_at: string;
  }

  interface JmlPolicy {
    enabled: boolean;
    autoJoiner: boolean;
    autoLeaver: boolean;
    autoMover: boolean;
    leaverGraceMs: number;
    requireJoinerApproval: boolean;
    notifyManager: boolean;
    notifyUser: boolean;
  }

  // ── Helpers ────────────────────────────────────────────────────

  function humanize(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toSteps(names: string[]): WorkflowStep[] {
    return names.map((n) => ({ name: humanize(n), description: n }));
  }

  function relTime(iso: string): string {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  }

  function durationStr(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  }

  type PolicyBoolKey = "enabled" | "autoJoiner" | "autoLeaver" | "autoMover" | "requireJoinerApproval" | "notifyManager" | "notifyUser";

  function togglePolicy(key: PolicyBoolKey) {
    policy[key] = !policy[key];
    policy = policy;
  }

  const gracePeriodOptions = [
    { label: "Immediate", ms: 0 },
    { label: "1 hour", ms: 3_600_000 },
    { label: "4 hours", ms: 14_400_000 },
    { label: "24 hours", ms: 86_400_000 },
    { label: "3 days", ms: 259_200_000 },
    { label: "7 days", ms: 604_800_000 },
    { label: "14 days", ms: 1_209_600_000 },
    { label: "30 days", ms: 2_592_000_000 },
  ];

  const typeColors: Record<string, string> = {
    joiner: "bg-green-500/10 text-green-500 border-green-500/20",
    mover: "bg-primary/10 text-primary border-primary/20",
    leaver: "bg-destructive/10 text-destructive border-destructive/20",
    rehire: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const statusColors: Record<string, string> = {
    completed: "text-green-500",
    failed: "text-destructive",
    running: "text-primary",
    queued: "text-muted-foreground",
    compensating: "text-warning",
  };

  // ── State ──────────────────────────────────────────────────────

  let activeTab: "overview" | "policies" | "users" | "activity" = "overview";

  // Workflows (apps)
  let workflows: AppWorkflow[] = [];
  let loading = true;
  let idpSource = "okta";
  let searchQuery = "";

  // Run modal
  let showModal = false;
  let modalApp: AppWorkflow | null = null;
  let modalType: "joiner" | "mover" | "leaver" = "joiner";
  let modalEmail = "";
  let executing = false;
  let executionResult: ExecutionResult | null = null;

  // Bulk execution
  let bulkType: "joiner" | "mover" | "leaver" = "joiner";
  let bulkEmail = "";
  let bulkExecuting = false;

  // Section collapse (users tab)
  let collapsed: Record<string, boolean> = {};

  // JML Policy
  let policy: JmlPolicy = {
    enabled: true,
    autoJoiner: true,
    autoLeaver: true,
    autoMover: true,
    leaverGraceMs: 86_400_000,
    requireJoinerApproval: false,
    notifyManager: true,
    notifyUser: true,
  };
  let policyLoading = true;
  let policySaving = false;
  let policyDirty = false;
  let policyOriginal: string = "";

  // Runs
  let runs: WorkflowRun[] = [];
  let runsLoading = true;
  let runsFilter: string = "";

  // Changelog (activity)
  let changelog: ChangelogEntry[] = [];
  let changelogTotal = 0;
  let changelogLoading = true;
  let changelogOffset = 0;
  let changelogLimit = 20;
  let changelogActionFilter = "";

  // Stats (computed from runs)
  let stats = { total: 0, completed: 0, failed: 0, running: 0, successRate: 0, byType: {} as Record<string, number> };

  const idpSources = [
    { id: "okta", label: "Okta" },
    { id: "google_workspace", label: "Google Workspace" },
    { id: "active_directory", label: "Active Directory" },
    { id: "entra_id", label: "Entra ID" },
  ];

  const sections: { type: "joiner" | "mover" | "leaver"; label: string; variant: "success" | "default" | "destructive" }[] = [
    { type: "joiner", label: "Joiner", variant: "success" },
    { type: "mover", label: "Mover", variant: "default" },
    { type: "leaver", label: "Leaver", variant: "destructive" },
  ];

  const sectionColors: Record<string, string> = {
    joiner: "bg-green-500/10 text-green-500 border-green-500/20",
    mover: "bg-primary/10 text-primary border-primary/20",
    leaver: "bg-destructive/10 text-destructive border-destructive/20",
  };

  // ── Reactive ───────────────────────────────────────────────────

  $: connectedWorkflows = workflows.filter((w) => w.connected);
  $: filtered = connectedWorkflows.filter(
    (w) => !searchQuery || w.appName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  $: hasConnected = connectedWorkflows.length > 0;

  $: {
    const s = JSON.stringify(policy);
    policyDirty = s !== policyOriginal;
  }

  $: {
    const total = runs.length;
    const completed = runs.filter((r) => r.status === "completed").length;
    const failed = runs.filter((r) => r.status === "failed").length;
    const running = runs.filter((r) => r.status === "running" || r.status === "queued").length;
    const byType: Record<string, number> = {};
    for (const r of runs) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
    stats = {
      total,
      completed,
      failed,
      running,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byType,
    };
  }

  $: filteredRuns = runsFilter
    ? runs.filter((r) => r.status === runsFilter || r.type === runsFilter)
    : runs;

  $: recentRuns = runs.slice(0, 5);

  // ── Data fetching ──────────────────────────────────────────────

  async function fetchWorkflows() {
    loading = true;
    try {
      const statusRes = await fetch("/api/apps/status");
      const statusData = statusRes.ok ? await statusRes.json() : { applications: [] };
      const connectedMap: Record<string, boolean> = {};
      for (const a of statusData.applications || []) {
        if (a.connected) connectedMap[a.id] = true;
      }

      const res = await fetch("/api/apps/lifecycle/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "all", idpSource }),
      });

      if (res.ok) {
        const data = await res.json();
        const apps = data.applications || data.workflows || [];
        if (Array.isArray(apps) && apps.length > 0) {
          workflows = apps.map((a: any) => {
            const name = integrations.find((i) => i.id === a.appId)?.name || humanize(a.appId);
            return {
              appId: a.appId,
              appName: name,
              category: a.category || "productivity",
              connected: !!connectedMap[a.appId] || !!a.connected,
              joiner: Array.isArray(a.joiner) ? toSteps(a.joiner) : [],
              mover: Array.isArray(a.mover) ? toSteps(a.mover) : [],
              leaver: Array.isArray(a.leaver) ? toSteps(a.leaver) : [],
            };
          });
        } else {
          workflows = integrations.map((app) => ({
            appId: app.id,
            appName: app.name,
            category: app.category,
            connected: !!connectedMap[app.id],
            joiner: [],
            mover: [],
            leaver: [],
          }));
        }
      } else {
        workflows = integrations.map((app) => ({
          appId: app.id,
          appName: app.name,
          category: app.category,
          connected: !!connectedMap[app.id],
          joiner: [],
          mover: [],
          leaver: [],
        }));
      }
    } catch {
      workflows = [];
    }
    loading = false;
  }

  async function fetchPolicy() {
    policyLoading = true;
    try {
      const res = await fetch("/api/jml/policy");
      if (res.ok) {
        const data = await res.json();
        if (data.policy) {
          policy = { ...policy, ...data.policy };
          policyOriginal = JSON.stringify(policy);
        }
      }
    } catch {
      // keep defaults
    }
    policyLoading = false;
  }

  async function savePolicy() {
    policySaving = true;
    try {
      const res = await fetch("/api/jml/policy", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(policy),
      });
      if (res.ok) {
        policyOriginal = JSON.stringify(policy);
        pushToast({ message: "JML policy saved", variant: "success" });
      } else {
        pushToast({ message: "Failed to save policy", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to save policy", variant: "error" });
    }
    policySaving = false;
  }

  async function fetchRuns() {
    runsLoading = true;
    try {
      const res = await fetch("/api/jml/runs?limit=200");
      if (res.ok) {
        const data = await res.json();
        runs = data.runs || [];
      }
    } catch {
      runs = [];
    }
    runsLoading = false;
  }

  async function fetchChangelog() {
    changelogLoading = true;
    try {
      const params = new URLSearchParams({
        limit: String(changelogLimit),
        offset: String(changelogOffset),
      });
      if (changelogActionFilter) params.set("action", changelogActionFilter);
      const res = await fetch(`/api/jml/changelog?${params}`);
      if (res.ok) {
        const data = await res.json();
        changelog = data.entries || [];
        changelogTotal = data.total || 0;
      }
    } catch {
      changelog = [];
    }
    changelogLoading = false;
  }

  // ── Actions ────────────────────────────────────────────────────

  function openRunModal(app: AppWorkflow, type: "joiner" | "mover" | "leaver") {
    modalApp = app;
    modalType = type;
    modalEmail = "";
    executionResult = null;
    showModal = true;
  }

  async function executeWorkflow() {
    if (!modalApp || !modalEmail) return;
    executing = true;
    executionResult = null;

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          appId: modalApp.appId,
          type: modalType,
          subjectEmail: modalEmail,
          idpSource,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.steps) {
        executionResult = data;
      } else {
        executionResult = {
          success: false,
          steps: [],
          message: data?.error || "Workflow execution failed",
        };
      }

      if (executionResult?.success) {
        pushToast({ message: `${modalType} workflow completed for ${modalEmail}`, variant: "success" });
        fetchRuns();
      } else {
        pushToast({ message: executionResult?.message || "Workflow execution failed", variant: "error" });
      }
    } catch {
      executionResult = {
        success: false,
        steps: [],
        message: "Workflow execution service unavailable",
      };
      pushToast({ message: "Workflow execution failed", variant: "error" });
    }
    executing = false;
  }

  async function executeBulkWorkflow() {
    if (!bulkEmail) return;
    bulkExecuting = true;
    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: bulkType,
          subjectEmail: bulkEmail,
          idpSource,
          scope: "all",
        }),
      });
      if (res.ok) {
        pushToast({ message: `${bulkType} workflow triggered for ${bulkEmail}`, variant: "success" });
        bulkEmail = "";
        fetchRuns();
      } else {
        pushToast({ message: "Bulk execution failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Bulk execution failed", variant: "error" });
    }
    bulkExecuting = false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  let mounted = false;
  onMount(() => {
    mounted = true;
    fetchWorkflows();
    fetchPolicy();
    fetchRuns();
    fetchChangelog();
  });

  $: if (mounted && idpSource) {
    fetchWorkflows();
  }

  $: if (mounted && (changelogOffset >= 0 || changelogActionFilter !== undefined)) {
    fetchChangelog();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Workflows</h1>
      <p class="text-sm text-muted-foreground">
        Joiner / Mover / Leaver automation and policy configuration
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => { fetchRuns(); fetchChangelog(); fetchWorkflows(); }}>
        <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
        Refresh
      </Button>
    </div>
  </div>

  <!-- Tabs -->
  <Tabs>
    <TabsList>
      <TabsTrigger active={activeTab === "overview"} on:click={() => activeTab = "overview"}>
        <Activity class="h-3.5 w-3.5 mr-1.5" />
        Overview
      </TabsTrigger>
      <TabsTrigger active={activeTab === "policies"} on:click={() => activeTab = "policies"}>
        <Settings class="h-3.5 w-3.5 mr-1.5" />
        Policies
      </TabsTrigger>
      <TabsTrigger active={activeTab === "users"} on:click={() => activeTab = "users"}>
        <Users class="h-3.5 w-3.5 mr-1.5" />
        Users
      </TabsTrigger>
      <TabsTrigger active={activeTab === "activity"} on:click={() => activeTab = "activity"}>
        <Clock class="h-3.5 w-3.5 mr-1.5" />
        Activity
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- ═══════════════════ OVERVIEW TAB ═══════════════════ -->
  {#if activeTab === "overview"}
    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="pt-6">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Total Runs</p>
          <p class="text-2xl font-bold mt-1">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Success Rate</p>
          <p class="text-2xl font-bold mt-1 {stats.successRate >= 90 ? 'text-green-500' : stats.successRate >= 70 ? 'text-warning' : 'text-destructive'}">
            {stats.total > 0 ? `${stats.successRate}%` : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Failed</p>
          <p class="text-2xl font-bold mt-1 {stats.failed > 0 ? 'text-destructive' : ''}">{stats.failed}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">In Progress</p>
          <p class="text-2xl font-bold mt-1 {stats.running > 0 ? 'text-primary' : ''}">{stats.running}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Run counts by type -->
    {#if stats.total > 0}
      <Card>
        <CardContent class="pt-6">
          <p class="text-sm font-medium mb-3">Runs by Type</p>
          <div class="flex flex-wrap gap-3">
            {#each Object.entries(stats.byType) as [type, count]}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-md border {typeColors[type] || 'border-border'}">
                <span class="text-xs font-medium capitalize">{type}</span>
                <span class="text-sm font-bold">{count}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Pipeline status + Quick execute -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- JML Pipeline Status -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-medium">Automation Status</p>
            {#if !policyLoading}
              <Badge variant={policy.enabled ? "success" : "secondary"}>
                {policy.enabled ? "Active" : "Disabled"}
              </Badge>
            {/if}
          </div>
          {#if policyLoading}
            <p class="text-sm text-muted-foreground">Loading policy...</p>
          {:else}
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Auto-Joiner</span>
                <Badge variant={policy.autoJoiner ? "success" : "secondary"} class="text-[10px]">
                  {policy.autoJoiner ? "ON" : "OFF"}
                </Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Auto-Mover</span>
                <Badge variant={policy.autoMover ? "success" : "secondary"} class="text-[10px]">
                  {policy.autoMover ? "ON" : "OFF"}
                </Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Auto-Leaver</span>
                <Badge variant={policy.autoLeaver ? "success" : "secondary"} class="text-[10px]">
                  {policy.autoLeaver ? "ON" : "OFF"}
                </Badge>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Leaver Grace Period</span>
                <span class="text-xs font-medium">
                  {gracePeriodOptions.find((g) => g.ms === policy.leaverGraceMs)?.label || `${policy.leaverGraceMs}ms`}
                </span>
              </div>
            </div>
            <div class="mt-4">
              <Button variant="outline" size="sm" class="w-full" on:click={() => activeTab = "policies"}>
                Configure Policies
              </Button>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Quick Execute -->
      <Card>
        <CardContent class="pt-6">
          <p class="text-sm font-medium mb-4">Quick Execute</p>
          <div class="space-y-3">
            <div class="space-y-1.5">
              <Label>Workflow Type</Label>
              <div class="flex gap-2">
                {#each ["joiner", "mover", "leaver"] as t}
                  <button
                    type="button"
                    class="flex-1 py-2 text-xs font-medium rounded capitalize transition-colors border {bulkType === t
                      ? sectionColors[t]
                      : 'bg-muted text-muted-foreground border-transparent'}"
                    on:click={() => bulkType = t}
                  >
                    {t}
                  </button>
                {/each}
              </div>
            </div>
            <div class="space-y-1.5">
              <Label>Subject Email</Label>
              <Input type="email" bind:value={bulkEmail} placeholder="user@company.com" />
            </div>
            <Button
              class="w-full"
              on:click={executeBulkWorkflow}
              disabled={bulkExecuting || !bulkEmail}
            >
              <Play class="h-3.5 w-3.5 mr-1.5" />
              {bulkExecuting ? "Executing..." : `Run ${bulkType} workflow`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Runs -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium">Recent Runs</p>
          <Button variant="ghost" size="sm" on:click={() => activeTab = "activity"}>View all</Button>
        </div>
        {#if runsLoading}
          <p class="text-sm text-muted-foreground py-4 text-center">Loading runs...</p>
        {:else if recentRuns.length === 0}
          <div class="py-8 text-center">
            <Activity class="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p class="text-sm text-muted-foreground">No workflow runs yet</p>
            <p class="text-xs text-muted-foreground mt-1">Runs will appear here when JML events are processed</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each recentRuns as run}
              <div class="flex items-center justify-between px-3 py-2.5 rounded-md border bg-muted/30">
                <div class="flex items-center gap-3">
                  <Badge variant="outline" class="text-[10px] capitalize {typeColors[run.type]}">
                    {run.type}
                  </Badge>
                  <div>
                    <p class="text-sm font-medium">{run.email || run.user_id}</p>
                    <p class="text-xs text-muted-foreground">
                      {run.trigger === "jml_auto" ? "Auto" : humanize(run.trigger)}
                      {#if run.started_at}
                        &middot; {relTime(run.started_at)}
                      {/if}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  {#if run.steps_total > 0}
                    <div class="w-20">
                      <Progress value={run.steps_done} max={run.steps_total} />
                    </div>
                    <span class="text-[10px] text-muted-foreground w-8 text-right">{run.steps_done}/{run.steps_total}</span>
                  {/if}
                  <span class="text-xs font-medium capitalize {statusColors[run.status]}">{run.status}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

  <!-- ═══════════════════ POLICIES TAB ═══════════════════ -->
  {:else if activeTab === "policies"}
    <div class="grid md:grid-cols-2 gap-6">
      <!-- JML Policy Settings -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-sm font-medium">JML Automation Policy</p>
              <p class="text-xs text-muted-foreground mt-0.5">Control automatic workflow execution for lifecycle events</p>
            </div>
          </div>

          {#if policyLoading}
            <p class="text-sm text-muted-foreground">Loading...</p>
          {:else}
            <div class="space-y-5">
              <!-- Master toggle -->
              <div class="flex items-center justify-between p-3 rounded-lg border {policy.enabled ? 'border-green-500/30 bg-green-500/5' : 'border-border'}">
                <div>
                  <p class="text-sm font-medium">JML Automation</p>
                  <p class="text-xs text-muted-foreground">Enable automatic lifecycle workflow processing</p>
                </div>
                <button type="button" on:click={() => { policy.enabled = !policy.enabled; policy = policy; }}>
                  {#if policy.enabled}
                    <ToggleRight class="w-8 h-8 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-8 h-8 text-muted-foreground" />
                  {/if}
                </button>
              </div>

              <Separator />

              <!-- Auto toggles -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Auto-Joiner</p>
                  <p class="text-xs text-muted-foreground">Automatically provision new employees</p>
                </div>
                <button type="button" on:click={() => togglePolicy("autoJoiner")}>
                  {#if policy.autoJoiner}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Auto-Mover</p>
                  <p class="text-xs text-muted-foreground">Automatically update access on role changes</p>
                </div>
                <button type="button" on:click={() => togglePolicy("autoMover")}>
                  {#if policy.autoMover}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Auto-Leaver</p>
                  <p class="text-xs text-muted-foreground">Automatically deprovision departed employees</p>
                </div>
                <button type="button" on:click={() => togglePolicy("autoLeaver")}>
                  {#if policy.autoLeaver}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>

              <Separator />

              <!-- Leaver grace period -->
              <div class="space-y-1.5">
                <Label>Leaver Grace Period</Label>
                <p class="text-xs text-muted-foreground">Delay before deprovisioning a leaver's access</p>
                <select
                  bind:value={policy.leaverGraceMs}
                  on:change={() => { policy = policy; }}
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {#each gracePeriodOptions as opt}
                    <option value={opt.ms}>{opt.label}</option>
                  {/each}
                </select>
              </div>

              <Separator />

              <!-- Notification & approval toggles -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Require Joiner Approval</p>
                  <p class="text-xs text-muted-foreground">Manager must approve before provisioning</p>
                </div>
                <button type="button" on:click={() => togglePolicy("requireJoinerApproval")}>
                  {#if policy.requireJoinerApproval}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Notify Manager</p>
                  <p class="text-xs text-muted-foreground">Send notifications to the user's manager</p>
                </div>
                <button type="button" on:click={() => togglePolicy("notifyManager")}>
                  {#if policy.notifyManager}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Notify User</p>
                  <p class="text-xs text-muted-foreground">Send notifications to the affected user</p>
                </div>
                <button type="button" on:click={() => togglePolicy("notifyUser")}>
                  {#if policy.notifyUser}
                    <ToggleRight class="w-7 h-7 text-green-500" />
                  {:else}
                    <ToggleLeft class="w-7 h-7 text-muted-foreground" />
                  {/if}
                </button>
              </div>

              <!-- Save -->
              <Button class="w-full" on:click={savePolicy} disabled={policySaving || !policyDirty}>
                <Save class="h-3.5 w-3.5 mr-1.5" />
                {policySaving ? "Saving..." : "Save Policy"}
              </Button>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- IDP Source + Connected Apps summary -->
      <div class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <p class="text-sm font-medium mb-4">Identity Provider</p>
            <div class="space-y-1.5">
              <Label>IDP Source</Label>
              <select
                bind:value={idpSource}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {#each idpSources as src}
                  <option value={src.id}>{src.label}</option>
                {/each}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <p class="text-sm font-medium mb-4">Connected Apps</p>
            {#if loading}
              <p class="text-sm text-muted-foreground">Loading...</p>
            {:else if connectedWorkflows.length === 0}
              <div class="py-4 text-center">
                <Link class="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                <p class="text-xs text-muted-foreground">No connected apps</p>
                <a href="/console/marketplace">
                  <Button variant="outline" size="sm" class="mt-3">Browse Marketplace</Button>
                </a>
              </div>
            {:else}
              <div class="space-y-2">
                {#each connectedWorkflows.slice(0, 8) as app}
                  <div class="flex items-center justify-between py-1.5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded flex items-center justify-center bg-primary/10">
                        <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                        </svg>
                      </div>
                      <span class="text-sm">{app.appName}</span>
                    </div>
                    <div class="flex gap-1">
                      {#each ["joiner", "mover", "leaver"] as t}
                        {#if app[t]?.length > 0}
                          <span class="w-1.5 h-1.5 rounded-full {t === 'joiner' ? 'bg-green-500' : t === 'mover' ? 'bg-primary' : 'bg-destructive'}"></span>
                        {/if}
                      {/each}
                    </div>
                  </div>
                {/each}
                {#if connectedWorkflows.length > 8}
                  <p class="text-xs text-muted-foreground text-center pt-1">
                    +{connectedWorkflows.length - 8} more
                  </p>
                {/if}
              </div>
            {/if}
          </CardContent>
        </Card>
      </div>
    </div>

  <!-- ═══════════════════ USERS TAB ═══════════════════ -->
  {:else if activeTab === "users"}
    <!-- Controls -->
    <div class="flex flex-wrap items-end gap-4">
      <div class="space-y-1.5">
        <Label>IDP Source</Label>
        <select
          bind:value={idpSource}
          class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {#each idpSources as src}
            <option value={src.id}>{src.label}</option>
          {/each}
        </select>
      </div>
      <div class="flex-1 max-w-sm space-y-1.5">
        <Label>Search</Label>
        <Input type="text" bind:value={searchQuery} placeholder="Filter apps..." />
      </div>
    </div>

    {#if loading}
      <div class="text-center py-16 text-muted-foreground">
        <p>Loading workflows...</p>
      </div>
    {:else if !hasConnected}
      <Card class="border-dashed">
        <CardContent class="py-10 text-center">
          <Link class="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p class="text-lg font-semibold mb-1">No connected apps</p>
          <p class="text-sm text-muted-foreground mb-5">Connect applications from the Marketplace to enable JML workflows.</p>
          <a href="/console/marketplace">
            <Button>Browse Marketplace</Button>
          </a>
        </CardContent>
      </Card>
    {:else}
      {#each sections as section}
        {@const apps = filtered.filter((w) => (w[section.type] || []).length > 0)}
        <div>
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 rounded-t-lg border {sectionColors[section.type]}"
            on:click={() => { collapsed[section.type] = !collapsed[section.type]; collapsed = collapsed; }}
          >
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold uppercase tracking-wide">
                {section.label}
              </span>
              <Badge variant="secondary">
                {apps.length} app{apps.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <ChevronDown class="w-4 h-4 transition-transform {collapsed[section.type] ? '' : 'rotate-180'}" />
          </button>

          {#if !collapsed[section.type]}
            <Card class="rounded-t-none border-t-0">
              <CardContent class="p-0">
                {#if apps.length === 0}
                  <div class="px-4 py-6 text-center text-sm text-muted-foreground">
                    No matching apps with {section.label.toLowerCase()} workflows configured
                  </div>
                {:else}
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                          <th class="px-4 py-2.5 font-medium">Application</th>
                          <th class="px-4 py-2.5 font-medium">Category</th>
                          <th class="px-4 py-2.5 font-medium">Steps</th>
                          <th class="px-4 py-2.5 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each apps as app}
                          <tr class="border-t hover:bg-muted/50">
                            <td class="px-4 py-3">
                              <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded flex items-center justify-center bg-primary/10">
                                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                                  </svg>
                                </div>
                                <span class="font-medium">{app.appName}</span>
                              </div>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground capitalize">{app.category}</td>
                            <td class="px-4 py-3">
                              <Badge variant="secondary">{(app[section.type] || []).length} steps</Badge>
                            </td>
                            <td class="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" on:click={() => openRunModal(app, section.type)}>
                                <Play class="h-3 w-3 mr-1" />
                                Run
                              </Button>
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </CardContent>
            </Card>
          {/if}
        </div>
      {/each}
    {/if}

  <!-- ═══════════════════ ACTIVITY TAB ═══════════════════ -->
  {:else if activeTab === "activity"}
    <!-- Runs section -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium">Workflow Runs</p>
          <div class="flex gap-2">
            <select
              bind:value={runsFilter}
              class="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All</option>
              <optgroup label="Status">
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="queued">Queued</option>
              </optgroup>
              <optgroup label="Type">
                <option value="joiner">Joiner</option>
                <option value="mover">Mover</option>
                <option value="leaver">Leaver</option>
                <option value="rehire">Rehire</option>
              </optgroup>
            </select>
            <Button variant="ghost" size="sm" on:click={fetchRuns}>
              <RefreshCw class="h-3 w-3" />
            </Button>
          </div>
        </div>

        {#if runsLoading}
          <p class="text-sm text-muted-foreground py-8 text-center">Loading runs...</p>
        {:else if filteredRuns.length === 0}
          <div class="py-8 text-center">
            <Activity class="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p class="text-sm text-muted-foreground">No workflow runs found</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-3 py-2 font-medium">Type</th>
                  <th class="px-3 py-2 font-medium">User</th>
                  <th class="px-3 py-2 font-medium">Trigger</th>
                  <th class="px-3 py-2 font-medium">Progress</th>
                  <th class="px-3 py-2 font-medium">Duration</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredRuns as run}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-3 py-2.5">
                      <Badge variant="outline" class="text-[10px] capitalize {typeColors[run.type]}">
                        {run.type}
                      </Badge>
                    </td>
                    <td class="px-3 py-2.5">
                      <span class="font-medium">{run.email || run.user_id}</span>
                    </td>
                    <td class="px-3 py-2.5 text-muted-foreground">
                      {run.trigger === "jml_auto" ? "Auto" : humanize(run.trigger)}
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-2">
                        <div class="w-16">
                          <Progress value={run.steps_done} max={run.steps_total || 1} />
                        </div>
                        <span class="text-[10px] text-muted-foreground">{run.steps_done}/{run.steps_total}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-xs text-muted-foreground">
                      {run.duration_ms ? durationStr(run.duration_ms) : "—"}
                    </td>
                    <td class="px-3 py-2.5">
                      <span class="text-xs font-medium capitalize {statusColors[run.status]}">{run.status}</span>
                      {#if run.error}
                        <p class="text-[10px] text-destructive truncate max-w-[150px]" title={run.error}>{run.error}</p>
                      {/if}
                    </td>
                    <td class="px-3 py-2.5 text-xs text-muted-foreground">
                      {run.started_at ? relTime(run.started_at) : "—"}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Changelog section -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium">Directory Changelog</p>
          <div class="flex gap-2">
            <select
              bind:value={changelogActionFilter}
              on:change={() => { changelogOffset = 0; }}
              class="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All actions</option>
              <option value="joiner">Joiner</option>
              <option value="leaver">Leaver</option>
              <option value="mover">Mover</option>
              <option value="rehire">Rehire</option>
            </select>
          </div>
        </div>

        {#if changelogLoading}
          <p class="text-sm text-muted-foreground py-8 text-center">Loading changelog...</p>
        {:else if changelog.length === 0}
          <div class="py-8 text-center">
            <Clock class="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p class="text-sm text-muted-foreground">No changelog entries found</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each changelog as entry}
              <div class="flex items-start justify-between px-3 py-2.5 rounded-md border bg-muted/20">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="mt-0.5">
                    {#if entry.change_type === "created"}
                      <CheckCircle class="w-4 h-4 text-green-500" />
                    {:else if entry.change_type === "deactivated" || entry.change_type === "deleted"}
                      <XCircle class="w-4 h-4 text-destructive" />
                    {:else if entry.change_type === "reactivated"}
                      <RefreshCw class="w-4 h-4 text-blue-500" />
                    {:else}
                      <Activity class="w-4 h-4 text-muted-foreground" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{entry.email || entry.user_id}</p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" class="text-[10px] capitalize">{entry.change_type}</Badge>
                      {#if entry.jml_action}
                        <Badge variant="outline" class="text-[10px] capitalize {typeColors[entry.jml_action]}">
                          {entry.jml_action}
                        </Badge>
                      {/if}
                      <span class="text-[10px] text-muted-foreground">
                        {entry.source === "directory_sync" ? "Directory Sync" : humanize(entry.source)}
                      </span>
                      {#if entry.processed}
                        <span class="text-[10px] text-green-500">Processed</span>
                      {:else}
                        <span class="text-[10px] text-warning">Pending</span>
                      {/if}
                    </div>
                    {#if entry.delta && Object.keys(entry.delta).length > 0}
                      <div class="mt-1.5 flex flex-wrap gap-1">
                        {#each Object.entries(entry.delta).slice(0, 3) as [field, change]}
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {humanize(field)}: {change.old ?? "—"} &rarr; {change.new ?? "—"}
                          </span>
                        {/each}
                        {#if Object.keys(entry.delta).length > 3}
                          <span class="text-[10px] text-muted-foreground">+{Object.keys(entry.delta).length - 3} more</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </div>
                <span class="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {entry.created_at ? relTime(entry.created_at) : ""}
                </span>
              </div>
            {/each}
          </div>

          <!-- Pagination -->
          {#if changelogTotal > changelogLimit}
            <div class="flex items-center justify-between mt-4 pt-4 border-t">
              <p class="text-xs text-muted-foreground">
                Showing {changelogOffset + 1}–{Math.min(changelogOffset + changelogLimit, changelogTotal)} of {changelogTotal}
              </p>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={changelogOffset === 0}
                  on:click={() => { changelogOffset = Math.max(0, changelogOffset - changelogLimit); }}
                >
                  <ChevronLeft class="h-3 w-3 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={changelogOffset + changelogLimit >= changelogTotal}
                  on:click={() => { changelogOffset += changelogLimit; }}
                >
                  Next
                  <ChevronRight class="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          {/if}
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>

<!-- Run Workflow Modal -->
<Dialog open={showModal} onClose={() => showModal = false} title="Run Workflow{modalApp ? ` -- ${modalApp.appName}` : ''}">
  {#if modalApp}
    {#if !executionResult}
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>Workflow Type</Label>
          <div class="flex gap-2">
            {#each ["joiner", "mover", "leaver"] as t}
              <button
                type="button"
                class="flex-1 py-2 text-xs font-medium rounded capitalize transition-colors border {modalType === t
                  ? sectionColors[t]
                  : 'bg-muted text-muted-foreground border-transparent'}"
                on:click={() => modalType = t}
              >
                {t}
              </button>
            {/each}
          </div>
        </div>
        <div class="space-y-1.5">
          <Label>Subject Email</Label>
          <Input type="email" bind:value={modalEmail} placeholder="user@company.com" />
        </div>

        {#if modalApp[modalType]?.length}
          <div>
            <p class="text-xs text-muted-foreground mb-2">Steps ({modalApp[modalType].length})</p>
            <div class="space-y-1">
              {#each modalApp[modalType] as step, i}
                <div class="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted">
                  <span class="font-mono text-[10px] text-muted-foreground shrink-0">{i + 1}.</span>
                  {step.name}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <Button class="w-full" on:click={executeWorkflow} disabled={executing || !modalEmail}>
          {executing ? "Executing..." : `Run ${modalType} workflow`}
        </Button>
      </div>
    {:else}
      <div class="space-y-3">
        <div class="flex items-center gap-2 mb-2">
          {#if executionResult.success}
            <CheckCircle class="w-5 h-5 text-green-500" />
            <span class="text-sm font-medium text-green-500">Workflow completed</span>
          {:else}
            <XCircle class="w-5 h-5 text-destructive" />
            <span class="text-sm font-medium text-destructive">Workflow failed</span>
          {/if}
        </div>
        {#if executionResult.message}
          <p class="text-xs text-muted-foreground">{executionResult.message}</p>
        {/if}
        {#each executionResult.steps as step}
          <div class="flex items-center gap-2 px-3 py-2 rounded bg-muted">
            {#if step.status === "success"}
              <CheckCircle class="w-4 h-4 text-green-500 shrink-0" />
            {:else if step.status === "failed"}
              <XCircle class="w-4 h-4 text-destructive shrink-0" />
            {:else}
              <Minus class="w-4 h-4 text-muted-foreground shrink-0" />
            {/if}
            <span class="text-xs">{step.name}</span>
          </div>
        {/each}
        <DialogFooter>
          <Button variant="secondary" on:click={() => showModal = false}>Close</Button>
        </DialogFooter>
      </div>
    {/if}
  {/if}
</Dialog>
