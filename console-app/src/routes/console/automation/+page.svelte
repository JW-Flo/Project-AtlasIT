<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, iconMap } from "$lib/data/integrations";

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

  interface HealthCheck {
    appId: string;
    healthy: boolean;
    responseMs?: number;
    checkedAt: string;
  }

  interface Suggestion {
    templateId: string;
    reason: string;
    priority: string;
    ruleInput: any;
  }

  // ---- State ----------------------------------------------------------------
  let activeTab: "overview" | "rules" | "health" | "history" = "overview";
  let loading = true;

  let rules: AutomationRule[] = [];
  let executions: Execution[] = [];
  let healthChecks: HealthCheck[] = [];
  let suggestions: Suggestion[] = [];

  // ---- Data fetching --------------------------------------------------------
  async function fetchAll() {
    loading = true;
    await Promise.all([fetchRules(), fetchExecutions(), fetchHealth(), fetchSuggestions()]);
    loading = false;
  }

  async function fetchRules() {
    try {
      const res = await fetch("/api/automation/rules");
      if (res.ok) {
        const data = await res.json();
        rules = data.rules || [];
      }
    } catch { /* silent */ }
  }

  async function fetchExecutions() {
    try {
      const res = await fetch("/api/automation/executions?limit=20");
      if (res.ok) {
        const data = await res.json();
        executions = data.executions || [];
      }
    } catch { /* silent */ }
  }

  async function fetchHealth() {
    try {
      const res = await fetch("/api/automation/health");
      if (res.ok) {
        const data = await res.json();
        healthChecks = data.checks || [];
      }
    } catch { /* silent */ }
  }

  async function fetchSuggestions() {
    try {
      const res = await fetch("/api/automation/suggestions");
      if (res.ok) {
        const data = await res.json();
        suggestions = data.suggestions || [];
      }
    } catch { /* silent */ }
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
    }
  }

  async function dismissSuggestion(suggestion: Suggestion) {
    suggestions = suggestions.filter((s) => s !== suggestion);
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

  async function deleteRule(rule: AutomationRule) {
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

  function statusColor(status: string): string {
    if (status === "success") return "#22c55e";
    if (status === "partial") return "#f59e0b";
    if (status === "failed") return "#ef4444";
    return "rgba(255,255,255,0.4)";
  }

  function priorityColor(p: string): string {
    if (p === "high") return "#ef4444";
    if (p === "medium") return "#f59e0b";
    return "#3b82f6";
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

  $: activeRules = rules.filter((r) => r.enabled);
  $: totalExecutions = rules.reduce((sum, r) => sum + r.runCount, 0);
  $: healthyCount = healthChecks.filter((h) => h.healthy).length;
  $: unhealthyCount = healthChecks.filter((h) => !h.healthy).length;

  onMount(fetchAll);
</script>

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text, #fff);">Automation</h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Automated environment management for your connected apps
      </p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 mb-6 p-1 rounded-lg" style="background: rgba(255,255,255,0.05);">
    {#each [
      { id: "overview", label: "Overview" },
      { id: "rules", label: "Rules" },
      { id: "health", label: "Environment Health" },
      { id: "history", label: "Activity" },
    ] as tab}
      <button
        type="button"
        class="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
        style="background: {activeTab === tab.id ? 'var(--color-accent, #3b82f6)' : 'transparent'}; color: {activeTab === tab.id ? '#fff' : 'var(--color-text, #fff)'}; opacity: {activeTab === tab.id ? 1 : 0.6};"
        on:click={() => activeTab = tab.id}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-16" style="color: var(--color-text, #fff); opacity: 0.4;">
      <p>Loading automation data...</p>
    </div>

  {:else if activeTab === "overview"}
    <!-- Stats -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      {#each [
        { label: "Active Rules", value: activeRules.length, color: "#3b82f6" },
        { label: "Total Executions", value: totalExecutions, color: "#8b5cf6" },
        { label: "Apps Healthy", value: healthyCount, color: "#22c55e" },
        { label: "Apps Unhealthy", value: unhealthyCount, color: unhealthyCount > 0 ? "#ef4444" : "#22c55e" },
      ] as stat}
        <div class="rounded-lg p-4" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
          <div class="text-xs mb-1" style="color: var(--color-text, #fff); opacity: 0.5;">{stat.label}</div>
          <div class="text-2xl font-semibold" style="color: {stat.color};">{stat.value}</div>
        </div>
      {/each}
    </div>

    <!-- Suggestions -->
    {#if suggestions.length > 0}
      <div class="mb-6">
        <h2 class="text-sm font-semibold mb-3 uppercase tracking-wide" style="color: var(--color-text, #fff); opacity: 0.5;">Recommended Automations</h2>
        <div class="space-y-2">
          {#each suggestions.slice(0, 5) as suggestion}
            <div class="flex items-center gap-4 rounded-lg p-4" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
              <div class="shrink-0 w-2 h-2 rounded-full" style="background: {priorityColor(suggestion.priority)};"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate" style="color: var(--color-text, #fff);">{suggestion.ruleInput.name}</div>
                <div class="text-xs mt-0.5 truncate" style="color: var(--color-text, #fff); opacity: 0.5;">{suggestion.reason}</div>
              </div>
              <div class="flex gap-2 shrink-0">
                <button
                  type="button"
                  on:click={() => applySuggestion(suggestion)}
                  class="text-xs font-medium px-3 py-1.5 rounded transition-colors"
                  style="background: rgba(34,197,94,0.15); color: #22c55e;"
                >
                  Enable
                </button>
                <button
                  type="button"
                  on:click={() => dismissSuggestion(suggestion)}
                  class="text-xs font-medium px-3 py-1.5 rounded transition-colors"
                  style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff); opacity: 0.5;"
                >
                  Dismiss
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recent Activity -->
    {#if executions.length > 0}
      <div>
        <h2 class="text-sm font-semibold mb-3 uppercase tracking-wide" style="color: var(--color-text, #fff); opacity: 0.5;">Recent Activity</h2>
        <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
          {#each executions.slice(0, 8) as exec}
            {@const rule = rules.find((r) => r.id === exec.ruleId)}
            <div class="flex items-center gap-3 px-4 py-3" style="border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.06)); background: var(--color-surface, #1a2332);">
              <div class="w-2 h-2 rounded-full shrink-0" style="background: {statusColor(exec.status)};"></div>
              <div class="flex-1 min-w-0">
                <span class="text-sm" style="color: var(--color-text, #fff);">{rule?.name ?? exec.ruleId}</span>
                <span class="text-xs ml-2" style="color: var(--color-text, #fff); opacity: 0.4;">{exec.actionsRun} action{exec.actionsRun !== 1 ? "s" : ""}</span>
              </div>
              <span class="text-xs shrink-0" style="color: var(--color-text, #fff); opacity: 0.4;">{timeAgo(exec.startedAt)}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="rounded-lg p-8 text-center" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">No automation activity yet. Enable a suggested rule to get started.</p>
      </div>
    {/if}

  {:else if activeTab === "rules"}
    <!-- Rules List -->
    {#if rules.length === 0}
      <div class="rounded-lg p-10 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.15);">
        <p class="text-lg font-semibold mb-1" style="color: var(--color-text, #fff);">No automation rules</p>
        <p class="text-sm mb-4" style="color: var(--color-text, #fff); opacity: 0.5;">
          {suggestions.length > 0 ? "Check the Overview tab for recommended automations." : "Connect apps and set up directory mappings to get automation suggestions."}
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each rules as rule}
          <div class="rounded-lg p-4" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
            <div class="flex items-center gap-4">
              <!-- Toggle -->
              <button
                type="button"
                on:click={() => toggleRule(rule)}
                class="w-10 h-6 rounded-full relative transition-colors shrink-0"
                style="background: {rule.enabled ? '#22c55e' : 'rgba(255,255,255,0.1)'};"
                aria-label="Toggle {rule.name}"
              >
                <span
                  class="absolute top-1 w-4 h-4 rounded-full transition-transform"
                  style="background: #fff; left: {rule.enabled ? '22px' : '4px'};"
                ></span>
              </button>

              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium" style="color: var(--color-text, #fff); opacity: {rule.enabled ? 1 : 0.5};">{rule.name}</div>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs px-2 py-0.5 rounded" style="background: rgba(59,130,246,0.15); color: #3b82f6;">{triggerLabel(rule.triggerType)}</span>
                  {#if rule.lastRunAt}
                    <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">Last: {timeAgo(rule.lastRunAt)}</span>
                  {/if}
                  {#if rule.runCount > 0}
                    <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{rule.runCount} run{rule.runCount !== 1 ? "s" : ""}</span>
                  {/if}
                  {#if rule.lastStatus}
                    <span class="w-2 h-2 rounded-full" style="background: {statusColor(rule.lastStatus)};"></span>
                  {/if}
                </div>
              </div>

              <button
                type="button"
                on:click={() => deleteRule(rule)}
                class="text-xs px-2 py-1 rounded transition-colors shrink-0"
                style="color: rgba(255,255,255,0.3);"
                aria-label="Delete {rule.name}"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
            {#if rule.description}
              <p class="text-xs mt-2 ml-14" style="color: var(--color-text, #fff); opacity: 0.4;">{rule.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "health"}
    <!-- Environment Health -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text, #fff); opacity: 0.5;">Connected App Health</h2>
      <button
        type="button"
        on:click={runHealthCheck}
        class="text-xs font-medium px-3 py-1.5 rounded transition-colors"
        style="background: rgba(59,130,246,0.15); color: #3b82f6;"
      >
        Run Health Check
      </button>
    </div>
    {#if healthChecks.length === 0}
      <div class="rounded-lg p-10 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.15);">
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">No health data yet. Click "Run Health Check" to check your connected apps.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-3">
        {#each healthChecks as check}
          <div class="rounded-lg p-4 flex items-center gap-4" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: {check.healthy ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};">
              {#if check.healthy}
                <svg class="w-5 h-5" style="color: #22c55e;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {:else}
                <svg class="w-5 h-5" style="color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium" style="color: var(--color-text, #fff);">{appName(check.appId)}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs" style="color: {check.healthy ? '#22c55e' : '#ef4444'};">{check.healthy ? "Healthy" : "Unhealthy"}</span>
                {#if check.responseMs}
                  <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.3;">{check.responseMs}ms</span>
                {/if}
                <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.3;">{timeAgo(check.checkedAt)}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "history"}
    <!-- Full Activity Log -->
    {#if executions.length === 0}
      <div class="rounded-lg p-10 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.15);">
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">No automation activity yet.</p>
      </div>
    {:else}
      <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <table class="w-full">
          <thead>
            <tr style="background: rgba(255,255,255,0.02);">
              <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Rule</th>
              <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Status</th>
              <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Actions</th>
              <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Duration</th>
              <th class="text-right text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">When</th>
            </tr>
          </thead>
          <tbody>
            {#each executions as exec}
              {@const rule = rules.find((r) => r.id === exec.ruleId)}
              <tr style="border-top: 1px solid var(--color-border, rgba(255,255,255,0.06)); background: var(--color-surface, #1a2332);">
                <td class="px-4 py-3">
                  <span class="text-sm" style="color: var(--color-text, #fff);">{rule?.name ?? "Unknown rule"}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-0.5 rounded capitalize" style="background: {statusColor(exec.status)}20; color: {statusColor(exec.status)};">{exec.status}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.6;">
                    {exec.actionsRun}{exec.actionsFailed > 0 ? ` (${exec.actionsFailed} failed)` : ""}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">
                    {exec.durationMs ? `${exec.durationMs}ms` : "-"}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{timeAgo(exec.startedAt)}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
