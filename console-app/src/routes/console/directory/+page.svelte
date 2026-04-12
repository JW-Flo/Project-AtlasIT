<script lang="ts">
  import { onMount } from "svelte";

  interface DirectoryUser {
    id: string;
    email: string;
    external_id?: string;
    department?: string;
    title?: string;
    status: string;
    display_name?: string;
    created_at: string;
  }

  interface DirectoryGroup {
    id: string;
    name: string;
    description?: string;
    external_id?: string;
    member_count: number;
  }

  interface SyncStatus {
    userCount: number;
    groupCount: number;
    connections: Array<{ lastSyncAt?: string }>;
  }

  let users: DirectoryUser[] = [];
  let groups: DirectoryGroup[] = [];
  let syncStatus: SyncStatus | null = null;
  let loadingUsers = true;
  let loadingGroups = true;
  let loadingStatus = true;
  let errorUsers: string | null = null;
  let errorGroups: string | null = null;
  let activeTab: "users" | "groups" = "users";
  let searchQuery = "";
  let refreshing = false;

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  }

  function lastSynced(): string {
    if (!syncStatus?.connections?.length) return "never";
    const dates = syncStatus.connections
      .filter((c) => c.lastSyncAt)
      .map((c) => new Date(c.lastSyncAt!).getTime());
    if (!dates.length) return "never";
    return relativeTime(new Date(Math.max(...dates)).toISOString());
  }

  async function loadUsers() {
    loadingUsers = true;
    errorUsers = null;
    try {
      const res = await fetch("/api/v1/directory/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      users = result?.data?.items ?? [];
    } catch (e) {
      errorUsers = (e as Error).message;
    } finally {
      loadingUsers = false;
    }
  }

  async function loadGroups() {
    loadingGroups = true;
    errorGroups = null;
    try {
      const res = await fetch("/api/v1/directory/groups");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      groups = result?.data?.items ?? [];
    } catch (e) {
      errorGroups = (e as Error).message;
    } finally {
      loadingGroups = false;
    }
  }

  async function loadSyncStatus() {
    loadingStatus = true;
    try {
      const res = await fetch("/api/v1/directory/sync/status");
      if (!res.ok) return;
      const result = await res.json();
      syncStatus = result?.data ?? null;
    } catch {
      // non-critical
    } finally {
      loadingStatus = false;
    }
  }

  async function refresh() {
    refreshing = true;
    await Promise.all([loadUsers(), loadGroups(), loadSyncStatus()]);
    refreshing = false;
  }

  onMount(() => {
    loadUsers();
    loadGroups();
    loadSyncStatus();
  });

  $: filteredUsers = searchQuery.trim()
    ? users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          (u.department ?? "").toLowerCase().includes(q) ||
          (u.title ?? "").toLowerCase().includes(q)
        );
      })
    : users;

  $: filteredGroups = searchQuery.trim()
    ? groups.filter((g) => {
        const q = searchQuery.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          (g.description ?? "").toLowerCase().includes(q)
        );
      })
    : groups;
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Directory</h1>
      {#if !loadingStatus && syncStatus}
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {syncStatus.userCount} users &middot; {syncStatus.groupCount} groups &middot; last synced {lastSynced()}
        </p>
      {:else if loadingStatus}
        <div class="mt-2 h-4 w-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
      {/if}
    </div>
    <button
      on:click={refresh}
      disabled={refreshing}
      class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
    >
      <span class={refreshing ? "animate-spin inline-block" : ""}>&#8635;</span>
      Refresh
    </button>
  </div>

  <!-- Tab Nav -->
  <div class="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
    <button
      on:click={() => { activeTab = "users"; searchQuery = ""; }}
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'users'
        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
    >
      Users {#if !loadingUsers}({users.length}){/if}
    </button>
    <button
      on:click={() => { activeTab = "groups"; searchQuery = ""; }}
      class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'groups'
        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
    >
      Groups {#if !loadingGroups}({groups.length}){/if}
    </button>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder={activeTab === "users" ? "Search users..." : "Search groups..."}
      class="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <!-- Users Tab -->
  {#if activeTab === "users"}
    {#if loadingUsers}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          {#each Array(6) as _}
            <div class="px-6 py-4 flex gap-4">
              <div class="h-4 w-48 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-4 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if errorUsers}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">Failed to load users: {errorUsers}</p>
        <button
          on:click={loadUsers}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if filteredUsers.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">
          {searchQuery ? "No users match your search." : "No users found."}
        </p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each filteredUsers as user}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.display_name ?? "—"}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.department ?? "—"}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.title ?? "—"}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    {user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                    {user.status === 'inactive' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                    {user.status === 'suspended' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                    {!['active','inactive','suspended'].includes(user.status) ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}">
                    {user.status}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{relativeTime(user.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  <!-- Groups Tab -->
  {#if activeTab === "groups"}
    {#if loadingGroups}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          {#each Array(4) as _}
            <div class="px-6 py-4 flex gap-4">
              <div class="h-4 w-40 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-4 w-56 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if errorGroups}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">Failed to load groups: {errorGroups}</p>
        <button
          on:click={loadGroups}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if filteredGroups.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">
          {searchQuery ? "No groups match your search." : "No groups found."}
        </p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">External ID</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each filteredGroups as group}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{group.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{group.description ?? "—"}</td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">{group.member_count}</td>
                <td class="px-6 py-4 text-sm text-gray-400 dark:text-gray-500 font-mono text-xs">{group.external_id ?? "—"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
