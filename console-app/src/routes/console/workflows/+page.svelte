<script lang="ts">
  import { onMount } from "svelte";

  interface WorkflowRun {
    id: string;
    tenantId: string;
    definitionId: string;
    type: string;
    status: string;
    context: Record<string, unknown> | null;
    createdAt: string;
    completedAt: string | null;
  }
  interface ChangelogEntry {
    id: string;
    user_id: string;
    jml_action: string;
    delta: unknown;
    source: string;
    created_at: string;
  }
  type Tab = "runs" | "changelog";

  let tab: Tab = "runs";
  let runs: WorkflowRun[] = [];
  let changelog: ChangelogEntry[] = [];
  let loadingRuns = true;
  let loadingChangelog = false;
  let runsError: string | null = null;
  let changelogError: string | null = null;
  let expandedId: string | null = null;
  let showForm = false;
  let formType: "joiner" | "mover" | "leaver" | "custom" = "joiner";
  let formSubject = "";
  let formSubmitting = false;
  let formError: string | null = null;
  let formSuccess: string | null = null;
  let cancelingId: string | null = null;

  $: stats = {
    total: runs.length,
    running: runs.filter((r) => r.status === "running" || r.status === "pending").length,
    completed: runs.filter((r) => r.status === "completed").length,
    failed: runs.filter((r) => r.status === "failed" || r.status === "cancelled").length,
  };

  async function loadRuns(): Promise<void> {
    loadingRuns = true;
    runsError = null;
    try {
      const res = await fetch("/orchestrator/api/v1/workflows?limit=50");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      runs = Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      runsError = (e as Error).message;
    } finally {
      loadingRuns = false;
    }
  }

  async function loadChangelog(): Promise<void> {
    if (changelog.length > 0) return;
    loadingChangelog = true;
    changelogError = null;
    try {
      const res = await fetch("/orchestrator/api/v1/jml/changelog?limit=50");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      changelog = Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      changelogError = (e as Error).message;
    } finally {
      loadingChangelog = false;
    }
  }

  async function cancelRun(id: string): Promise<void> {
    if (!confirm("Cancel this workflow run?")) return;
    cancelingId = id;
    try {
      const res = await fetch(`/orchestrator/api/v1/workflows/${id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadRuns();
    } catch (e) {
      alert(`Failed to cancel: ${(e as Error).message}`);
    } finally {
      cancelingId = null;
    }
  }

  async function submitWorkflow(): Promise<void> {
    if (!formSubject.trim()) {
      formError = "Subject ref is required.";
      return;
    }
    formSubmitting = true;
    formError = null;
    formSuccess = null;
    try {
      const isJml = formType !== "custom";
      const url = isJml
        ? "/orchestrator/api/v1/automation/execute"
        : "/orchestrator/api/v1/workflows";
      const body = isJml
        ? JSON.stringify({ workflowType: formType, subjectRef: formSubject.trim() })
        : JSON.stringify({
            definitionId: "custom",
            steps: [{ id: "step-1", name: "Execute", handler: "custom", timeoutMs: 30000 }],
            context: { subjectRef: formSubject.trim() },
          });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      formSuccess = "Workflow started successfully.";
      formSubject = "";
      showForm = false;
      await loadRuns();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      formSubmitting = false;
    }
  }

  function toggleExpand(id: string): void { expandedId = expandedId === id ? null : id; }
  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  function switchTab(t: Tab): void { tab = t; if (t === "changelog") loadChangelog(); }
  onMount(() => { loadRuns(); });
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6 flex items-start justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">JML automation runs and directory change history</p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = null; formSuccess = null; }}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
    >
      {showForm ? "Dismiss" : "Start Workflow"}
    </button>
  </div>

  <!-- Stats -->
  {#if loadingRuns}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {#each Array(4) as _}
        <div class="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">Total</div>
        <div class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">Running</div>
        <div class="mt-1 text-2xl font-bold text-blue-600">{stats.running}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">Completed</div>
        <div class="mt-1 text-2xl font-bold text-green-600">{stats.completed}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">Failed</div>
        <div class="mt-1 text-2xl font-bold {stats.failed > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}">{stats.failed}</div>
      </div>
    </div>
  {/if}

  <!-- Inline Start Workflow Form -->
  {#if showForm}
    <div class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Start Workflow</h2>
      <form on:submit|preventDefault={submitWorkflow} class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label for="wf-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select
            id="wf-type"
            bind:value={formType}
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            <option value="joiner">Joiner</option>
            <option value="mover">Mover</option>
            <option value="leaver">Leaver</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="flex-1">
          <label for="wf-subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject ref (email or ID)</label>
          <input
            id="wf-subject"
            type="text"
            bind:value={formSubject}
            placeholder="user@example.com"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={formSubmitting}
          class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
        >
          {formSubmitting ? "Starting..." : "Run"}
        </button>
      </form>
      {#if formError}
        <p class="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
      {/if}
      {#if formSuccess}
        <p class="mt-3 text-sm text-green-600 dark:text-green-400">{formSuccess}</p>
      {/if}
    </div>
  {/if}

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
    <nav class="-mb-px flex gap-6">
      <button
        on:click={() => switchTab("runs")}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {tab === 'runs'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
      >
        Runs
      </button>
      <button
        on:click={() => switchTab("changelog")}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {tab === 'changelog'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
      >
        JML Changelog
      </button>
    </nav>
  </div>

  <!-- Runs Tab -->
  {#if tab === "runs"}
    {#if loadingRuns}
      <div class="space-y-2">
        {#each Array(5) as _}
          <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if runsError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{runsError}</p>
        <button
          on:click={loadRuns}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if runs.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">No workflow runs yet.</p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workflow Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each runs as run (run.id)}
              <tr
                class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                on:click={() => toggleExpand(run.id)}
              >
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">
                  {run.definitionId || run.type || "—"}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    {run.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                    {run.status === 'running' || run.status === 'pending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                    {run.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    {run.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}">
                    {run.status}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{relativeTime(run.createdAt)}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {run.completedAt ? relativeTime(run.completedAt) : "running..."}
                </td>
                <td class="px-4 py-3" on:click|stopPropagation>
                  {#if run.status === "running" || run.status === "pending"}
                    <button
                      on:click={() => cancelRun(run.id)}
                      disabled={cancelingId === run.id}
                      class="px-3 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-md disabled:opacity-50 transition-colors"
                    >
                      {cancelingId === run.id ? "Canceling..." : "Cancel"}
                    </button>
                  {:else}
                    <span class="text-gray-400 dark:text-gray-600 text-xs">—</span>
                  {/if}
                </td>
              </tr>
              {#if expandedId === run.id}
                <tr class="bg-gray-50 dark:bg-gray-900/30">
                  <td colspan="5" class="px-4 py-4">
                    <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Context</div>
                    <pre class="text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(run.context ?? {}, null, 2)}</pre>
                    <div class="mt-2 text-xs text-gray-400 dark:text-gray-500">ID: {run.id}</div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  <!-- JML Changelog Tab -->
  {#if tab === "changelog"}
    {#if loadingChangelog}
      <div class="space-y-2">
        {#each Array(5) as _}
          <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if changelogError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{changelogError}</p>
        <button
          on:click={() => { changelog = []; loadChangelog(); }}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if changelog.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">No directory change events found.</p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delta</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each changelog as entry (entry.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 text-gray-900 dark:text-white font-mono text-xs">{entry.user_id}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    {entry.jml_action === 'joiner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                    {entry.jml_action === 'leaver' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                    {entry.jml_action === 'mover' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                    {!['joiner','leaver','mover'].includes(entry.jml_action) ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}">
                    {entry.jml_action}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-xs truncate">
                  {typeof entry.delta === "string" ? entry.delta : JSON.stringify(entry.delta ?? {})}
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.source}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{relativeTime(entry.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
