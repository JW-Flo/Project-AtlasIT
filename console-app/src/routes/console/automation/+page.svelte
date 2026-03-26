<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, iconMap } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";

  // ---- Types ----------------------------------------------------------------
  interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    triggerType: string;
    triggerConfig: Record<string, any>;
    lastRunAt?: string;
    lastStatus?: string;
    runCount: number;
    errorCount: number;
  }

  interface Execution {
    id: string;
    ruleId: string;
    status: string;
    actionsRun: number;
    actionsFailed: number;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
  }

  interface ExecutionDetail extends Execution {
    ruleName: string;
    triggerType?: string;
    triggerEvent: Record<string, any>;
    results: Array<{
      actionType: string;
      status: string;
      message?: string;
      details?: Record<string, any>;
    }>;
  }

  interface HealthCheck {
    appId: string;
    healthy: boolean;
    responseMs?: number;
    checkedAt: string;
  }

  interface ComplianceImpact {
    frameworks: string[];
    controls: { id: string; name: string }[];
    reasoning: string;
  }

  interface Suggestion {
    templateId: string;
    reason: string;
    priority: string;
    ruleInput: any;
    complianceImpact?: ComplianceImpact;
  }

  interface JmlPolicy {
    enabled: boolean;
    autoJoiner: boolean;
    autoLeaver: boolean;
    autoMover: boolean;
    leaverGraceMs: number;
    notifyManager: boolean;
    notifyUser: boolean;
    requireJoinerApproval: boolean;
  }

  interface WorkflowRun {
    id: string;
    type: string;
    user_id: string;
    email: string;
    status: string;
    trigger: string;
    steps_total: number;
    steps_done: number;
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
  }

  interface ActivityItem {
    id: number;
    eventType: string;
    title: string;
    detail: string | null;
    severity: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
  }

  // ---- State ----------------------------------------------------------------
  let activeTab: "overview" | "rules" | "health" | "history" | "jml" | "live" = "overview";
  let loading = true;
  let error: string | null = null;

  let rules: AutomationRule[] = [];
  let executions: Execution[] = [];
  let healthChecks: HealthCheck[] = [];
  let suggestions: Suggestion[] = [];
  let selectedExecution: ExecutionDetail | null = null;
  let loadingDetail = false;

  // JML state
  let jmlPolicy: JmlPolicy | null = null;
  let jmlRuns: WorkflowRun[] = [];
  let jmlSaving = false;

  // Live activity state
  let activities: ActivityItem[] = [];
  let activityPollTimer: ReturnType<typeof setInterval> | null = null;

  // Delete confirmation (P0 #1)
  let showDeleteDialog = false;
  let pendingDeleteRule: AutomationRule | null = null;

  // Search & filter (P3 #13, #15)
  let searchRules = "";
  let searchHistory = "";
  let historyStatusFilter = "";

  // Pagination (P3 #14)
  let historyPage = 1;
  const pageSize = 20;

  // Apply loading (P5 #24)
  let applyingId: string | null = null;

  // NL automation builder
  let showNlDialog = false;
  let nlPrompt = "";
  let nlLoading = false;
  let nlResult: any = null;
  let nlError: string | null = null;

  // Dry-run simulation
  let showSimDialog = false;
  let simLoading = false;
  let simResult: {
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    triggerMatch: boolean;
    conditionResults: Array<{ field: string; operator: string; expected: unknown; actual: unknown; passed: boolean }>;
    actionsPreview: Array<{ type: string; order: number; config: Record<string, any>; interpolated: Record<string, string>; description: string }>;
    complianceImpact: Array<{ framework: string; controls: Array<{ id: string; name: string }> }>;
  } | null = null;
  let simCustomPayload = "";
  let simShowCustom = false;

  // Suggestions error tracking
  let suggestionsError = false;

  // Execution stats
  let execStats: {
    totals: { executions: number; success: number; failed: number; partial: number; avgDurationMs: number };
    topRules: Array<{ ruleId: string; ruleName: string; executions: number; successRate: number }>;
  } | null = null;

  // Compliance mapping for rule detail
  let expandedRuleId: string | null = null;
  let complianceLoading = false;
  let complianceError = false;
  let complianceData: {
    ruleName: string;
    actions: Array<{ type: string; controls: Array<{ framework: string; controlId: string; controlName: string; evidenceType: string }> }>;
    summary: { totalControls: number; frameworks: string[] };
  } | null = null;

  // ---- Data fetching --------------------------------------------------------
  async function fetchAll() {
    loading = true;
    error = null;
    try {
      await Promise.all([fetchRules(), fetchExecutions(), fetchHealth(), fetchSuggestions(), fetchJmlPolicy(), fetchJmlRuns(), fetchActivities(), fetchExecStats()]);
    } catch (e: any) {
      error = e?.message || "Failed to load automation data";
    } finally {
      loading = false;
    }
  }

  async function fetchRules() {
    const res = await fetch("/api/automation/rules");
    if (!res.ok) throw new Error("Failed to load rules");
    const data: any = await res.json();
    rules = data.rules || [];
  }

  async function fetchExecutions() {
    const res = await fetch("/api/automation/executions?limit=100");
    if (!res.ok) throw new Error("Failed to load executions");
    const data: any = await res.json();
    executions = data.executions || [];
  }

  async function fetchHealth() {
    const res = await fetch("/api/automation/health");
    if (!res.ok) throw new Error("Failed to load health data");
    const data: any = await res.json();
    healthChecks = data.checks || [];
  }

  async function fetchSuggestions() {
    suggestionsError = false;
    try {
      const res = await fetch("/api/automation/suggestions");
      if (!res.ok) {
        suggestionsError = true;
        return;
      }
      const data: any = await res.json();
      suggestions = data.suggestions || [];
    } catch {
      suggestionsError = true;
    }
  }

  async function fetchJmlPolicy() {
    try {
      const res = await fetch("/api/jml/policy");
      const data: any = await res.json();
      jmlPolicy = data.policy ?? { enabled: true, autoJoiner: true, autoLeaver: true, autoMover: true, leaverGraceMs: 0, notifyManager: true, notifyUser: false, requireJoinerApproval: false };
    } catch {
      jmlPolicy = { enabled: true, autoJoiner: true, autoLeaver: true, autoMover: true, leaverGraceMs: 0, notifyManager: true, notifyUser: false, requireJoinerApproval: false };
    }
  }

  async function fetchJmlRuns() {
    const res = await fetch("/api/jml/runs?limit=20");
    if (!res.ok) return;
    const data: any = await res.json();
    jmlRuns = data.runs || [];
  }

  async function fetchActivities() {
    const res = await fetch("/api/activity?limit=50");
    if (!res.ok) return;
    const data: any = await res.json();
    activities = data.activities || [];
  }

  async function fetchExecStats() {
    try {
      const res = await fetch("/api/automation/stats?days=30");
      if (res.ok) {
        execStats = await res.json();
      }
    } catch {
      // non-critical
    }
  }

  async function saveJmlPolicy() {
    if (!jmlPolicy) return;
    jmlSaving = true;
    try {
      const res = await fetch("/api/jml/policy", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(jmlPolicy),
      });
      if (res.ok) {
        pushToast({ message: "JML policy updated", variant: "success" });
      }
    } catch {
      pushToast({ message: "Failed to save JML policy", variant: "error" });
    } finally {
      jmlSaving = false;
    }
  }

  function startActivityPoll() {
    if (activityPollTimer) return;
    activityPollTimer = setInterval(async () => {
      const lastId = activities.length > 0 ? activities[0].id : 0;
      const res = await fetch(`/api/activity?after=${lastId}&limit=20`).catch(() => null);
      if (!res?.ok) return;
      const data: any = await res.json();
      if (data.activities?.length > 0) {
        activities = [...data.activities, ...activities].slice(0, 100);
      }
    }, 3000);
  }

  function stopActivityPoll() {
    if (activityPollTimer) {
      clearInterval(activityPollTimer);
      activityPollTimer = null;
    }
  }

  // ---- Actions --------------------------------------------------------------
  async function toggleRule(rule: AutomationRule) {
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (res.ok) {
        rule.enabled = !rule.enabled;
        rules = rules;
        pushToast({ message: `${rule.name} ${rule.enabled ? "enabled" : "paused"}`, variant: "success" });
      }
    } catch {
      pushToast({ message: "Failed to update rule", variant: "error" });
    }
  }

  async function applySuggestion(suggestion: Suggestion) {
    applyingId = suggestion.templateId;
    try {
      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(suggestion.ruleInput),
      });
      if (res.ok) {
        suggestions = suggestions.filter((s) => s !== suggestion);
        await fetchRules();
        pushToast({ message: `"${suggestion.ruleInput.name}" activated`, variant: "success" });
      }
    } catch {
      pushToast({ message: "Failed to create rule", variant: "error" });
    } finally {
      applyingId = null;
    }
  }

  async function dismissSuggestion(suggestion: Suggestion) {
    suggestions = suggestions.filter((s) => s !== suggestion);
    try {
      await fetch("/api/automation/suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: suggestion.templateId }),
      });
    } catch {
      // Dismissal already applied optimistically in UI
    }
  }

  async function runHealthCheck() {
    try {
      const res = await fetch("/api/automation/health", { method: "POST" });
      if (res.ok) {
        await fetchHealth();
        pushToast({ message: "Health check completed", variant: "success" });
      }
    } catch {
      pushToast({ message: "Health check failed", variant: "error" });
    }
  }

  // Delete confirmation flow (P0 #1)
  function requestDeleteRule(rule: AutomationRule) {
    pendingDeleteRule = rule;
    showDeleteDialog = true;
  }

  async function confirmDeleteRule() {
    if (!pendingDeleteRule) return;
    const rule = pendingDeleteRule;
    showDeleteDialog = false;
    pendingDeleteRule = null;
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}`, { method: "DELETE" });
      if (res.ok) {
        rules = rules.filter((r) => r.id !== rule.id);
        pushToast({ message: `"${rule.name}" deleted`, variant: "success" });
      }
    } catch {
      pushToast({ message: "Failed to delete rule", variant: "error" });
    }
  }

  async function duplicateRule(rule: AutomationRule) {
    try {
      const res = await fetch(`/api/automation/rules/${rule.id}/duplicate`, { method: "POST" });
      if (res.ok) {
        await fetchRules();
        pushToast({ message: `"${rule.name}" duplicated`, variant: "success" });
      } else {
        pushToast({ message: "Failed to duplicate rule", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to duplicate rule", variant: "error" });
    }
  }

  async function viewExecution(exec: Execution) {
    loadingDetail = true;
    selectedExecution = null;
    try {
      const res = await fetch(`/api/automation/executions/${exec.id}`);
      if (res.ok) {
        const data: any = await res.json();
        selectedExecution = data.execution;
      } else {
        pushToast({ message: "Failed to load execution details", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to load execution details", variant: "error" });
    } finally {
      loadingDetail = false;
    }
  }

  function closeExecutionDetail() {
    selectedExecution = null;
    loadingDetail = false;
  }

  // ---- Compliance Mapping ---------------------------------------------------
  async function toggleComplianceView(ruleId: string) {
    if (expandedRuleId === ruleId) {
      expandedRuleId = null;
      complianceData = null;
      return;
    }
    expandedRuleId = ruleId;
    complianceLoading = true;
    complianceData = null;
    complianceError = false;
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}/compliance`);
      if (res.ok) {
        complianceData = await res.json();
      } else {
        complianceError = true;
      }
    } catch {
      complianceError = true;
    } finally {
      complianceLoading = false;
    }
  }

  // ---- Dry Run Simulation ---------------------------------------------------
  async function simulateDryRun(ruleId: string) {
    simLoading = true;
    simResult = null;
    simCustomPayload = "";
    simShowCustom = false;
    showSimDialog = true;
    try {
      const res = await fetch("/api/automation/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      if (res.ok) {
        simResult = await res.json();
      } else {
        pushToast({ message: "Simulation failed", variant: "error" });
        showSimDialog = false;
      }
    } catch {
      pushToast({ message: "Simulation request failed", variant: "error" });
      showSimDialog = false;
    } finally {
      simLoading = false;
    }
  }

  async function rerunSimulation() {
    if (!simResult) return;

    let testEvent: { type: string; payload: Record<string, unknown> } | undefined;
    if (simCustomPayload.trim()) {
      try {
        const parsed = JSON.parse(simCustomPayload);
        testEvent = { type: parsed.type || rules.find(r => r.id === simResult!.ruleId)?.triggerType, payload: parsed.payload || parsed };
      } catch {
        pushToast({ message: "Invalid JSON payload", variant: "error" });
        return;
      }
    }

    simLoading = true;
    try {
      const res = await fetch("/api/automation/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ruleId: simResult.ruleId, ...(testEvent ? { testEvent } : {}) }),
      });
      if (res.ok) {
        simResult = await res.json();
      } else {
        pushToast({ message: "Simulation failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Simulation request failed", variant: "error" });
    } finally {
      simLoading = false;
    }
  }

  // ---- NL Builder -----------------------------------------------------------
  async function buildFromNL() {
    if (!nlPrompt.trim() || nlPrompt.length < 5) return;
    nlLoading = true;
    nlError = null;
    nlResult = null;
    try {
      const res = await fetch("/api/automation/nl", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: nlPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        nlError = data.error || "Failed to generate automation";
        return;
      }
      nlResult = data.data;
    } catch {
      nlError = "Request failed. Please try again.";
    } finally {
      nlLoading = false;
    }
  }

  async function applyNlResult() {
    if (!nlResult?.rule) return;
    try {
      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nlResult.rule),
      });
      if (res.ok) {
        pushToast({ message: `Rule "${nlResult.rule.name}" created`, variant: "success" });
        showNlDialog = false;
        nlPrompt = "";
        nlResult = null;
        await fetchRules();
      } else {
        pushToast({ message: "Failed to create rule", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to create rule", variant: "error" });
    }
  }

  // ---- Helpers --------------------------------------------------------------
  function appName(id: string): string {
    return integrations.find((i) => i.id === id)?.name ?? id;
  }

  function triggerLabel(type: string): string {
    const labels: Record<string, string> = {
      user_joined_group: "User joined group",
      user_left_group: "User left group",
      user_created: "New user detected",
      user_deactivated: "User deactivated",
      app_connected: "App connected",
      app_disconnected: "App disconnected",
      app_health_changed: "App health changed",
      schedule: "Scheduled",
      compliance_score_changed: "Compliance score changed",
    };
    return labels[type] ?? type;
  }

  function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
    if (status === "success") return "success";
    if (status === "partial") return "warning";
    if (status === "failed") return "destructive";
    return "secondary";
  }

  function priorityVariant(p: string): "destructive" | "warning" | "default" {
    if (p === "high") return "destructive";
    if (p === "medium") return "warning";
    return "default";
  }

  function actionTypeLabel(type: string): string {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ---- Reactive -------------------------------------------------------------
  $: activeRules = rules.filter((r) => r.enabled);
  $: totalExecutions = rules.reduce((sum, r) => sum + r.runCount, 0);
  $: healthyCount = healthChecks.filter((h) => h.healthy).length;
  $: unhealthyCount = healthChecks.filter((h) => !h.healthy).length;

  // Filtered rules (P3 #15)
  $: filteredRules = searchRules
    ? rules.filter((r) =>
        r.name.toLowerCase().includes(searchRules.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(searchRules.toLowerCase())
      )
    : rules;

  // Filtered executions (P3 #13)
  $: filteredExecutions = executions.filter((e) => {
    if (historyStatusFilter && e.status !== historyStatusFilter) return false;
    if (searchHistory) {
      const rule = rules.find((r) => r.id === e.ruleId);
      const name = rule?.name ?? e.ruleId;
      if (!name.toLowerCase().includes(searchHistory.toLowerCase())) return false;
    }
    return true;
  });

  // Pagination (P3 #14)
  $: totalHistoryPages = Math.max(1, Math.ceil(filteredExecutions.length / pageSize));
  $: pagedExecutions = filteredExecutions.slice((historyPage - 1) * pageSize, historyPage * pageSize);
  $: if (historyPage > totalHistoryPages) historyPage = totalHistoryPages;

  $: if (activeTab === "live") { startActivityPoll(); } else { stopActivityPoll(); }

  onMount(() => {
    fetchAll();
    return () => stopActivityPoll();
  });
</script>

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <!-- Header (P2 #11, #12) -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Automation</h1>
      <p class="text-sm text-muted-foreground">
        Automated environment management for your connected apps
      </p>
    </div>
    <Button variant="outline" size="sm" on:click={runHealthCheck}>Run Health Check</Button>
  </div>

  <!-- Tabs (P1 #7, P2 #10) -->
  <div class="flex gap-1 border-b mb-6">
    {#each [
      { id: "overview", label: "Overview" },
      { id: "jml", label: "JML" },
      { id: "live", label: "Live Feed" },
      { id: "rules", label: "Rules" },
      { id: "health", label: "Environment Health" },
      { id: "history", label: "History" },
    ] as tab}
      <button
        type="button"
        on:click={() => (activeTab = tab.id)}
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === tab.id
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Loading skeleton (P1 #4) -->
  {#if loading}
    <div class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each [1, 2, 3, 4] as _}
          <Skeleton class="h-20 rounded-lg" />
        {/each}
      </div>
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>

  <!-- Error state (P1 #5) -->
  {:else if error}
    <Alert variant="destructive">
      <p class="font-medium">Something went wrong</p>
      <p class="text-sm mt-1">{error}</p>
      <Button variant="outline" size="sm" class="mt-3" on:click={fetchAll}>Retry</Button>
    </Alert>

  {:else if activeTab === "overview"}
    <!-- Stats (P4 #18) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent class="pt-4 pb-4">
          <div class="text-xs text-muted-foreground mb-1">Active Rules</div>
          <div class="text-2xl font-semibold">{activeRules.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4">
          <div class="text-xs text-muted-foreground mb-1">Total Executions</div>
          <div class="text-2xl font-semibold">{totalExecutions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4">
          <div class="text-xs text-muted-foreground mb-1">Apps Healthy</div>
          <div class="text-2xl font-semibold"><Badge variant="success">{healthyCount}</Badge></div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-4 pb-4">
          <div class="text-xs text-muted-foreground mb-1">Apps Unhealthy</div>
          <div class="text-2xl font-semibold">
            {#if unhealthyCount > 0}
              <Badge variant="destructive">{unhealthyCount}</Badge>
            {:else}
              <Badge variant="success">{unhealthyCount}</Badge>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Execution Stats (30-day) -->
    {#if execStats && execStats.totals.executions > 0}
      <Card class="mb-6">
        <CardHeader class="flex-row items-center justify-between">
          <CardTitle class="text-sm">30-Day Execution Summary</CardTitle>
          <div class="text-xs text-muted-foreground">
            Avg duration: {execStats.totals.avgDurationMs}ms
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <div class="text-lg font-semibold text-green-500">{execStats.totals.success}</div>
              <div class="text-xs text-muted-foreground">Succeeded</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-red-500">{execStats.totals.failed}</div>
              <div class="text-xs text-muted-foreground">Failed</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-yellow-500">{execStats.totals.partial}</div>
              <div class="text-xs text-muted-foreground">Partial</div>
            </div>
          </div>
          {#if execStats.topRules.length > 0}
            <div class="border-t pt-3">
              <div class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Most Active Rules</div>
              <div class="space-y-1.5">
                {#each execStats.topRules as tr}
                  <div class="flex items-center justify-between text-sm">
                    <span class="truncate">{tr.ruleName}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs text-muted-foreground">{tr.executions} runs</span>
                      <Badge variant={tr.successRate >= 0.9 ? "success" : tr.successRate >= 0.5 ? "warning" : "destructive"}>
                        {Math.round(tr.successRate * 100)}%
                      </Badge>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
    {/if}

    <!-- Suggestions (P3 #17, P5 #22, #24) -->
    {#if suggestionsError}
      <div class="mb-6">
        <h2 class="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Recommended Automations</h2>
        <Card class="border-dashed border-destructive/30">
          <CardContent class="py-6 text-center">
            <p class="text-sm text-destructive">Failed to load suggestions.</p>
            <button class="text-xs text-muted-foreground hover:text-primary mt-1 underline" on:click={fetchSuggestions}>Retry</button>
          </CardContent>
        </Card>
      </div>
    {:else if suggestions.length > 0}
      <div class="mb-6">
        <h2 class="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Recommended Automations</h2>
        <div class="space-y-2">
          {#each suggestions.slice(0, 5) as suggestion}
            <Card>
              <CardContent class="py-3 px-4">
                <div class="flex items-center gap-4">
                  <Badge variant={priorityVariant(suggestion.priority)} class="shrink-0 capitalize">{suggestion.priority}</Badge>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{suggestion.ruleInput.name}</div>
                    <div class="text-xs text-muted-foreground mt-0.5 truncate">{suggestion.reason}</div>
                    {#if suggestion.ruleInput.description || suggestion.ruleInput.triggerType}
                      <div class="flex items-center gap-2 mt-1">
                        {#if suggestion.ruleInput.triggerType}
                          <Badge variant="outline" class="text-[10px]">{triggerLabel(suggestion.ruleInput.triggerType)}</Badge>
                        {/if}
                        {#if suggestion.ruleInput.actions?.length}
                          <span class="text-[10px] text-muted-foreground">{suggestion.ruleInput.actions.length} action{suggestion.ruleInput.actions.length !== 1 ? "s" : ""}</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      on:click={() => applySuggestion(suggestion)}
                      disabled={applyingId === suggestion.templateId}
                    >
                      {applyingId === suggestion.templateId ? "Enabling..." : "Enable"}
                    </Button>
                    <Button variant="ghost" size="sm" on:click={() => dismissSuggestion(suggestion)}>Dismiss</Button>
                  </div>
                </div>
                {#if suggestion.complianceImpact}
                  <div class="mt-2.5 pt-2.5 border-t border-border/50">
                    <div class="flex items-center gap-1.5 mb-1">
                      <svg class="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span class="text-[11px] font-medium text-primary">Compliance Impact</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-1.5">
                      {#each suggestion.complianceImpact.frameworks as fw}
                        <Badge variant="outline" class="text-[10px]">{fw}</Badge>
                      {/each}
                      {#each suggestion.complianceImpact.controls.slice(0, 3) as ctrl}
                        <Badge variant="secondary" class="text-[10px]">{ctrl.id}</Badge>
                      {/each}
                      {#if suggestion.complianceImpact.controls.length > 3}
                        <span class="text-[10px] text-muted-foreground">+{suggestion.complianceImpact.controls.length - 3} more</span>
                      {/if}
                    </div>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">{suggestion.complianceImpact.reasoning}</p>
                  </div>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recent Activity (P3 #16, P5 #23, #25) -->
    {#if executions.length > 0}
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</h2>
          <Button variant="link" size="sm" on:click={() => (activeTab = "history")}>View all activity</Button>
        </div>
        <Card>
          <CardContent class="p-0">
            {#each executions.slice(0, 8) as exec}
              {@const rule = rules.find((r) => r.id === exec.ruleId)}
              <button
                type="button"
                class="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                on:click={() => viewExecution(exec)}
              >
                <span class="w-2 h-2 rounded-full shrink-0" title={exec.status}>
                  <Badge variant={statusVariant(exec.status)} class="w-2 h-2 p-0 rounded-full block">&nbsp;</Badge>
                </span>
                <div class="flex-1 min-w-0">
                  <span class="text-sm">{rule?.name ?? exec.ruleId}</span>
                  <span class="text-xs text-muted-foreground ml-2">{exec.actionsRun} action{exec.actionsRun !== 1 ? "s" : ""}</span>
                </div>
                <span class="text-xs text-muted-foreground shrink-0" title={new Date(exec.startedAt).toLocaleString()}>{timeAgo(exec.startedAt)}</span>
              </button>
            {/each}
          </CardContent>
        </Card>
      </div>
    {:else}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <p class="text-sm text-muted-foreground">No automation activity yet. Enable a suggested rule to get started.</p>
        </CardContent>
      </Card>
    {/if}

  {:else if activeTab === "jml"}
    <!-- JML (Joiner/Mover/Leaver) — zero-config lifecycle automation -->
    <div class="space-y-6">
      <!-- JML Policy -->
      {#if jmlPolicy}
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Automation Policy</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <p class="text-sm text-muted-foreground">
              JML automatically provisions and revokes app access when users join, move between teams, or leave. No rules needed — it uses your group-to-app mappings.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {#each [
                { key: "enabled", label: "JML Enabled", desc: "Master switch for automatic lifecycle automation" },
                { key: "autoJoiner", label: "Auto-Joiner", desc: "Provision apps when new user detected" },
                { key: "autoLeaver", label: "Auto-Leaver", desc: "Revoke access when user deactivated" },
                { key: "autoMover", label: "Auto-Mover", desc: "Re-provision when department/group changes" },
                { key: "notifyManager", label: "Notify Manager", desc: "Send Slack notification to manager" },
                { key: "notifyUser", label: "Notify User", desc: "Send notification to the user" },
              ] as toggle}
                <div class="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div class="text-sm font-medium">{toggle.label}</div>
                    <div class="text-xs text-muted-foreground">{toggle.desc}</div>
                  </div>
                  <button
                    type="button"
                    on:click={() => { if (jmlPolicy) { jmlPolicy[toggle.key] = !jmlPolicy[toggle.key]; jmlPolicy = jmlPolicy; } }}
                    class="w-10 h-6 rounded-full relative transition-colors shrink-0"
                    style="background: {jmlPolicy[toggle.key] ? 'hsl(var(--primary))' : 'hsl(var(--muted))'};"
                    role="switch"
                    aria-checked={jmlPolicy[toggle.key]}
                  >
                    <span
                      class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style="left: {jmlPolicy[toggle.key] ? '22px' : '4px'};"
                    ></span>
                  </button>
                </div>
              {/each}
            </div>
            <!-- Leaver Grace Period -->
            <div class="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div class="text-sm font-medium">Leaver Grace Period</div>
                <div class="text-xs text-muted-foreground">Delay before leaver workflow executes after user deactivation</div>
              </div>
              <select
                bind:value={jmlPolicy.leaverGraceMs}
                class="flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>Immediate</option>
                <option value={3600000}>1 hour</option>
                <option value={86400000}>24 hours</option>
                <option value={604800000}>7 days</option>
              </select>
            </div>

            <div class="flex justify-end pt-2">
              <Button size="sm" on:click={saveJmlPolicy} disabled={jmlSaving}>
                {jmlSaving ? "Saving..." : "Save Policy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      {:else}
        <Card class="border-dashed">
          <CardContent class="py-12 text-center">
            <p class="text-sm text-muted-foreground">JML policy loading...</p>
          </CardContent>
        </Card>
      {/if}

      <!-- Recent JML Workflow Runs -->
      <div>
        <h2 class="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Recent Lifecycle Workflows</h2>
        {#if jmlRuns.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-8 text-center">
              <p class="text-sm text-muted-foreground">No JML workflows yet. They'll appear here when user lifecycle events are detected.</p>
            </CardContent>
          </Card>
        {:else}
          <Card>
            <CardContent class="p-0">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                      <th class="px-4 py-3 font-medium">Type</th>
                      <th class="px-4 py-3 font-medium">User</th>
                      <th class="px-4 py-3 font-medium">Status</th>
                      <th class="px-4 py-3 font-medium">Steps</th>
                      <th class="px-4 py-3 font-medium text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each jmlRuns as run}
                      <tr class="border-t hover:bg-muted/50 transition-colors">
                        <td class="px-4 py-3">
                          <Badge variant={run.type === "leaver" ? "destructive" : run.type === "mover" ? "warning" : "success"} class="capitalize">{run.type}</Badge>
                        </td>
                        <td class="px-4 py-3">{run.email ?? run.user_id ?? "-"}</td>
                        <td class="px-4 py-3"><Badge variant={statusVariant(run.status)} class="capitalize">{run.status}</Badge></td>
                        <td class="px-4 py-3 text-muted-foreground">{run.steps_done}/{run.steps_total}</td>
                        <td class="px-4 py-3 text-right">
                          <span class="text-muted-foreground" title={new Date(run.started_at).toLocaleString()}>{timeAgo(run.started_at)}</span>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        {/if}
      </div>
    </div>

  {:else if activeTab === "live"}
    <!-- Live Activity Feed -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-sm text-muted-foreground">Live — polling every 3s</span>
        </div>
        <Button variant="outline" size="sm" on:click={fetchActivities}>Refresh</Button>
      </div>

      {#if activities.length === 0}
        <Card class="border-dashed">
          <CardContent class="py-12 text-center">
            <p class="text-sm text-muted-foreground">No activity yet. Events will appear here in real-time as automations execute.</p>
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-1">
          {#each activities as activity}
            <Card>
              <CardContent class="flex items-start gap-3 py-3 px-4">
                <span class="mt-1 w-2 h-2 rounded-full shrink-0" class:bg-green-500={activity.severity === "success"} class:bg-blue-500={activity.severity === "info"} class:bg-yellow-500={activity.severity === "warning"} class:bg-red-500={activity.severity === "error"}></span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">{activity.title}</div>
                  {#if activity.detail}
                    <div class="text-xs text-muted-foreground mt-0.5">{activity.detail}</div>
                  {/if}
                  <div class="flex items-center gap-2 mt-1">
                    <Badge variant="outline" class="text-[10px]">{activity.eventType}</Badge>
                    {#if activity.entityType}
                      <span class="text-[10px] text-muted-foreground">{activity.entityType}</span>
                    {/if}
                  </div>
                </div>
                <span class="text-xs text-muted-foreground shrink-0 whitespace-nowrap" title={new Date(activity.createdAt).toLocaleString()}>{timeAgo(activity.createdAt)}</span>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    </div>

  {:else if activeTab === "rules"}
    <!-- Rules header with NL builder -->
    <div class="flex items-center justify-between mb-4">
      {#if rules.length > 0}
        <Input placeholder="Search rules by name or description..." bind:value={searchRules} class="max-w-sm" />
      {:else}
        <div></div>
      {/if}
      <Button variant="outline" size="sm" on:click={() => { showNlDialog = true; nlResult = null; nlError = null; }}>
        Create from Text
      </Button>
    </div>

    {#if rules.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <p class="text-lg font-semibold mb-1">No automation rules</p>
          <p class="text-sm text-muted-foreground">
            {suggestions.length > 0 ? "Check the Overview tab for recommended automations." : "Connect apps and set up directory mappings to get automation suggestions."}
          </p>
        </CardContent>
      </Card>
    {:else if filteredRules.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <p class="text-sm text-muted-foreground">No rules match "{searchRules}"</p>
        </CardContent>
      </Card>
    {:else}
      <div class="space-y-2">
        {#each filteredRules as rule}
          <Card>
            <CardContent class="py-3 px-4">
              <div class="flex items-center gap-4">
                <!-- Toggle (P1 #8) -->
                <button
                  type="button"
                  on:click={() => toggleRule(rule)}
                  class="w-10 h-6 rounded-full relative transition-colors shrink-0"
                  style="background: {rule.enabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))'};"
                  aria-label="Toggle {rule.name}"
                  aria-checked={rule.enabled}
                  role="switch"
                >
                  <span
                    class="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                    style="left: {rule.enabled ? '22px' : '4px'};"
                  ></span>
                </button>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium" class:text-muted-foreground={!rule.enabled}>{rule.name}</div>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline">{triggerLabel(rule.triggerType)}</Badge>
                    {#if rule.lastRunAt}
                      <span class="text-xs text-muted-foreground" title={new Date(rule.lastRunAt).toLocaleString()}>Last: {timeAgo(rule.lastRunAt)}</span>
                    {/if}
                    {#if rule.runCount > 0}
                      <span class="text-xs text-muted-foreground">{rule.runCount} run{rule.runCount !== 1 ? "s" : ""}</span>
                    {/if}
                    {#if rule.lastStatus}
                      <Badge variant={statusVariant(rule.lastStatus)} class="capitalize">{rule.lastStatus}</Badge>
                    {/if}
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center justify-center h-10 px-2.5 rounded-md text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-muted-foreground"
                  on:click={() => simulateDryRun(rule.id)}
                  title="Preview what this rule would do"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Dry Run
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-muted-foreground"
                  on:click={() => duplicateRule(rule)}
                  title="Duplicate rule"
                  aria-label="Duplicate {rule.name}"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  on:click={() => requestDeleteRule(rule)}
                  aria-label="Delete {rule.name}"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
              <div class="flex items-center gap-2 mt-2 ml-14">
                {#if rule.description}
                  <p class="text-xs text-muted-foreground flex-1">{rule.description}</p>
                {/if}
                <button
                  type="button"
                  class="text-[11px] text-muted-foreground hover:text-primary transition-colors shrink-0"
                  on:click={() => toggleComplianceView(rule.id)}
                >
                  {expandedRuleId === rule.id ? "Hide" : "Show"} Compliance Coverage
                </button>
              </div>

              {#if expandedRuleId === rule.id}
                <div class="mt-3 ml-14 p-3 rounded-md bg-muted/50 border border-border/50">
                  {#if complianceLoading}
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <Skeleton class="h-3 w-3 rounded-full" /> Loading compliance data...
                    </div>
                  {:else if complianceData}
                    <div class="space-y-3">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-medium">{complianceData.summary.totalControls} control{complianceData.summary.totalControls !== 1 ? 's' : ''} covered</span>
                        {#each complianceData.summary.frameworks as fw}
                          <Badge variant="outline" class="text-[10px]">{fw}</Badge>
                        {/each}
                      </div>
                      {#each complianceData.actions as action}
                        {#if action.controls.length > 0}
                          <div>
                            <div class="text-[11px] font-medium text-muted-foreground mb-1">{triggerLabel(action.type) || action.type.replace(/_/g, ' ')}</div>
                            <div class="flex flex-wrap gap-1">
                              {#each action.controls as ctrl}
                                <span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] bg-background" title="{ctrl.controlName} ({ctrl.evidenceType})">
                                  <span class="font-medium">{ctrl.framework}</span>
                                  <span class="text-muted-foreground">{ctrl.controlId}</span>
                                </span>
                              {/each}
                            </div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {:else if complianceError}
                    <p class="text-xs text-destructive">Failed to load compliance data. <button class="underline hover:text-destructive/80" on:click={() => toggleComplianceView(expandedRuleId || '')}>Retry</button></p>
                  {:else}
                    <p class="text-xs text-muted-foreground">No compliance data available for this rule.</p>
                  {/if}
                </div>
              {/if}
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "health"}
    <!-- Environment Health (P4 #19) -->
    {#if healthChecks.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <p class="text-sm text-muted-foreground">No health data yet. Click "Run Health Check" to check your connected apps.</p>
        </CardContent>
      </Card>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each healthChecks as check}
          <Card>
            <CardContent class="flex items-center gap-4 py-3 px-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center {check.healthy ? 'bg-green-500/15' : 'bg-red-500/15'}">
                {#if check.healthy}
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {:else}
                  <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{appName(check.appId)}</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <Badge variant={check.healthy ? "success" : "destructive"}>{check.healthy ? "Healthy" : "Unhealthy"}</Badge>
                  {#if check.responseMs}
                    <span class="text-xs text-muted-foreground">{check.responseMs}ms</span>
                  {/if}
                  <span class="text-xs text-muted-foreground" title={new Date(check.checkedAt).toLocaleString()}>{timeAgo(check.checkedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "history"}
    <!-- History search + filter (P3 #13) -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <Input placeholder="Search by rule name..." bind:value={searchHistory} class="max-w-xs" />
      <select
        bind:value={historyStatusFilter}
        class="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        on:change={() => (historyPage = 1)}
      >
        <option value="">All statuses</option>
        <option value="success">Success</option>
        <option value="partial">Partial</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    {#if filteredExecutions.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <p class="text-sm text-muted-foreground">
            {executions.length === 0 ? "No automation activity yet." : "No results match your filters."}
          </p>
        </CardContent>
      </Card>
    {:else}
      <!-- Table (P4 #20, P0 #2) -->
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Rule</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                  <th class="px-4 py-3 font-medium">Duration</th>
                  <th class="px-4 py-3 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {#each pagedExecutions as exec}
                  {@const rule = rules.find((r) => r.id === exec.ruleId)}
                  <tr
                    class="border-t hover:bg-muted/50 transition-colors cursor-pointer"
                    on:click={() => viewExecution(exec)}
                    tabindex="0"
                    on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); viewExecution(exec); } }}
                  >
                    <td class="px-4 py-3">{rule?.name ?? "Unknown rule"}</td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(exec.status)} class="capitalize">{exec.status}</Badge>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {exec.actionsRun}{exec.actionsFailed > 0 ? ` (${exec.actionsFailed} failed)` : ""}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {exec.durationMs ? `${exec.durationMs}ms` : "-"}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <span class="text-muted-foreground" title={new Date(exec.startedAt).toLocaleString()}>{timeAgo(exec.startedAt)}</span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Pagination (P3 #14) -->
      {#if totalHistoryPages > 1}
        <div class="flex items-center justify-between mt-4">
          <span class="text-sm text-muted-foreground">
            {filteredExecutions.length} result{filteredExecutions.length !== 1 ? "s" : ""} — page {historyPage} of {totalHistoryPages}
          </span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" disabled={historyPage <= 1} on:click={() => (historyPage -= 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={historyPage >= totalHistoryPages} on:click={() => (historyPage += 1)}>Next</Button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}

  <!-- Delete Confirmation Dialog (P0 #1, #3) -->
  <Dialog open={showDeleteDialog} onClose={() => { showDeleteDialog = false; pendingDeleteRule = null; }}>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Delete Rule</h3>
      {#if pendingDeleteRule}
        <p class="text-sm text-muted-foreground">
          Are you sure you want to delete <strong class="text-foreground">{pendingDeleteRule.name}</strong>? This action cannot be undone.
        </p>
      {/if}
      <DialogFooter>
        <Button variant="outline" on:click={() => { showDeleteDialog = false; pendingDeleteRule = null; }}>Cancel</Button>
        <Button variant="destructive" on:click={confirmDeleteRule}>Delete</Button>
      </DialogFooter>
    </div>
  </Dialog>

  <!-- Execution Detail Dialog (P0 #3, P1 #6, P4 #21, P5 #23, #26) -->
  <Dialog open={loadingDetail || selectedExecution !== null} onClose={closeExecutionDetail} title="Execution Detail">
    {#if loadingDetail}
      <div class="space-y-3">
        <Skeleton class="h-5 w-48" />
        <Skeleton class="h-4 w-32" />
        <div class="grid grid-cols-2 gap-3">
          <Skeleton class="h-12" />
          <Skeleton class="h-12" />
          <Skeleton class="h-12" />
          <Skeleton class="h-12" />
        </div>
        <Skeleton class="h-24" />
      </div>
    {:else if selectedExecution}
      <!-- Rule + Trigger -->
      <div class="mb-4">
        <div class="text-sm font-medium">{selectedExecution.ruleName}</div>
        {#if selectedExecution.triggerType}
          <Badge variant="outline" class="mt-1">{triggerLabel(selectedExecution.triggerType)}</Badge>
        {/if}
      </div>

      <!-- Status + Timing -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div class="text-xs text-muted-foreground mb-0.5">Status</div>
          <Badge variant={statusVariant(selectedExecution.status)} class="capitalize">{selectedExecution.status}</Badge>
        </div>
        <div>
          <div class="text-xs text-muted-foreground mb-0.5">Duration</div>
          <span class="text-sm">{selectedExecution.durationMs ? `${selectedExecution.durationMs}ms` : "-"}</span>
        </div>
        <div>
          <div class="text-xs text-muted-foreground mb-0.5">Started</div>
          <span class="text-xs">{new Date(selectedExecution.startedAt).toLocaleString()}</span>
        </div>
        <div>
          <div class="text-xs text-muted-foreground mb-0.5">Completed</div>
          <span class="text-xs">{selectedExecution.completedAt ? new Date(selectedExecution.completedAt).toLocaleString() : "-"}</span>
        </div>
      </div>

      <!-- Action Results -->
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Action Results</div>
        {#if selectedExecution.results && selectedExecution.results.length > 0}
          <div class="space-y-2">
            {#each selectedExecution.results as result}
              <Card>
                <CardContent class="py-2 px-3">
                  <div class="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant(result.status)} class="capitalize">{result.status}</Badge>
                    <span class="text-xs font-medium">{actionTypeLabel(result.actionType)}</span>
                  </div>
                  {#if result.message}
                    <div class="text-xs text-muted-foreground mt-1">{result.message}</div>
                  {/if}
                </CardContent>
              </Card>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">No action results recorded.</p>
        {/if}
      </div>
    {/if}
  </Dialog>

  <!-- Dry Run Simulation Dialog -->
  <Dialog open={showSimDialog} onClose={() => { showSimDialog = false; simResult = null; }} title="Dry Run Simulation">
    {#if simLoading}
      <div class="space-y-3">
        <Skeleton class="h-5 w-48" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-24" />
      </div>
    {:else if simResult}
      <div class="space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Overall Result -->
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full flex items-center justify-center {simResult.triggered ? 'bg-green-500/15' : 'bg-yellow-500/15'}">
            {#if simResult.triggered}
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {:else}
              <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            {/if}
          </div>
          <div>
            <div class="text-sm font-semibold">{simResult.ruleName}</div>
            <div class="text-xs {simResult.triggered ? 'text-green-500' : 'text-yellow-500'}">
              {simResult.triggered ? "Rule would fire" : "Rule would NOT fire"}
            </div>
            {#if simResult.enabled === false}
              <div class="text-[10px] text-muted-foreground mt-0.5">Note: This rule is currently disabled</div>
            {/if}
          </div>
        </div>

        <!-- Trigger Match -->
        <div>
          <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Trigger</div>
          <div class="flex items-center gap-2 text-sm">
            {#if simResult.triggerMatch}
              <span class="text-green-500">&#10003;</span> Trigger type matched
            {:else}
              <span class="text-red-500">&#10007;</span> Trigger type did not match
            {/if}
          </div>
        </div>

        <!-- Conditions -->
        {#if simResult.conditionResults.length > 0}
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Conditions</div>
            <div class="space-y-1.5">
              {#each simResult.conditionResults as cond}
                <div class="flex items-start gap-2 text-sm rounded-md border px-3 py-2 {cond.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}">
                  <span class="mt-0.5 shrink-0 {cond.passed ? 'text-green-500' : 'text-red-500'}">{cond.passed ? '&#10003;' : '&#10007;'}</span>
                  <div class="min-w-0">
                    <div class="font-medium text-xs">{cond.field} <span class="text-muted-foreground">{cond.operator}</span> {JSON.stringify(cond.expected)}</div>
                    <div class="text-xs text-muted-foreground mt-0.5">Actual: <code class="bg-muted px-1 rounded">{JSON.stringify(cond.actual) ?? 'undefined'}</code></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Conditions</div>
            <p class="text-xs text-muted-foreground">No conditions configured — rule fires on trigger match alone.</p>
          </div>
        {/if}

        <!-- Actions Preview -->
        {#if simResult.actionsPreview.length > 0}
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Actions {simResult.triggered ? '(would execute)' : '(would not execute)'}</div>
            <div class="space-y-1.5">
              {#each simResult.actionsPreview as action, i}
                <div class="flex items-center gap-3 rounded-md border px-3 py-2">
                  <span class="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">{action.description}</div>
                    <Badge variant="outline" class="text-[10px] mt-1">{action.type.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Compliance Impact -->
        {#if simResult.complianceImpact.length > 0}
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Compliance Evidence Generated</div>
            <div class="space-y-2">
              {#each simResult.complianceImpact as fw}
                <div>
                  <Badge variant="outline" class="text-[10px] mb-1">{fw.framework}</Badge>
                  <div class="flex flex-wrap gap-1 ml-1">
                    {#each fw.controls as ctrl}
                      <span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] bg-background" title={ctrl.name}>
                        {ctrl.id}
                      </span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Custom Event Payload -->
        <div>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-primary transition-colors"
            on:click={() => simShowCustom = !simShowCustom}
          >
            {simShowCustom ? 'Hide' : 'Show'} custom test event
          </button>
          {#if simShowCustom}
            <div class="mt-2 space-y-2">
              <textarea
                bind:value={simCustomPayload}
                placeholder='{"type": "user_created", "payload": {"email": "test@example.com", "displayName": "Test User"}}'
                class="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              ></textarea>
              <Button size="sm" variant="outline" on:click={rerunSimulation} disabled={simLoading}>
                {simLoading ? 'Simulating...' : 'Re-run with custom event'}
              </Button>
            </div>
          {/if}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" on:click={() => { showSimDialog = false; simResult = null; }}>Close</Button>
      </DialogFooter>
    {/if}
  </Dialog>

  <!-- NL Automation Builder Dialog -->
  <Dialog open={showNlDialog} onClose={() => { showNlDialog = false; nlResult = null; nlError = null; }} title="Create Automation from Text">
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Describe what you want to automate in plain English. AtlasIT will generate the rule for you.</p>
      <div>
        <textarea
          bind:value={nlPrompt}
          placeholder="e.g. When a user is deactivated in the directory, revoke their access to all connected apps and notify the security team on Slack"
          class="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          disabled={nlLoading}
        ></textarea>
      </div>

      {#if nlError}
        <Alert variant="destructive">
          <p class="text-sm">{nlError}</p>
        </Alert>
      {/if}

      {#if nlResult}
        <Card>
          <CardHeader>
            <CardTitle class="text-sm">Generated Rule</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div>
              <div class="text-xs text-muted-foreground">Name</div>
              <div class="text-sm font-medium">{nlResult.rule?.name || "Unnamed rule"}</div>
            </div>
            {#if nlResult.rule?.description}
              <div>
                <div class="text-xs text-muted-foreground">Description</div>
                <div class="text-sm">{nlResult.rule.description}</div>
              </div>
            {/if}
            <div class="flex items-center gap-2">
              <Badge variant="outline">{triggerLabel(nlResult.rule?.triggerType || "")}</Badge>
              <span class="text-xs text-muted-foreground">{nlResult.rule?.actions?.length || 0} action(s)</span>
            </div>
            {#if nlResult.complianceControls && nlResult.complianceControls.length > 0}
              <div>
                <div class="text-xs text-muted-foreground mb-1">Compliance Controls Covered</div>
                <div class="flex flex-wrap gap-1">
                  {#each nlResult.complianceControls as control}
                    <Badge variant="secondary" class="text-[10px]">{control}</Badge>
                  {/each}
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>
      {/if}

      <DialogFooter>
        <Button variant="outline" on:click={() => { showNlDialog = false; nlResult = null; nlError = null; }}>Cancel</Button>
        {#if nlResult}
          <Button on:click={applyNlResult}>Create Rule</Button>
        {:else}
          <Button on:click={buildFromNL} disabled={nlLoading || nlPrompt.trim().length < 5}>
            {nlLoading ? "Generating..." : "Generate Rule"}
          </Button>
        {/if}
      </DialogFooter>
    </div>
  </Dialog>
</div>
