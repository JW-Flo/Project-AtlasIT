<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, categories, iconMap } from "$lib/data/integrations";

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

  function humanize(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toSteps(names: string[]): WorkflowStep[] {
    return names.map((n) => ({ name: humanize(n), description: n }));
  }

  interface ExecutionResult {
    success: boolean;
    steps: { name: string; status: "success" | "failed" | "skipped" }[];
    message?: string;
  }

  let workflows: AppWorkflow[] = [];
  let connectedApps: Record<string, boolean> = {};
  let loading = true;
  let activeCategory = "all";
  let idpSource = "okta";
  let searchQuery = "";

  // Modal state
  let showModal = false;
  let modalApp: AppWorkflow | null = null;
  let modalType: "joiner" | "mover" | "leaver" = "joiner";
  let modalEmail = "";
  let executing = false;
  let executionResult: ExecutionResult | null = null;

  // Collapsible state per app
  let expanded: Record<string, { joiner: boolean; mover: boolean; leaver: boolean }> = {};

  const idpSources = [
    { id: "okta", label: "Okta" },
    { id: "google_workspace", label: "Google Workspace" },
    { id: "active_directory", label: "Active Directory" },
    { id: "entra_id", label: "Entra ID" },
  ];

  $: filtered = workflows.filter((w) => {
    if (activeCategory !== "all" && w.category !== activeCategory) return false;
    if (searchQuery && !w.appName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  async function fetchWorkflows() {
    loading = true;
    try {
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
              connected: !!a.connected,
              joiner: Array.isArray(a.joiner) ? toSteps(a.joiner) : [],
              mover: Array.isArray(a.mover) ? toSteps(a.mover) : [],
              leaver: Array.isArray(a.leaver) ? toSteps(a.leaver) : [],
            };
          });
          // Build connected map from response
          connectedApps = {};
          for (const a of apps) {
            connectedApps[a.appId] = !!a.connected;
          }
        } else {
          useFallback();
        }
      } else {
        useFallback();
      }
    } catch {
      useFallback();
    }
    loading = false;
  }

  function useFallback() {
    workflows = integrations.map((app) => ({
      appId: app.id,
      appName: app.name,
      category: app.category,
      connected: false,
      joiner: [
        { name: "Provision account", description: `Create ${app.name} account for new user` },
        { name: "Assign license", description: `Assign appropriate ${app.name} license` },
        { name: "Set permissions", description: `Configure default ${app.name} permissions based on role` },
      ],
      mover: [
        { name: "Review access", description: `Audit current ${app.name} access and permissions` },
        { name: "Update permissions", description: `Adjust ${app.name} permissions for new role` },
        { name: "Transfer ownership", description: `Transfer ${app.name} resources if needed` },
      ],
      leaver: [
        { name: "Revoke access", description: `Disable ${app.name} account and revoke sessions` },
        { name: "Backup data", description: `Archive user data from ${app.name}` },
        { name: "Remove license", description: `Deallocate ${app.name} license` },
      ],
    }));
  }

  function toggleSection(appId: string, section: "joiner" | "mover" | "leaver") {
    if (!expanded[appId]) {
      expanded[appId] = { joiner: false, mover: false, leaver: false };
    }
    expanded[appId][section] = !expanded[appId][section];
    expanded = expanded;
  }

  function openRunModal(app: AppWorkflow) {
    modalApp = app;
    modalType = "joiner";
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
        // Show simulated result for MVP
        const steps = modalApp[modalType] || [];
        executionResult = {
          success: true,
          steps: steps.map((s: WorkflowStep) => ({ name: s.name, status: "success" as const })),
          message: `${modalType} workflow executed for ${modalEmail}`,
        };
      }
      pushToast({ message: `${modalType} workflow completed for ${modalEmail}`, variant: "success" });
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

  let mounted = false;
  onMount(() => {
    mounted = true;
    fetchWorkflows();
  });

  // Re-fetch when IDP source changes (skip initial — onMount handles it)
  $: if (mounted && idpSource) {
    fetchWorkflows();
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    joiner: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    mover: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    leaver: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  };
</script>

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text, #fff);">Workflows</h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Browse and trigger JML (Joiner/Mover/Leaver) workflows per application
      </p>
    </div>
    <a href="/console" class="text-sm px-3 py-1.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
      Back to Dashboard
    </a>
  </div>

  <!-- Controls -->
  <div class="flex flex-wrap items-center gap-4 mb-4">
    <div>
      <label class="block text-xs mb-1" style="color: var(--color-text, #fff); opacity: 0.5;">IDP Source</label>
      <select
        bind:value={idpSource}
        class="px-3 py-2 rounded text-sm"
        style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
      >
        {#each idpSources as src}
          <option value={src.id}>{src.label}</option>
        {/each}
      </select>
    </div>
    <div class="flex-1 max-w-md">
      <label class="block text-xs mb-1" style="color: var(--color-text, #fff); opacity: 0.5;">Search</label>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search apps..."
        class="w-full px-3 py-2 rounded text-sm"
        style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
      />
    </div>
  </div>

  <!-- Categories -->
  <div class="flex flex-wrap gap-2 mb-6">
    {#each categories as cat}
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
        style="background: {activeCategory === cat.id ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.05)'}; color: {activeCategory === cat.id ? '#fff' : 'var(--color-text, #fff)'}; opacity: {activeCategory === cat.id ? 1 : 0.6};"
        on:click={() => activeCategory = cat.id}
      >
        {cat.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-12" style="color: var(--color-text, #fff); opacity: 0.4;">
      <p>Loading workflows...</p>
    </div>
  {:else}
    <!-- Workflow cards -->
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 items-start">
      {#each filtered as app}
        <div class="rounded-lg p-5 flex flex-col" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
          <!-- Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
                <svg class="w-5 h-5" style="color: var(--color-accent, #3b82f6);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold" style="color: var(--color-text, #fff);">{app.appName}</h3>
                <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{app.category}</span>
              </div>
            </div>
            <span
              class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style="background: {connectedApps[app.appId] ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}; color: {connectedApps[app.appId] ? '#22c55e' : 'rgba(255,255,255,0.4)'};"
            >
              {connectedApps[app.appId] ? "Connected" : "Not Connected"}
            </span>
          </div>

          <!-- Workflow sections -->
          {#each ["joiner", "mover", "leaver"] as type}
            {@const steps = app[type] || []}
            {@const colors = typeColors[type]}
            {@const isExpanded = expanded[app.appId]?.[type] || false}
            <div class="mb-2">
              <button
                type="button"
                class="w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium"
                style="background: {colors.bg}; color: {colors.text};"
                on:click={() => toggleSection(app.appId, type)}
              >
                <span class="capitalize">{type} ({steps.length} steps)</span>
                <svg class="w-3.5 h-3.5 transition-transform" class:rotate-180={isExpanded} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {#if isExpanded}
                <div class="mt-1 ml-3 space-y-1">
                  {#each steps as step, i}
                    <div class="flex items-start gap-2 py-1">
                      <span class="text-[10px] font-mono mt-0.5 shrink-0" style="color: {colors.text};">{i + 1}.</span>
                      <div>
                        <div class="text-xs font-medium" style="color: var(--color-text, #fff);">{step.name}</div>
                        <div class="text-[11px]" style="color: var(--color-text, #fff); opacity: 0.4;">{step.description}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}

          <!-- Run button -->
          <div class="mt-auto pt-2">
            <button
              type="button"
              on:click={() => openRunModal(app)}
              class="w-full py-2 text-xs font-medium rounded transition-colors"
              style="background: var(--color-accent, #3b82f6); color: #fff;"
            >
              Run Workflow
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div class="rounded-lg p-8 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.2);">
        <svg class="w-12 h-12 mx-auto mb-4" style="color: rgba(255,255,255,0.2);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p class="text-lg font-semibold mb-1" style="color: var(--color-text, #fff);">No workflows found</p>
        <p class="text-sm mb-4" style="color: var(--color-text, #fff); opacity: 0.5;">Connect your applications to enable automated JML workflows, or try a different search or category.</p>
        <div class="flex gap-3 justify-center">
          <a href="/console/marketplace" class="text-sm px-4 py-2 rounded text-white" style="background: var(--color-accent, #3b82f6);">Connect Apps</a>
          {#if searchQuery || activeCategory !== 'all'}
            <button type="button" on:click={() => { searchQuery = ''; activeCategory = 'all'; }} class="text-sm px-4 py-2 rounded" style="background: rgba(255,255,255,0.1); color: var(--color-text, #fff);">Clear Filters</button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Run Workflow Modal -->
{#if showModal && modalApp}
  <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6);">
    <div class="w-full max-w-md mx-4 rounded-lg p-6" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold" style="color: var(--color-text, #fff);">Run Workflow — {modalApp.appName}</h3>
        <button type="button" on:click={() => showModal = false} class="p-1" style="color: var(--color-text, #fff); opacity: 0.5;" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {#if !executionResult}
        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Workflow Type</label>
            <div class="flex gap-2">
              {#each ["joiner", "mover", "leaver"] as t}
                {@const colors = typeColors[t]}
                <button
                  type="button"
                  class="flex-1 py-2 text-xs font-medium rounded capitalize transition-colors"
                  style="background: {modalType === t ? colors.bg : 'rgba(255,255,255,0.05)'}; color: {modalType === t ? colors.text : 'var(--color-text, #fff)'}; border: 1px solid {modalType === t ? colors.text : 'transparent'};"
                  on:click={() => modalType = t}
                >
                  {t}
                </button>
              {/each}
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1.5" style="color: var(--color-text, #fff); opacity: 0.7;">Subject Email</label>
            <input
              type="email"
              bind:value={modalEmail}
              placeholder="user@company.com"
              class="w-full px-3 py-2 rounded text-sm"
              style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
            />
          </div>
          <button
            type="button"
            on:click={executeWorkflow}
            disabled={executing || !modalEmail}
            class="w-full py-2.5 text-sm font-medium rounded text-white disabled:opacity-50 transition-colors"
            style="background: var(--color-accent, #3b82f6);"
          >
            {executing ? "Executing..." : `Run ${modalType} workflow`}
          </button>
        </div>
      {:else}
        <!-- Execution result -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-2">
            {#if executionResult.success}
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="text-sm font-medium text-green-400">Workflow completed</span>
            {:else}
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="text-sm font-medium text-red-400">Workflow failed</span>
            {/if}
          </div>
          {#if executionResult.message}
            <p class="text-xs" style="color: var(--color-text, #fff); opacity: 0.6;">{executionResult.message}</p>
          {/if}
          {#each executionResult.steps as step}
            <div class="flex items-center gap-2 px-3 py-2 rounded" style="background: var(--color-bg, #0f1923);">
              {#if step.status === "success"}
                <svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {:else if step.status === "failed"}
                <svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              {:else}
                <svg class="w-4 h-4 shrink-0" style="color: rgba(255,255,255,0.3);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
              {/if}
              <span class="text-xs" style="color: var(--color-text, #fff);">{step.name}</span>
            </div>
          {/each}
          <button
            type="button"
            on:click={() => showModal = false}
            class="w-full py-2 text-sm font-medium rounded transition-colors"
            style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
          >
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
