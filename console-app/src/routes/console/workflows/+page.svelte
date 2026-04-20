<script lang="ts">
  import { onMount } from "svelte";
  import { relativeTime } from "$lib/utils/time";

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
      const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
      runs = raw.map((r) => ({
        id: String(r.id ?? ""),
        tenantId: String(r.tenantId ?? r.tenant_id ?? ""),
        definitionId: String(r.definitionId ?? r.definition_id ?? ""),
        type: String(r.type ?? ""),
        status: String(r.status ?? ""),
        context: (r.context as Record<string, unknown>) ?? null,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        completedAt: r.completedAt ?? r.completed_at ? String(r.completedAt ?? r.completed_at) : null,
      }));
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
      const raw: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
      changelog = raw.map((r) => ({
        id: String(r.id ?? ""),
        user_id: String(r.user_id ?? r.userId ?? ""),
        jml_action: String(r.jml_action ?? r.jmlAction ?? ""),
        delta: r.delta ?? null,
        source: String(r.source ?? ""),
        created_at: String(r.created_at ?? r.createdAt ?? ""),
      }));
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
  function switchTab(t: Tab): void { tab = t; if (t === "changelog") loadChangelog(); }
  onMount(() => { loadRuns(); });
</script>

<div class="animate-fade-in">
  <!-- Header -->
  <div class="mb-6 flex items-start justify-between">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Workflows</h1>
      <p class="mt-1 text-sm text-muted-foreground">JML automation runs and directory change history</p>
    </div>
    <button
      on:click={() => { showForm = !showForm; formError = null; formSuccess = null; }}
      class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors"
    >
      {showForm ? "Dismiss" : "Start Workflow"}
    </button>
  </div>

  <!-- Stats -->
  {#if loadingRuns}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {#each Array(4) as _}
        <div class="h-20 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-sm text-muted-foreground">Total</div>
        <div class="mt-1 text-2xl font-bold text-foreground">{stats.total}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-sm text-muted-foreground">Running</div>
        <div class="mt-1 text-2xl font-bold text-primary">{stats.running}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-sm text-muted-foreground">Completed</div>
        <div class="mt-1 text-2xl font-bold text-success">{stats.completed}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-sm text-muted-foreground">Failed</div>
        <div class="mt-1 text-2xl font-bold {stats.failed > 0 ? 'text-destructive' : 'text-foreground'}">{stats.failed}</div>
      </div>
    </div>
  {/if}

  <!-- Inline Start Workflow Form -->
  {#if showForm}
    <div class="mb-6 bg-card border border-border rounded-lg p-5">
      <h2 class="text-base font-semibold text-foreground mb-4">Start Workflow</h2>
      <form on:submit|preventDefault={submitWorkflow} class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label for="wf-type" class="block text-sm font-medium text-foreground/80 mb-1">Type</label>
          <select
            id="wf-type"
            bind:value={formType}
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm"
          >
            <option value="joiner">Joiner</option>
            <option value="mover">Mover</option>
            <option value="leaver">Leaver</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="flex-1">
          <label for="wf-subject" class="block text-sm font-medium text-foreground/80 mb-1">Subject ref (email or ID)</label>
          <input
            id="wf-subject"
            type="text"
            bind:value={formSubject}
            placeholder="user@example.com"
            class="w-full rounded-md border border-input bg-white dark:bg-gray-700 text-foreground px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={formSubmitting}
          class="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
        >
          {formSubmitting ? "Starting..." : "Run"}
        </button>
      </form>
      {#if formError}
        <p class="mt-3 text-sm text-destructive">{formError}</p>
      {/if}
      {#if formSuccess}
        <p class="mt-3 text-sm text-success">{formSuccess}</p>
      {/if}
    </div>
  {/if}

  <!-- Tabs -->
  <div class="border-b border-border mb-6">
    <nav class="-mb-px flex gap-6">
      <button
        on:click={() => switchTab("runs")}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {tab === 'runs'
            ? 'border-blue-600 text-primary'
            : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-200'}"
      >
        Runs
      </button>
      <button
        on:click={() => switchTab("changelog")}
        class="pb-3 text-sm font-medium border-b-2 transition-colors
          {tab === 'changelog'
            ? 'border-blue-600 text-primary'
            : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-200'}"
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
          <div class="h-14 bg-muted rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if runsError}
      <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
        <p class="text-destructive">{runsError}</p>
        <button
          on:click={loadRuns}
          class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if runs.length === 0}
      <div class="bg-card border border-border rounded-lg p-8 text-center">
        <p class="text-muted-foreground text-sm">No workflow runs yet.</p>
      </div>
    {:else}
      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Workflow Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Started</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each runs as run (run.id)}
              <tr
                class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                on:click={() => toggleExpand(run.id)}
              >
                <td class="px-4 py-3 font-medium text-foreground capitalize">
                  {run.definitionId || run.type || "—"}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    {run.status === 'completed' ? 'bg-success-muted text-success' : ''}
                    {run.status === 'running' || run.status === 'pending' ? 'bg-info-muted text-info' : ''}
                    {run.status === 'failed' ? 'bg-destructive-muted text-destructive' : ''}
                    {run.status === 'cancelled' ? 'bg-muted text-muted-foreground' : ''}">
                    {run.status}
                  </span>
                </td>
                <td class="px-4 py-3 text-muted-foreground">{relativeTime(run.createdAt)}</td>
                <td class="px-4 py-3 text-muted-foreground">
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
                    <span class="text-muted-foreground/70 dark:text-gray-600 text-xs">—</span>
                  {/if}
                </td>
              </tr>
              {#if expandedId === run.id}
                <tr class="bg-background/30">
                  <td colspan="5" class="px-4 py-4">
                    <div class="text-xs font-medium text-muted-foreground uppercase mb-2">Context</div>
                    <pre class="text-xs text-gray-800 dark:text-gray-200 bg-card border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(run.context ?? {}, null, 2)}</pre>
                    <div class="mt-2 text-xs text-muted-foreground/70">ID: {run.id}</div>
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
          <div class="h-14 bg-muted rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if changelogError}
      <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
        <p class="text-destructive">{changelogError}</p>
        <button
          on:click={() => { changelog = []; loadChangelog(); }}
          class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if changelog.length === 0}
      <div class="bg-card border border-border rounded-lg p-8 text-center">
        <p class="text-muted-foreground text-sm">No directory change events found.</p>
      </div>
    {:else}
      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Delta</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each changelog as entry (entry.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 text-foreground font-mono text-xs">{entry.user_id}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    {entry.jml_action === 'joiner' ? 'bg-success-muted text-success' : ''}
                    {entry.jml_action === 'leaver' ? 'bg-destructive-muted text-destructive' : ''}
                    {entry.jml_action === 'mover' ? 'bg-warning-muted text-warning' : ''}
                    {!['joiner','leaver','mover'].includes(entry.jml_action) ? 'bg-muted text-muted-foreground' : ''}">
                    {entry.jml_action}
                  </span>
                </td>
                <td class="px-4 py-3 text-muted-foreground font-mono text-xs max-w-xs truncate">
                  {typeof entry.delta === "string" ? entry.delta : JSON.stringify(entry.delta ?? {})}
                </td>
                <td class="px-4 py-3 text-muted-foreground">{entry.source}</td>
                <td class="px-4 py-3 text-muted-foreground">{relativeTime(entry.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
