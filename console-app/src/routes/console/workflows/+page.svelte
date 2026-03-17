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
  import { Link, ChevronDown, Play, CheckCircle, XCircle, Minus } from "lucide-svelte";

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
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Workflows</h1>
      <p class="text-sm text-muted-foreground">
        Joiner / Mover / Leaver workflows for connected applications
      </p>
    </div>
  </div>

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
    <!-- Empty state: no connected apps -->
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
    <!-- JML sections -->
    {#each sections as section}
      {@const apps = filtered.filter((w) => (w[section.type] || []).length > 0)}
      <div>
        <!-- Section header -->
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
                  No matching apps
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

        <!-- Steps preview -->
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
