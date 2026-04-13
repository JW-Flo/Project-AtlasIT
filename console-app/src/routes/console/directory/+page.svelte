<script lang="ts">
  import { onMount } from "svelte";
  import { PageHeader, Card, Badge, EmptyState, Button } from "$lib/components/ui";
  import { AlertCircle, RefreshCw, Search, Users, UsersRound as UsersIcon } from "lucide-svelte";

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

<svelte:head>
  <title>Directory · AtlasIT</title>
</svelte:head>

<div class="animate-fade-in">
  <PageHeader
    title="Directory"
    description={!loadingStatus && syncStatus
      ? `${syncStatus.userCount} users · ${syncStatus.groupCount} groups · last synced ${lastSynced()}`
      : "Loading directory…"}
  >
    <svelte:fragment slot="actions">
      <Button variant="outline" size="sm" on:click={refresh} disabled={refreshing}>
        <RefreshCw class={"h-3.5 w-3.5 " + (refreshing ? "animate-spin" : "")} strokeWidth={2.25} />
        Refresh
      </Button>
    </svelte:fragment>
  </PageHeader>

  <!-- Tab nav (refined) -->
  <div class="flex items-center justify-between flex-wrap gap-3 mb-5 border-b border-border">
    <div class="flex gap-1 -mb-px">
      <button
        on:click={() => { activeTab = "users"; searchQuery = ""; }}
        class={"px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " + (activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
      >
        Users
        {#if !loadingUsers}
          <Badge variant="muted" size="sm" class="ml-1.5">{users.length}</Badge>
        {/if}
      </button>
      <button
        on:click={() => { activeTab = "groups"; searchQuery = ""; }}
        class={"px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " + (activeTab === "groups" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
      >
        Groups
        {#if !loadingGroups}
          <Badge variant="muted" size="sm" class="ml-1.5">{groups.length}</Badge>
        {/if}
      </button>
    </div>
    <div class="relative max-w-xs flex-1 min-w-[200px] mb-2">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder={activeTab === "users" ? "Search users…" : "Search groups…"}
        class="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary focus:shadow-ring-primary"
      />
    </div>
  </div>

  <!-- Users Tab -->
  {#if activeTab === "users"}
    {#if loadingUsers}
      <Card padding="none" class="overflow-hidden">
        <div class="divide-y divide-border">
          {#each Array(6) as _}
            <div class="px-5 py-3 flex gap-4">
              <div class="h-4 w-48 skeleton"></div>
              <div class="h-4 w-32 skeleton"></div>
              <div class="h-4 w-24 skeleton"></div>
            </div>
          {/each}
        </div>
      </Card>
    {:else if errorUsers}
      <Card padding="md" class="bg-destructive-muted border-destructive/20">
        <div class="flex items-start gap-3">
          <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
          <div class="flex-1">
            <p class="text-sm text-destructive font-medium">Failed to load users: {errorUsers}</p>
            <Button variant="destructive" size="sm" class="mt-3" on:click={loadUsers}>Retry</Button>
          </div>
        </div>
      </Card>
    {:else if filteredUsers.length === 0}
      <Card padding="lg">
        <EmptyState
          title={searchQuery ? "No matches" : "No users in directory"}
          description={searchQuery ? "Try a different search term." : "Connect a directory provider to sync users."}
          icon={Users}
        />
      </Card>
    {:else}
      <Card padding="none" class="overflow-hidden">
        <div class="overflow-x-auto mobile-table-wrapper">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-muted/40 border-b border-border">
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th class="px-5 py-2.5 text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredUsers as user}
                <tr class="row-hover">
                  <td class="px-5 py-2.5 text-sm font-medium text-foreground">{user.email}</td>
                  <td class="px-5 py-2.5 text-sm text-foreground/80">{user.display_name ?? "—"}</td>
                  <td class="px-5 py-2.5 text-xs text-muted-foreground">{user.department ?? "—"}</td>
                  <td class="px-5 py-2.5 text-xs text-muted-foreground">{user.title ?? "—"}</td>
                  <td class="px-5 py-2.5">
                    <Badge
                      variant={user.status === "active" ? "success" : user.status === "suspended" ? "warning" : "muted"}
                      size="sm"
                      dot
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td class="px-5 py-2.5 text-xs text-muted-foreground tabular-nums text-right">{relativeTime(user.created_at)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
    {/if}
  {/if}

  <!-- Groups Tab -->
  {#if activeTab === "groups"}
    {#if loadingGroups}
      <Card padding="none" class="overflow-hidden">
        <div class="divide-y divide-border">
          {#each Array(4) as _}
            <div class="px-5 py-3 flex gap-4">
              <div class="h-4 w-40 skeleton"></div>
              <div class="h-4 w-56 skeleton"></div>
              <div class="h-4 w-16 skeleton"></div>
            </div>
          {/each}
        </div>
      </Card>
    {:else if errorGroups}
      <Card padding="md" class="bg-destructive-muted border-destructive/20">
        <div class="flex items-start gap-3">
          <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
          <div class="flex-1">
            <p class="text-sm text-destructive font-medium">Failed to load groups: {errorGroups}</p>
            <Button variant="destructive" size="sm" class="mt-3" on:click={loadGroups}>Retry</Button>
          </div>
        </div>
      </Card>
    {:else if filteredGroups.length === 0}
      <Card padding="lg">
        <EmptyState
          title={searchQuery ? "No matches" : "No groups in directory"}
          description={searchQuery ? "Try a different search term." : "Connect a directory provider to sync groups."}
          icon={UsersIcon}
        />
      </Card>
    {:else}
      <Card padding="none" class="overflow-hidden">
        <div class="overflow-x-auto mobile-table-wrapper">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-muted/40 border-b border-border">
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Members</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">External ID</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredGroups as group}
                <tr class="row-hover">
                  <td class="px-5 py-2.5 text-sm font-medium text-foreground">{group.name}</td>
                  <td class="px-5 py-2.5 text-xs text-muted-foreground">{group.description ?? "—"}</td>
                  <td class="px-5 py-2.5 text-sm text-foreground tabular-nums">{group.member_count}</td>
                  <td class="px-5 py-2.5 text-2xs text-muted-foreground font-mono">{group.external_id ?? "—"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
    {/if}
  {/if}
</div>
