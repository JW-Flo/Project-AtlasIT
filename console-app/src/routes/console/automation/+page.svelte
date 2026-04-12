<script lang="ts">
  import { onMount } from "svelte";

  interface AutomationRule {
    id: string;
    name: string;
    description?: string;
    trigger_type: string;
    enabled: boolean;
    run_count: number;
    error_count: number;
    last_run_at?: string;
    last_status?: string;
    created_at: string;
  }

  interface WorkflowRun {
    id: string;
    definitionId: string;
    status: string;
    started_at: string;
    completed_at?: string;
  }

  interface Stats {
    total_rules: number;
    total_runs: number;
    total_errors: number;
  }

  let rules: AutomationRule[] = [];
  let runs: WorkflowRun[] = [];
  let stats: Stats | null = null;
  let rulesLoading = true;
  let rulesError: string | null = null;
  let runsLoading = false;
  let runsError: string | null = null;

  let activeTab: "rules" | "runs" = "rules";
  let search = "";
  let showCreateForm = false;
  let expandedRuleId: string | null = null;

  let createName = "";
  let createDescription = "";
  let createTriggerType = "event.created";
  let createActions = "";
  let createSubmitting = false;
  let createError: string | null = null;

  const TRIGGER_TYPES = [
    "event.created",
    "schedule.cron",
    "user.created",
    "integration.sync.completed",
  ];

  const API_BASE = "/orchestrator/api/v1";

  async function loadRules() {
    rulesLoading = true;
    rulesError = null;
    try {
      const [rulesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/automation/rules`),
        fetch(`${API_BASE}/automation/stats`),
      ]);
      if (!rulesRes.ok) throw new Error(`Rules fetch failed (HTTP ${rulesRes.status})`);
      const rulesJson = await rulesRes.json();
      rules = rulesJson.data ?? [];
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        stats = statsJson.data?.summary ?? null;
      }
    } catch (e) {
      rulesError = (e as Error).message;
    } finally {
      rulesLoading = false;
    }
  }

  async function loadRuns() {
    runsLoading = true;
    runsError = null;
    try {
      const res = await fetch(`${API_BASE}/workflows?limit=20`);
      if (!res.ok) throw new Error(`Workflow fetch failed (HTTP ${res.status})`);
      const json = await res.json();
      runs = json.data ?? [];
    } catch (e) {
      runsError = (e as Error).message;
    } finally {
      runsLoading = false;
    }
  }

  async function toggleRule(rule: AutomationRule) {
    const prev = rule.enabled;
    rule.enabled = !rule.enabled;
    rules = [...rules];
    try {
      const res = await fetch(`${API_BASE}/automation/rules/${rule.id}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error("Toggle failed");
    } catch {
      rule.enabled = prev;
      rules = [...rules];
    }
  }

  async function deleteRule(rule: AutomationRule) {
    if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/automation/rules/${rule.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
      rules = rules.filter((r) => r.id !== rule.id);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function submitCreate() {
    createError = null;
    if (!createName.trim()) { createError = "Name is required"; return; }
    let parsedActions: unknown;
    try {
      parsedActions = JSON.parse(createActions || "[]");
    } catch {
      createError = "Actions must be valid JSON";
      return;
    }
    createSubmitting = true;
    try {
      const res = await fetch(`${API_BASE}/automation/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
          triggerType: createTriggerType,
          actions: parsedActions,
          enabled: true,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data) rules = [json.data, ...rules];
      showCreateForm = false;
      createName = "";
      createDescription = "";
      createActions = "";
      createTriggerType = "event.created";
    } catch (e) {
      createError = (e as Error).message;
    } finally {
      createSubmitting = false;
    }
  }

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const d = Math.floor(ms / 86400000); if (d > 0) return `${d}d ago`;
    const h = Math.floor(ms / 3600000); if (h > 0) return `${h}h ago`;
    return `${Math.floor(ms / 60000)}m ago`;
  }

  function statusBadgeClass(s: string): string {
    if (s === "completed" || s === "success") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (s === "failed" || s === "error") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (s === "running") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (s === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }

  $: filteredRules = rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  $: enabledCount = rules.filter((r) => r.enabled).length;
  $: disabledCount = rules.filter((r) => !r.enabled).length;

  function switchTab(tab: "rules" | "runs") {
    activeTab = tab;
    if (tab === "runs" && runs.length === 0 && !runsLoading) loadRuns();
  }

  onMount(() => { loadRules(); });

  const cls = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const th = "px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";
  const thLeft = th + " text-left";
  function tabCls(t: string) { return "pb-3 text-sm font-medium border-b-2 transition-colors " + (activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"); }
  const actionsPlaceholder = '[{"type":"notify","config":{"channel":"slack"}}]';
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Automation</h1>
      <div class="mt-2 flex gap-2 flex-wrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          {stats?.total_rules ?? rules.length} total
        </span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {enabledCount} enabled
        </span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {disabledCount} disabled
        </span>
      </div>
    </div>
    <div class="flex gap-3 items-center">
      <input
        type="search"
        bind:value={search}
        placeholder="Search rules..."
        class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
      />
      <button
        on:click={() => { showCreateForm = !showCreateForm; createError = null; }}
        class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        {showCreateForm ? "Cancel" : "New Rule"}
      </button>
    </div>
  </div>

  <!-- Inline create form -->
  {#if showCreateForm}
    <div class="mb-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Automation Rule</h2>
      {#if createError}<div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">{createError}</div>{/if}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span class="text-red-500">*</span></label>
          <input type="text" bind:value={createName} placeholder="Rule name" class={cls} />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Type</label>
          <select bind:value={createTriggerType} class={cls}>
            {#each TRIGGER_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea bind:value={createDescription} placeholder="Optional description" rows="2" class="{cls} resize-none"></textarea>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actions (JSON)</label>
          <textarea bind:value={createActions} placeholder={actionsPlaceholder} rows="3" class="{cls} font-mono resize-none"></textarea>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button on:click={submitCreate} disabled={createSubmitting} class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors">
          {createSubmitting ? "Creating..." : "Create Rule"}
        </button>
        <button on:click={() => { showCreateForm = false; createError = null; }} class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <!-- Tab nav -->
  <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
    <nav class="-mb-px flex gap-6">
      <button on:click={() => switchTab("rules")} class={tabCls("rules")}>Rules</button>
      <button on:click={() => switchTab("runs")} class={tabCls("runs")}>Runs</button>
    </nav>
  </div>

  <!-- Rules tab -->
  {#if activeTab === "rules"}
    {#if rulesLoading}
      <div class="space-y-2">{#each Array(6) as _}<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>{/each}</div>
    {:else if rulesError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{rulesError}</p>
        <button on:click={loadRules} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
      </div>
    {:else if filteredRules.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center">
        <p class="text-gray-500 dark:text-gray-400">
          {search ? "No rules match your search." : "No automation rules yet. Create one above."}
        </p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="{th} text-left">Name</th>
              <th class="{th} text-left hidden sm:table-cell">Trigger</th>
              <th class="{th} text-center">Enabled</th>
              <th class="{th} text-right hidden md:table-cell">Runs</th>
              <th class="{th} text-left hidden lg:table-cell">Last Run</th>
              <th class="{th} text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredRules as rule (rule.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">{rule.name}</div>
                  {#if rule.description}
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{rule.description}</div>
                  {/if}
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-xs font-mono text-gray-600 dark:text-gray-400">{rule.trigger_type}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button on:click={() => toggleRule(rule)} aria-label="{rule.enabled ? 'Disable' : 'Enable'} {rule.name}" class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {rule.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}">
                    <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform {rule.enabled ? 'translate-x-4' : 'translate-x-1'}"></span>
                  </button>
                </td>
                <td class="px-4 py-3 text-right hidden md:table-cell">
                  <span class="text-sm text-gray-900 dark:text-white">{rule.run_count}</span>
                  {#if rule.error_count > 0}<span class="ml-1 text-xs text-red-500">{rule.error_count} err</span>{/if}
                </td>
                <td class="px-4 py-3 hidden lg:table-cell">
                  {#if rule.last_run_at}
                    <div class="text-xs text-gray-500 dark:text-gray-400">{relativeTime(rule.last_run_at)}</div>
                    {#if rule.last_status}<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {statusBadgeClass(rule.last_status)}">{rule.last_status}</span>{/if}
                  {:else}<span class="text-xs text-gray-400">Never</span>{/if}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button on:click={() => { expandedRuleId = expandedRuleId === rule.id ? null : rule.id; }} class="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">View</button>
                    <button on:click={() => deleteRule(rule)} class="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
              {#if expandedRuleId === rule.id}
                <tr class="bg-gray-50 dark:bg-gray-900/50">
                  <td colspan="6" class="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    <div><span class="font-medium">ID:</span> <span class="font-mono">{rule.id}</span></div>
                    <div><span class="font-medium">Trigger:</span> <span class="font-mono">{rule.trigger_type}</span></div>
                    <div><span class="font-medium">Runs:</span> {rule.run_count} total, {rule.error_count} errors · Created {relativeTime(rule.created_at)}</div>
                    {#if rule.description}<div><span class="font-medium">Description:</span> {rule.description}</div>{/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  <!-- Runs tab -->
  {#if activeTab === "runs"}
    {#if runsLoading}
      <div class="space-y-2">{#each Array(6) as _}<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>{/each}</div>
    {:else if runsError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{runsError}</p>
        <button on:click={loadRuns} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
      </div>
    {:else if runs.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center">
        <p class="text-gray-500 dark:text-gray-400">No workflow runs found.</p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class={th}>Type</th>
              <th class={th}>Status</th>
              <th class="{th} hidden sm:table-cell">Started</th>
              <th class="{th} hidden md:table-cell">Completed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each runs as run (run.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs">{run.definitionId}</div>
                  <div class="text-xs text-gray-400 font-mono">{run.id.slice(0, 8)}...</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusBadgeClass(run.status)}">
                    {run.status}
                  </span>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell text-sm text-gray-500 dark:text-gray-400">
                  {relativeTime(run.started_at)}
                </td>
                <td class="px-4 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                  {run.completed_at ? relativeTime(run.completed_at) : "running..."}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
