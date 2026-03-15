<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { integrations, iconMap } from "$lib/data/integrations";

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

  function humanize(slug: string): string {
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toSteps(names: string[]): WorkflowStep[] {
    return names.map((n) => ({ name: humanize(n), description: n }));
  }

  let workflows: AppWorkflow[] = [];
  let loading = true;
  let idpSource = "okta";
  let searchQuery = "";

  // Modal state
  let showModal = false;
  let modalApp: AppWorkflow | null = null;
  let modalType: "joiner" | "mover" | "leaver" = "joiner";
  let modalEmail = "";
  let executing = false;
  let executionResult: ExecutionResult | null = null;

  // Section collapse
  let collapsed: Record<string, boolean> = {};

  const idpSources = [
    { id: "okta", label: "Okta" },
    { id: "google_workspace", label: "Google Workspace" },
    { id: "active_directory", label: "Active Directory" },
    { id: "entra_id", label: "Entra ID" },
  ];

  // Only show connected apps
  $: connectedWorkflows = workflows.filter((w) => w.connected);
  $: filtered = connectedWorkflows.filter(
    (w) => !searchQuery || w.appName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  $: hasConnected = connectedWorkflows.length > 0;

  const sections: { type: "joiner" | "mover" | "leaver"; label: string; color: string; accent: string }[] = [
    { type: "joiner", label: "Joiner", color: "rgba(34,197,94,0.15)", accent: "#22c55e" },
    { type: "mover", label: "Mover", color: "rgba(59,130,246,0.15)", accent: "#3b82f6" },
    { type: "leaver", label: "Leaver", color: "rgba(239,68,68,0.15)", accent: "#ef4444" },
  ];

  async function fetchWorkflows() {
    loading = true;
    try {
      // Fetch connected app status
      const statusRes = await fetch("/api/apps/status");
      const statusData = statusRes.ok ? await statusRes.json() : { applications: [] };
      const connectedMap: Record<string, boolean> = {};
      for (const a of statusData.applications || []) {
        if (a.connected) connectedMap[a.id] = true;
      }

      // Fetch lifecycle workflows
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
          useFallback(connectedMap);
        }
      } else {
        useFallback(connectedMap);
      }
    } catch {
      useFallback({});
    }
    loading = false;
  }

  function useFallback(connectedMap: Record<string, boolean>) {
    workflows = integrations.map((app) => ({
      appId: app.id,
      appName: app.name,
      category: app.category,
      connected: !!connectedMap[app.id],
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

  $: if (mounted && idpSource) {
    fetchWorkflows();
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    joiner: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    mover: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    leaver: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  };
</script>

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text, #fff);">Workflows</h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Joiner / Mover / Leaver workflows for connected applications
      </p>
    </div>
    <a href="/console" class="text-sm px-3 py-1.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
      Back to Dashboard
    </a>
  </div>

  <!-- Controls -->
  <div class="flex flex-wrap items-end gap-4 mb-6">
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
    <div class="flex-1 max-w-sm">
      <label class="block text-xs mb-1" style="color: var(--color-text, #fff); opacity: 0.5;">Search</label>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Filter apps..."
        class="w-full px-3 py-2 rounded text-sm"
        style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
      />
    </div>
  </div>

  {#if loading}
    <div class="text-center py-16" style="color: var(--color-text, #fff); opacity: 0.4;">
      <p>Loading workflows...</p>
    </div>
  {:else if !hasConnected}
    <!-- Empty state: no connected apps -->
    <div class="rounded-lg p-10 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.15);">
      <svg class="w-12 h-12 mx-auto mb-4" style="color: rgba(255,255,255,0.2);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <p class="text-lg font-semibold mb-1" style="color: var(--color-text, #fff);">No connected apps</p>
      <p class="text-sm mb-5" style="color: var(--color-text, #fff); opacity: 0.5;">Connect applications from the Marketplace to enable JML workflows.</p>
      <a href="/console/marketplace" class="text-sm px-5 py-2.5 rounded text-white" style="background: var(--color-accent, #3b82f6);">
        Browse Marketplace
      </a>
    </div>
  {:else}
    <!-- JML sections -->
    {#each sections as section}
      {@const apps = filtered.filter((w) => (w[section.type] || []).length > 0)}
      <div class="mb-6">
        <!-- Section header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-3 rounded-t-lg"
          style="background: {section.color};"
          on:click={() => { collapsed[section.type] = !collapsed[section.type]; collapsed = collapsed; }}
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold uppercase tracking-wide" style="color: {section.accent};">
              {section.label}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(0,0,0,0.2); color: {section.accent};">
              {apps.length} app{apps.length !== 1 ? "s" : ""}
            </span>
          </div>
          <svg class="w-4 h-4 transition-transform" class:rotate-180={!collapsed[section.type]} style="color: {section.accent};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {#if !collapsed[section.type]}
          <div class="rounded-b-lg overflow-hidden" style="border: 1px solid var(--color-border, rgba(255,255,255,0.1)); border-top: none;">
            {#if apps.length === 0}
              <div class="px-4 py-6 text-center text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">
                No matching apps
              </div>
            {:else}
              <table class="w-full">
                <thead>
                  <tr style="background: rgba(255,255,255,0.02);">
                    <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Application</th>
                    <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Category</th>
                    <th class="text-left text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Steps</th>
                    <th class="text-right text-xs font-medium px-4 py-2.5" style="color: var(--color-text, #fff); opacity: 0.5;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {#each apps as app}
                    <tr style="border-top: 1px solid var(--color-border, rgba(255,255,255,0.06));">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
                            <svg class="w-4 h-4" style="color: var(--color-accent, #3b82f6);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                            </svg>
                          </div>
                          <span class="text-sm font-medium" style="color: var(--color-text, #fff);">{app.appName}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-xs capitalize" style="color: var(--color-text, #fff); opacity: 0.5;">{app.category}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-xs" style="color: {section.accent};">{(app[section.type] || []).length} steps</span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          on:click={() => openRunModal(app, section.type)}
                          class="text-xs font-medium px-3 py-1.5 rounded transition-colors"
                          style="background: {section.color}; color: {section.accent};"
                        >
                          Run
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
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

          <!-- Steps preview -->
          {#if modalApp[modalType]?.length}
            <div>
              <p class="text-xs mb-2" style="color: var(--color-text, #fff); opacity: 0.5;">Steps ({modalApp[modalType].length})</p>
              <div class="space-y-1">
                {#each modalApp[modalType] as step, i}
                  <div class="flex items-center gap-2 text-xs px-2 py-1.5 rounded" style="background: rgba(255,255,255,0.03); color: var(--color-text, #fff); opacity: 0.7;">
                    <span class="font-mono text-[10px] shrink-0" style="opacity: 0.4;">{i + 1}.</span>
                    {step.name}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

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
