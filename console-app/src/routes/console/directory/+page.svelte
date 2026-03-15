<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  // --- Types ---
  interface SyncStatus {
    connected: boolean;
    provider?: string;
    status?: string;
    lastSyncAt?: string;
    userCount?: number;
    groupCount?: number;
  }

  interface DirectoryUser {
    id: string;
    name: string;
    email: string;
    department?: string;
    title?: string;
    status: string;
  }

  interface DirectoryGroup {
    id: string;
    name: string;
    description?: string;
    member_count: number;
  }

  interface Mapping {
    id: string;
    group_id: string;
    group_name: string;
    app_id: string;
    role: string;
    suggested: boolean;
  }

  // --- State ---
  let syncStatus: SyncStatus = { connected: false };
  let users: DirectoryUser[] = [];
  let usersTotal = 0;
  let groups: DirectoryGroup[] = [];
  let mappings: Mapping[] = [];

  let loading = true;
  let syncing = false;
  let suggesting = false;
  let activeTab: "users" | "groups" | "mappings" = "users";

  // Users pagination & search
  let userSearch = "";
  let userPage = 0;
  const pageSize = 20;

  $: filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q)
    );
  });

  $: pagedUsers = filteredUsers.slice(userPage * pageSize, (userPage + 1) * pageSize);
  $: totalPages = Math.ceil(filteredUsers.length / pageSize);

  // --- Data fetching ---
  async function fetchStatus(): Promise<SyncStatus> {
    try {
      const res = await fetch("/api/directory/sync/status");
      if (res.ok) return await res.json();
    } catch {}
    return { connected: false };
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/directory/users?limit=100");
      if (res.ok) {
        const data = await res.json();
        users = data.users || [];
        usersTotal = data.total || users.length;
      }
    } catch {}
  }

  async function fetchGroups() {
    try {
      const res = await fetch("/api/directory/groups");
      if (res.ok) {
        const data = await res.json();
        groups = data.groups || [];
      }
    } catch {}
  }

  async function fetchMappings() {
    try {
      const res = await fetch("/api/directory/mappings");
      if (res.ok) {
        const data = await res.json();
        mappings = Array.isArray(data) ? data : [];
      }
    } catch {}
  }

  async function loadAll() {
    loading = true;
    syncStatus = await fetchStatus();
    if (syncStatus.connected) {
      await Promise.all([fetchUsers(), fetchGroups(), fetchMappings()]);
    }
    loading = false;
  }

  // --- Actions ---
  async function triggerSync() {
    syncing = true;
    try {
      const res = await fetch("/api/directory/sync", { method: "POST" });
      if (res.ok) {
        pushToast({ message: "Directory sync started", variant: "success" });
        await loadAll();
      } else {
        pushToast({ message: "Sync failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Sync request failed", variant: "error" });
    }
    syncing = false;
  }

  async function autoSuggest() {
    suggesting = true;
    try {
      const res = await fetch("/api/directory/mappings/suggest", { method: "POST" });
      if (res.ok) {
        pushToast({ message: "Suggestions generated", variant: "success" });
        await fetchMappings();
      } else {
        pushToast({ message: "Auto-suggest failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Auto-suggest request failed", variant: "error" });
    }
    suggesting = false;
  }

  async function confirmMapping(id: string) {
    try {
      const res = await fetch(`/api/directory/mappings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        mappings = mappings.map((m) => (m.id === id ? { ...m, suggested: false } : m));
        pushToast({ message: "Mapping confirmed", variant: "success" });
      } else {
        pushToast({ message: "Failed to confirm mapping", variant: "error" });
      }
    } catch {
      pushToast({ message: "Confirm request failed", variant: "error" });
    }
  }

  async function removeMapping(id: string) {
    try {
      const res = await fetch(`/api/directory/mappings/${id}`, { method: "DELETE" });
      if (res.ok) {
        mappings = mappings.filter((m) => m.id !== id);
        pushToast({ message: "Mapping removed", variant: "info" });
      } else {
        pushToast({ message: "Failed to remove mapping", variant: "error" });
      }
    } catch {
      pushToast({ message: "Remove request failed", variant: "error" });
    }
  }

  function formatTime(iso: string | undefined): string {
    if (!iso) return "Never";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function statusColor(status: string): { bg: string; text: string } {
    switch (status.toLowerCase()) {
      case "active":
        return { bg: "rgba(34,197,94,0.15)", text: "#22c55e" };
      case "suspended":
      case "disabled":
        return { bg: "rgba(239,68,68,0.15)", text: "#ef4444" };
      case "pending":
        return { bg: "rgba(234,179,8,0.15)", text: "#eab308" };
      default:
        return { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.5)" };
    }
  }

  const tabs = [
    { id: "users" as const, label: "Users" },
    { id: "groups" as const, label: "Groups" },
    { id: "mappings" as const, label: "Mappings" },
  ];

  const providerIcons: Record<string, string> = {
    okta: "Okta",
    google_workspace: "Google Workspace",
    microsoft_365: "Microsoft 365",
    entra_id: "Entra ID",
  };

  onMount(loadAll);
</script>

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  {#if loading}
    <div class="text-center py-12" style="color: var(--color-text, #fff); opacity: 0.4;">
      <p>Loading directory...</p>
    </div>
  {:else if !syncStatus.connected}
    <!-- Not connected state -->
    <div class="max-w-2xl mx-auto py-12">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
          <svg class="w-8 h-8" style="color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 class="text-2xl font-semibold mb-2" style="color: var(--color-text, #fff);">Connect Your Identity Provider</h1>
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
          Sync users and groups from your IdP to automate access management
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        {#each [
          { id: "okta", name: "Okta", desc: "SSO and lifecycle management" },
          { id: "google_workspace", name: "Google Workspace", desc: "Google directory sync" },
          { id: "microsoft_365", name: "Microsoft 365", desc: "Entra ID / Azure AD sync" },
        ] as provider}
          <a
            href="/console/marketplace"
            class="rounded-lg p-5 text-center transition-colors"
            style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));"
          >
            <div class="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
              <svg class="w-5 h-5" style="color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="text-sm font-semibold mb-1" style="color: var(--color-text, #fff);">{provider.name}</div>
            <div class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{provider.desc}</div>
          </a>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Connected state -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold" style="color: var(--color-text, #fff);">Directory</h1>
          {#if syncStatus.provider}
            <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style="background: rgba(59,130,246,0.15); color: #60a5fa;">
              {providerIcons[syncStatus.provider] || syncStatus.provider}
            </span>
          {/if}
        </div>
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
          Last sync: {formatTime(syncStatus.lastSyncAt)} &middot;
          {syncStatus.userCount ?? users.length} users &middot;
          {syncStatus.groupCount ?? groups.length} groups
        </p>
      </div>
      <button
        type="button"
        on:click={triggerSync}
        disabled={syncing}
        class="text-sm px-4 py-2 rounded font-medium text-white disabled:opacity-50 transition-colors"
        style="background: var(--color-accent, #3b82f6);"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-6 border-b border-white/10 mb-6">
      {#each tabs as tab}
        <button
          type="button"
          on:click={() => activeTab = tab.id}
          class="pb-2 text-sm {activeTab === tab.id ? 'text-white border-b-2 border-indigo-500' : 'text-white/50 hover:text-white/80'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Users tab -->
    {#if activeTab === "users"}
      <div class="mb-4">
        <input
          type="text"
          bind:value={userSearch}
          placeholder="Search users by name, email, or department..."
          class="w-full max-w-md px-4 py-2.5 rounded-lg text-sm"
          style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
        />
      </div>

      <div class="rounded-lg overflow-hidden" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Name</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Email</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Department</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Title</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedUsers as user}
              {@const sc = statusColor(user.status)}
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td class="px-4 py-3" style="color: var(--color-text, #fff);">{user.name}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.7;">{user.email}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.5;">{user.department || "-"}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.5;">{user.title || "-"}</td>
                <td class="px-4 py-3">
                  <span class="text-[11px] px-2 py-0.5 rounded-full capitalize" style="background: {sc.bg}; color: {sc.text};">{user.status}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if pagedUsers.length === 0}
          <div class="text-center py-8" style="color: var(--color-text, #fff); opacity: 0.3;">
            <p>No users found</p>
          </div>
        {/if}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between mt-4">
          <span class="text-xs" style="color: var(--color-text, #fff); opacity: 0.5;">
            Showing {userPage * pageSize + 1}-{Math.min((userPage + 1) * pageSize, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              on:click={() => userPage = Math.max(0, userPage - 1)}
              disabled={userPage === 0}
              class="text-xs px-3 py-1.5 rounded disabled:opacity-30 transition-colors"
              style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
            >
              Previous
            </button>
            <button
              type="button"
              on:click={() => userPage = Math.min(totalPages - 1, userPage + 1)}
              disabled={userPage >= totalPages - 1}
              class="text-xs px-3 py-1.5 rounded disabled:opacity-30 transition-colors"
              style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Groups tab -->
    {#if activeTab === "groups"}
      <div class="rounded-lg overflow-hidden" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Group Name</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Members</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Description</th>
            </tr>
          </thead>
          <tbody>
            {#each groups as group}
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td class="px-4 py-3 font-medium" style="color: var(--color-text, #fff);">{group.name}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.7;">
                  <span class="text-[11px] px-2 py-0.5 rounded-full" style="background: rgba(59,130,246,0.12); color: #60a5fa;">
                    {group.member_count}
                  </span>
                </td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.5;">{group.description || "-"}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if groups.length === 0}
          <div class="text-center py-8" style="color: var(--color-text, #fff); opacity: 0.3;">
            <p>No groups found</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Mappings tab -->
    {#if activeTab === "mappings"}
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
          Map IdP groups to application roles for automatic provisioning
        </p>
        <button
          type="button"
          on:click={autoSuggest}
          disabled={suggesting}
          class="text-sm px-4 py-2 rounded font-medium text-white disabled:opacity-50 transition-colors"
          style="background: rgba(139,92,246,0.8);"
        >
          {suggesting ? "Suggesting..." : "Auto-suggest"}
        </button>
      </div>

      <div class="rounded-lg overflow-hidden" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Group</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">App</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Role</th>
              <th class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Status</th>
              <th class="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider" style="color: var(--color-text, #fff); opacity: 0.5;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each mappings as mapping}
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td class="px-4 py-3 font-medium" style="color: var(--color-text, #fff);">{mapping.group_name}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.7;">{mapping.app_id}</td>
                <td class="px-4 py-3" style="color: var(--color-text, #fff); opacity: 0.7;">{mapping.role}</td>
                <td class="px-4 py-3">
                  {#if mapping.suggested}
                    <span class="text-[11px] px-2 py-0.5 rounded-full" style="background: rgba(234,179,8,0.15); color: #eab308;">Suggested</span>
                  {:else}
                    <span class="text-[11px] px-2 py-0.5 rounded-full" style="background: rgba(34,197,94,0.15); color: #22c55e;">Confirmed</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  {#if mapping.suggested}
                    <button
                      type="button"
                      on:click={() => confirmMapping(mapping.id)}
                      class="text-xs px-2.5 py-1 rounded mr-1 transition-colors"
                      style="background: rgba(34,197,94,0.15); color: #22c55e;"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      on:click={() => removeMapping(mapping.id)}
                      class="text-xs px-2.5 py-1 rounded transition-colors"
                      style="background: rgba(239,68,68,0.1); color: #ef4444;"
                    >
                      Dismiss
                    </button>
                  {:else}
                    <button
                      type="button"
                      on:click={() => removeMapping(mapping.id)}
                      class="text-xs px-2.5 py-1 rounded transition-colors"
                      style="background: rgba(239,68,68,0.1); color: #ef4444;"
                    >
                      Remove
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if mappings.length === 0}
          <div class="text-center py-8" style="color: var(--color-text, #fff); opacity: 0.3;">
            <p>No mappings configured</p>
            <p class="text-xs mt-1">Use Auto-suggest to generate mappings from your groups</p>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
