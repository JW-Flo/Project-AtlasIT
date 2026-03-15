<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { mark } from "$lib/instrumentation/ux-metrics";

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
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) throw new Error("Not authenticated");
      session = await sessionRes.json();
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

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  {#if showIdpBanner}
    <div class="bg-indigo-600/20 border border-indigo-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div>
        <div class="font-medium">Complete your directory setup</div>
        <div class="text-sm text-white/60">Authorize your identity provider to sync users and groups</div>
      </div>
      <a href="/console/marketplace" class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">
        Connect Now
      </a>
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div class="h-8 w-48 rounded bg-white/5 animate-pulse"></div>
      <div class="h-4 w-64 rounded bg-white/5 animate-pulse"></div>
      <div class="grid grid-cols-4 gap-4 mt-4">
        {#each [1, 2, 3, 4] as _}
          <div class="rounded-lg p-5 bg-white/5 border border-white/10 h-24 animate-pulse"></div>
        {/each}
      </div>
    </div>

  {:else if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-4">{error}</div>

  {:else if isPlatformOwner && platformData}
    <!-- Platform Owner Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-semibold mb-1">Platform Overview</h1>
        <p class="text-sm text-white/60">AtlasIT platform administration</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/console/admin" class="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded text-white">Admin</a>
        <a href="/console/settings" class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white">Settings</a>
        <button on:click={load} class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white">Refresh</button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/console/admin" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Total Tenants</div>
        <div class="text-3xl font-bold mt-1">{platformData.tenants.total}</div>
      </a>
      <a href="/console/admin" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Active Tenants</div>
        <div class="text-3xl font-bold mt-1">{platformData.tenants.active}</div>
      </a>
      <a href="/console/admin" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Total Users</div>
        <div class="text-3xl font-bold mt-1">{platformData.users.total}</div>
      </a>
      <a href="/console/workflows" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Workflows (24h)</div>
        <div class="text-3xl font-bold mt-1">{platformData.workflows.total}</div>
      </a>
    </div>

    <!-- Recent Tenants -->
    {#if platformData.recentTenants.length > 0}
      <div class="rounded-lg bg-[var(--color-surface,#1a2332)] border border-white/10 mb-6">
        <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Recent Tenants</h2>
          <a href="/console/admin" class="text-sm text-blue-400 hover:text-blue-300">View all</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-white/40 text-xs uppercase tracking-wider">
                <th class="px-5 py-3">Name</th>
                <th class="px-5 py-3">Owner</th>
                <th class="px-5 py-3">Users</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {#each platformData.recentTenants as tenant}
                <tr class="border-t border-white/5 hover:bg-white/5 cursor-pointer" on:click={() => window.location.href = '/console/admin'}>
                  <td class="px-5 py-3 font-medium"><a href="/console/admin" class="hover:text-indigo-400 transition-colors">{tenant.name}</a></td>
                  <td class="px-5 py-3 text-white/60">{tenant.owner || '-'}</td>
                  <td class="px-5 py-3 text-white/60">{tenant.users ?? '-'}</td>
                  <td class="px-5 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full {tenant.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">
                      {tenant.status}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-white/40">{tenant.created ? new Date(tenant.created).toLocaleDateString() : '-'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Recent Activity -->
    {#if platformData.recentActivity.length > 0}
      <div class="rounded-lg bg-[var(--color-surface,#1a2332)] border border-white/10">
        <div class="px-5 py-4 border-b border-white/10">
          <h2 class="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div class="divide-y divide-white/5">
          {#each platformData.recentActivity as entry}
            <div class="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-indigo-400/60 shrink-0"></div>
                <div>
                  <div class="text-sm">{entry.description || entry.action}</div>
                  {#if entry.tenant}
                    <div class="text-xs text-white/40 mt-0.5">{entry.tenant}</div>
                  {/if}
                </div>
              </div>
              <div class="text-xs text-white/30 shrink-0 ml-4">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  {:else if tenantData}
    <!-- Tenant Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-semibold mb-1">
          Dashboard
          {#if session?.orgName}
            <span class="text-lg font-normal text-white/40 ml-2">{session.orgName}</span>
          {/if}
        </h1>
        <p class="text-sm text-white/60">Your organization overview</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          on:click={copyInviteLink}
          class="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white"
          title="Copy team invite link"
        >{inviteCopied ? "Invite Link Copied" : "Invite Team"}</button>
        <a href="/console/workflows" class="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded text-white">View Workflows</a>
        <a href="/console/api-manager" class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white">API Manager</a>
        <button on:click={load} class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white">Refresh</button>
      </div>
    </div>

    <!-- Directory setup banner -->
    {#if tenantData.directory.connected === false}
      <div class="bg-amber-600/20 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <div class="font-medium">Connect your identity provider to get started</div>
          <div class="text-sm text-white/60">Sync users and groups from your directory to automate JML workflows</div>
        </div>
        <a href="/console/marketplace" class="text-sm bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-white">
          Connect Directory
        </a>
      </div>
    {/if}

    <!-- Getting started empty state -->
    {#if tenantData.connectedApps === 0 && !tenantData.directory.connected}
      <div class="rounded-lg p-8 bg-[var(--color-surface,#1a2332)] border border-dashed border-white/20 text-center mb-6">
        <h2 class="text-xl font-semibold mb-2">Welcome to AtlasIT</h2>
        <p class="text-white/60 mb-4 max-w-md mx-auto">Get started by connecting your identity provider and applications to automate compliance and lifecycle management.</p>
        <div class="flex gap-3 justify-center">
          <a href="/console/onboarding" class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">Setup Wizard</a>
          <a href="/console/marketplace" class="text-sm bg-white/10 hover:bg-white/15 px-4 py-2 rounded text-white">Browse Marketplace</a>
        </div>
      </div>
    {/if}

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/console/marketplace" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Connected Apps</div>
        <div class="text-3xl font-bold mt-1">{tenantData.connectedApps}</div>
      </a>
      <a href="/console/directory" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Directory Users</div>
        <div class="text-3xl font-bold mt-1">{tenantData.directory.userCount}</div>
      </a>
      <a href="/console/directory" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Active Mappings</div>
        <div class="text-3xl font-bold mt-1">{tenantData.activeMappings}</div>
      </a>
      <a href="/console/directory" class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-indigo-500/40 transition-colors cursor-pointer no-underline">
        <div class="text-sm text-white/50">Pending Suggestions</div>
        <div class="text-3xl font-bold mt-1">{tenantData.pendingSuggestions}</div>
      </a>
    </div>

    <!-- Pending suggestions CTA -->
    {#if tenantData.pendingSuggestions > 0}
      <div class="rounded-lg bg-indigo-600/10 border border-indigo-500/30 p-5 mb-6 flex items-center justify-between">
        <div>
          <div class="font-medium">Review {tenantData.pendingSuggestions} suggested app mapping{tenantData.pendingSuggestions !== 1 ? 's' : ''}</div>
          <div class="text-sm text-white/60 mt-1">AtlasIT detected apps that can be mapped to directory groups</div>
        </div>
        <a href="/console/directory" class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">
          Review Suggestions
        </a>
      </div>
    {/if}

    <!-- Recent Activity -->
    {#if tenantData.recentActivity.length > 0}
      <div class="rounded-lg bg-[var(--color-surface,#1a2332)] border border-white/10">
        <div class="px-5 py-4 border-b border-white/10">
          <h2 class="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div class="divide-y divide-white/5">
          {#each tenantData.recentActivity as entry}
            <div class="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-indigo-400/60 shrink-0"></div>
                <div>
                  <div class="text-sm">{entry.description || entry.action}</div>
                  {#if entry.user}
                    <div class="text-xs text-white/40 mt-0.5">{entry.user}</div>
                  {/if}
                </div>
              </div>
              <div class="text-xs text-white/30 shrink-0 ml-4">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
