<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { mark } from "$lib/instrumentation/ux-metrics";
  import { fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import {
    Users,
    Building2,
    UserCheck,
    Workflow,
    RefreshCw,
    Copy,
    ArrowRight,
    AlertTriangle,
    Link,
    Sparkles,
    LayoutGrid,
    Settings2,
  } from "lucide-svelte";
  import { WidgetGrid, WidgetPicker, DateRangePicker, FrameworkFilter, PRESET_LAYOUTS, type WidgetId, type PresetLayoutId } from "$lib/components/widgets";
  import {
    dashboardViews,
    fetchDashboardViews,
    saveDashboardViews,
    setActiveView,
    upsertView,
    deleteView,
    type DashboardView,
  } from "$lib/stores/dashboard-views";

  let loading = true;
  let error: string | null = null;
  let session: any = null;
  let isPlatformOwner = false;
  let showPlatformView = false;

  let platformData: {
    tenants: { total: number; active: number; disabled: number };
    users: { total: number };
    recentTenants: any[];
    recentActivity: any[];
    workflows: { total: number };
  } | null = null;

  // ── Widget dashboard state ────────────────────────────────────────────────
  let pickerOpen = false;
  let inviteCopied = false;
  let savingViewName = false;
  let newViewName = "";

  $: currentView = $dashboardViews.views.find((v) => v.id === $dashboardViews.activeViewId) || $dashboardViews.views[0];
  $: activeWidgets = currentView?.widgets ?? [];

  // Onboarding signals (lightweight — no full tenant fetch needed)
  let directoryConnected: boolean | null = null;
  let connectedAppsCount: number | null = null;
  let availableFrameworks: string[] = [];

  $: showIdpBanner = $page.url.searchParams.get("setup") === "idp";

  function switchView(id: string) {
    setActiveView(id);
    saveDashboardViews();
  }

  function handleWidgetChange(e: CustomEvent<WidgetId[]>) {
    if (!currentView) return;
    upsertView({ ...currentView, widgets: e.detail });
    saveDashboardViews();
  }

  async function saveAsNewView() {
    if (!newViewName.trim()) return;
    const id = `custom-${Date.now()}`;
    const view: DashboardView = {
      id,
      name: newViewName.trim(),
      widgets: [...activeWidgets],
    };
    upsertView(view);
    setActiveView(id);
    await saveDashboardViews();
    newViewName = "";
    savingViewName = false;
    pushToast({ message: `View "${view.name}" saved`, variant: "success" });
  }

  function handleDeleteView(id: string) {
    deleteView(id);
    saveDashboardViews();
  }

  async function trackGrowthEvent(event: string, inviteId: string) {
    mark(`growth:${event}`, { inviteId });
    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, inviteId }),
      });
    } catch {
      // non-blocking analytics
    }
  }

  async function copyInviteLink() {
    if (!session?.tenantId) return;
    try {
      const url = new URL(`${window.location.origin}/console/login`);
      url.searchParams.set("invite", session.tenantId);
      await navigator.clipboard.writeText(url.toString());
      inviteCopied = true;
      pushToast({ message: "Invite link copied. Share it with your team.", variant: "success" });
      await trackGrowthEvent("invite_link_copied", session.tenantId);
    } catch {
      pushToast({ message: "Could not copy link. Please copy it manually.", variant: "error" });
    }
  }

  async function load() {
    loading = true;
    error = null;

    try {
      session = await fetchSession();
      if (!session) throw new Error("Not authenticated");

      const email = session.email || "";
      isPlatformOwner =
        (email.endsWith("@atlasit.pro") || email.endsWith("@atlas.app")) &&
        session.superAdmin === true &&
        !session.impersonating;

      if (isPlatformOwner && !session.tenantId) {
        showPlatformView = true;
      }

      if (isPlatformOwner) {
        const res = await fetch("/api/platform/dashboard");
        if (res.ok) platformData = await res.json();
        if (!session.tenantId) return;
      }

      // Load saved views + lightweight onboarding check in parallel
      const [, tenantRes] = await Promise.all([
        fetchDashboardViews(),
        fetch("/api/tenant/dashboard"),
      ]);
      if (tenantRes.ok) {
        const td = await tenantRes.json();
        directoryConnected = td.directory?.connected ?? null;
        connectedAppsCount = td.connectedApps ?? null;
        // Extract framework names for the filter
        if (td.compliance?.scores) {
          availableFrameworks = td.compliance.scores.map((s: any) => s.framework);
        }
      }
    } catch (e: any) {
      error = e?.message || "Failed to load dashboard";
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

<div class="space-y-6">
  {#if showIdpBanner}
    <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
      <div>
        <div class="font-medium text-foreground">Complete your directory setup</div>
        <div class="text-sm text-muted-foreground">Authorize your identity provider to sync users and groups</div>
      </div>
      <Button href="/console/marketplace" size="sm">
        <Link class="h-4 w-4 mr-2" />
        Connect Now
      </Button>
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-64" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {#each [1, 2, 3, 4] as _}
          <Skeleton class="h-24 rounded-lg" />
        {/each}
      </div>
    </div>

  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>

  {:else if showPlatformView && platformData}
    <!-- ════════ Platform Owner Dashboard (unchanged) ════════ -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p class="text-sm text-muted-foreground">AtlasIT platform administration</p>
      </div>
      <div class="flex items-center gap-2">
        {#if session?.tenantId}
          <Button on:click={() => { showPlatformView = false; }} variant="outline" size="sm">
            My Dashboard
          </Button>
        {/if}
        <Button href="/console/admin" variant="outline" size="sm">Admin</Button>
        <Button href="/console/settings" variant="outline" size="sm">Settings</Button>
        <Button on:click={load} variant="secondary" size="sm">
          <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Total Tenants</div>
              <Building2 class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.tenants.total}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Active Tenants</div>
              <UserCheck class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.tenants.active}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Total Users</div>
              <Users class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.users.total}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/workflows" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Workflows (24h)</div>
              <Workflow class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.workflows.total}</div>
          </CardContent>
        </Card>
      </a>
    </div>

    {#if platformData.recentTenants.length > 0}
      <Card class="mb-6">
        <CardHeader class="flex-row items-center justify-between">
          <CardTitle>Recent Tenants</CardTitle>
          <Button href="/console/admin" variant="ghost" size="sm">
            View all
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-5 py-3 font-medium">Name</th>
                  <th class="px-5 py-3 font-medium">Owner</th>
                  <th class="px-5 py-3 font-medium">Users</th>
                  <th class="px-5 py-3 font-medium">Status</th>
                  <th class="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {#each platformData.recentTenants as tenant}
                  <tr class="border-t hover:bg-muted/50 cursor-pointer" on:click={() => window.location.href = `/console/admin?tenant=${tenant.id}`}>
                    <td class="px-5 py-3 font-medium">
                      <a href={`/console/admin?tenant=${tenant.id}`} class="hover:text-primary transition-colors">{tenant.name}</a>
                    </td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.owner || '-'}</td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.users ?? '-'}</td>
                    <td class="px-5 py-3">
                      <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.created ? new Date(tenant.created).toLocaleDateString() : '-'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}

    {#if platformData.recentActivity.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            {#each platformData.recentActivity as entry}
              <div class="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                  <div>
                    <div class="text-sm">{entry.description || entry.action}</div>
                    {#if entry.tenant}
                      <div class="text-xs text-muted-foreground mt-0.5">{entry.tenant}</div>
                    {/if}
                  </div>
                </div>
                <div class="text-xs text-muted-foreground shrink-0 ml-4">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

  {:else}
    <!-- ════════ Tenant Widget Dashboard ════════ -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Dashboard
          {#if session?.orgName}
            <span class="text-lg font-normal text-muted-foreground ml-2">{session.orgName}</span>
          {/if}
        </h1>
        <p class="text-sm text-muted-foreground">Your organization overview</p>
      </div>
      <div class="flex items-center gap-2">
        {#if isPlatformOwner && platformData}
          <Button on:click={() => { showPlatformView = true; }} variant="outline" size="sm">
            Platform Overview
          </Button>
        {/if}
        <Button on:click={copyInviteLink} size="sm" title="Copy team invite link">
          <Copy class="h-3.5 w-3.5 mr-1.5" />
          {inviteCopied ? "Invite Link Copied" : "Invite Team"}
        </Button>
        <Button on:click={() => (pickerOpen = true)} variant="outline" size="sm" title="Customize widgets">
          <Settings2 class="h-3.5 w-3.5 mr-1.5" />
          Customize
        </Button>
        <Button on:click={load} variant="ghost" size="sm">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Directory setup banner -->
    {#if directoryConnected === false}
      <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div class="font-medium text-foreground">Connect your identity provider to get started</div>
          <div class="text-sm text-muted-foreground">Sync users and groups from your directory to automate JML workflows</div>
        </div>
        <Button href="/console/marketplace" size="sm" variant="outline">
          Connect Directory
        </Button>
      </div>
    {/if}

    <!-- Getting started empty state -->
    {#if connectedAppsCount === 0 && directoryConnected === false}
      <Card class="border-dashed">
        <CardContent class="py-8 text-center">
          <Sparkles class="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h2 class="text-xl font-semibold mb-2">Welcome to AtlasIT</h2>
          <p class="text-muted-foreground mb-4 max-w-md mx-auto">Get started by connecting your identity provider and applications to automate compliance and lifecycle management.</p>
          <div class="flex gap-3 justify-center">
            <Button href="/console/onboarding">Setup Wizard</Button>
            <Button href="/console/marketplace" variant="outline">Browse Marketplace</Button>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- View selector -->
    <div class="flex items-center gap-2 flex-wrap">
      <LayoutGrid class="h-4 w-4 text-muted-foreground" />
      <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">View</span>
      {#each $dashboardViews.views as view (view.id)}
        <button
          class="group relative rounded-md px-3 py-1 text-xs font-medium transition-colors
            {$dashboardViews.activeViewId === view.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          on:click={() => switchView(view.id)}
        >
          {view.name}
        </button>
      {/each}

      {#if savingViewName}
        <form class="flex items-center gap-1" on:submit|preventDefault={saveAsNewView}>
          <input
            type="text"
            class="h-6 w-28 rounded border border-border bg-background px-2 text-xs"
            placeholder="View name..."
            bind:value={newViewName}
            autofocus
          />
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" type="submit">Save</Button>
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" on:click={() => (savingViewName = false)}>Cancel</Button>
        </form>
      {:else}
        <button
          class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          on:click={() => (savingViewName = true)}
          title="Save current layout as a new view"
        >
          + Save View
        </button>
      {/if}
    </div>

    <!-- Global filters + export -->
    <div class="flex flex-wrap items-center gap-3">
      <DateRangePicker />
      <FrameworkFilter frameworks={availableFrameworks} />
      <div class="ml-auto flex items-center gap-2" data-no-print>
        <Button variant="outline" size="sm" class="h-8 text-xs" on:click={() => window.print()}>
          Print PDF
        </Button>
      </div>
    </div>

    <!-- Widget grid -->
    <WidgetGrid widgets={activeWidgets} />

    <!-- Widget picker modal -->
    <WidgetPicker bind:open={pickerOpen} {activeWidgets} on:change={handleWidgetChange} />
  {/if}
</div>
