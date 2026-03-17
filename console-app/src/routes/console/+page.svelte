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
  import Avatar from "$lib/components/ui/avatar.svelte";
  import {
    Users,
    AppWindow,
    GitBranch,
    Lightbulb,
    Building2,
    UserCheck,
    Workflow,
    RefreshCw,
    Copy,
    ArrowRight,
    AlertTriangle,
    Link,
    Sparkles,
  } from "lucide-svelte";

  // Session / view type
  let isPlatformOwner = false;
  let sessionLoaded = false;
  let session: any = null;

  // Shared
  let loading = true;
  let error: string | null = null;

  // Platform owner data
  let platformData: {
    tenants: { total: number; active: number; disabled: number };
    users: { total: number };
    recentTenants: any[];
    recentActivity: any[];
    workflows: { total: number };
  } | null = null;

  // Tenant data
  let tenantData: {
    connectedApps: number;
    directory: { connected: boolean; provider: string | null; userCount: number; groupCount: number; lastSync: string | null };
    activeMappings: number;
    pendingSuggestions: number;
    recentActivity: any[];
    workflows: { total: number };
  } | null = null;

  // Invite
  let inviteCopied = false;

  function escapeCSV(value: string | number | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
    if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
      return '"' + safe.replace(/"/g, '""') + '"';
    }
    return safe;
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
      // Fetch session
      session = await fetchSession();
      if (!session) throw new Error("Not authenticated");
      sessionLoaded = true;

      const email = session.email || "";
      isPlatformOwner = (email.endsWith("@atlasit.pro") || email.endsWith("@atlas.app")) && session.superAdmin === true && !session.impersonating;

      if (isPlatformOwner) {
        const res = await fetch("/api/platform/dashboard");
        if (!res.ok) throw new Error(`Dashboard fetch failed (${res.status})`);
        platformData = await res.json();
      } else {
        const res = await fetch("/api/tenant/dashboard");
        if (!res.ok) throw new Error(`Dashboard fetch failed (${res.status})`);
        tenantData = await res.json();
      }
    } catch (e: any) {
      error = e?.message || "Failed to load dashboard";
    } finally {
      loading = false;
    }
  }

  // Check for ?setup=idp
  $: showIdpBanner = $page.url.searchParams.get("setup") === "idp";

  onMount(load);
</script>

<div>
  {#if showIdpBanner}
    <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
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

  {:else if isPlatformOwner && platformData}
    <!-- Platform Owner Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p class="text-sm text-muted-foreground">AtlasIT platform administration</p>
      </div>
      <div class="flex items-center gap-2">
        <Button href="/console/admin" variant="outline" size="sm">Admin</Button>
        <Button href="/console/settings" variant="outline" size="sm">Settings</Button>
        <Button on:click={load} variant="secondary" size="sm">
          <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Stat cards -->
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

    <!-- Recent Tenants -->
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
                  <tr class="border-t hover:bg-muted/50 cursor-pointer" on:click={() => window.location.href = '/console/admin'}>
                    <td class="px-5 py-3 font-medium">
                      <a href="/console/admin" class="hover:text-primary transition-colors">{tenant.name}</a>
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

    <!-- Recent Activity -->
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

  {:else if tenantData}
    <!-- Tenant Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
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
        <Button on:click={copyInviteLink} size="sm" title="Copy team invite link">
          <Copy class="h-3.5 w-3.5 mr-1.5" />
          {inviteCopied ? "Invite Link Copied" : "Invite Team"}
        </Button>
        <Button href="/console/workflows" variant="secondary" size="sm">View Workflows</Button>
        <!-- API Manager: route not yet implemented -->
        <Button on:click={load} variant="ghost" size="sm">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Directory setup banner -->
    {#if tenantData?.directory?.connected === false}
      <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-center justify-between">
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
    {#if tenantData?.connectedApps === 0 && !tenantData?.directory?.connected}
      <Card class="border-dashed mb-6">
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

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/console/marketplace" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Connected Apps</div>
              <AppWindow class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{tenantData.connectedApps}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/directory" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Directory Users</div>
              <Users class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{tenantData?.directory?.userCount ?? 0}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/directory" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Active Mappings</div>
              <GitBranch class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{tenantData.activeMappings}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/directory" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Pending Suggestions</div>
              <Lightbulb class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{tenantData.pendingSuggestions}</div>
          </CardContent>
        </Card>
      </a>
    </div>

    <!-- Pending suggestions CTA -->
    {#if tenantData.pendingSuggestions > 0}
      <Card class="border-primary/20 bg-primary/5 mb-6">
        <CardContent class="py-4 flex items-center justify-between">
          <div>
            <div class="font-medium">Review {tenantData.pendingSuggestions} suggested app mapping{tenantData.pendingSuggestions !== 1 ? 's' : ''}</div>
            <div class="text-sm text-muted-foreground mt-1">AtlasIT detected apps that can be mapped to directory groups</div>
          </div>
          <Button href="/console/directory" size="sm">
            Review Suggestions
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    {/if}

    <!-- Recent Activity -->
    {#if tenantData.recentActivity.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            {#each tenantData.recentActivity as entry}
              <div class="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                  <div>
                    <div class="text-sm">{entry.description || entry.action}</div>
                    {#if entry.user}
                      <div class="text-xs text-muted-foreground mt-0.5">{entry.user}</div>
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
  {/if}
</div>
