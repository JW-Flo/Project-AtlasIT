<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Users, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Link, Check, X } from "lucide-svelte";

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

  function statusVariant(status: string): "success" | "destructive" | "warning" | "secondary" {
    switch (status.toLowerCase()) {
      case "active": return "success";
      case "suspended":
      case "disabled": return "destructive";
      case "pending": return "warning";
      default: return "secondary";
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

<div class="space-y-6">
  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>
  {:else if !syncStatus.connected}
    <!-- Not connected state -->
    <div class="max-w-2xl mx-auto py-12">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/10">
          <Users class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">Connect Your Identity Provider</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Sync users and groups from your IdP to automate access management
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        {#each [
          { id: "okta", name: "Okta", desc: "SSO and lifecycle management" },
          { id: "google_workspace", name: "Google Workspace", desc: "Google directory sync" },
          { id: "microsoft_365", name: "Microsoft 365", desc: "Entra ID / Azure AD sync" },
        ] as provider}
          <a href="/console/marketplace" class="block">
            <Card class="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent class="pt-5 text-center">
                <div class="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center bg-primary/10">
                  <Link class="w-5 h-5 text-primary" />
                </div>
                <div class="text-sm font-semibold mb-1">{provider.name}</div>
                <div class="text-xs text-muted-foreground">{provider.desc}</div>
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Connected state -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold tracking-tight">Directory</h1>
          {#if syncStatus.provider}
            <Badge variant="secondary">
              {providerIcons[syncStatus.provider] || syncStatus.provider}
            </Badge>
          {/if}
        </div>
        <p class="text-sm text-muted-foreground">
          Last sync: {formatTime(syncStatus.lastSyncAt)} &middot;
          {syncStatus.userCount ?? users.length} users &middot;
          {syncStatus.groupCount ?? groups.length} groups
        </p>
      </div>
      <Button on:click={triggerSync} disabled={syncing}>
        <RefreshCw class="h-4 w-4 mr-1.5 {syncing ? 'animate-spin' : ''}" />
        {syncing ? "Syncing..." : "Sync Now"}
      </Button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b">
      {#each tabs as tab}
        <button
          type="button"
          on:click={() => activeTab = tab.id}
          class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === tab.id
            ? 'text-foreground border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Users tab -->
    {#if activeTab === "users"}
      <div class="mb-4">
        <Input
          type="text"
          bind:value={userSearch}
          placeholder="Search users by name, email, or department..."
          class="max-w-md"
        />
      </div>

      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Name</th>
                  <th class="px-4 py-3 font-medium">Email</th>
                  <th class="px-4 py-3 font-medium">Department</th>
                  <th class="px-4 py-3 font-medium">Title</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each pagedUsers as user}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3">{user.name}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.department || "-"}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.title || "-"}</td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(user.status)} class="capitalize">{user.status}</Badge>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No users found</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            Showing {userPage * pageSize + 1}--{Math.min((userPage + 1) * pageSize, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" on:click={() => userPage = Math.max(0, userPage - 1)} disabled={userPage === 0}>
              <ChevronLeft class="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" on:click={() => userPage = Math.min(totalPages - 1, userPage + 1)} disabled={userPage >= totalPages - 1}>
              Next
              <ChevronRight class="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Groups tab -->
    {#if activeTab === "groups"}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Group Name</th>
                  <th class="px-4 py-3 font-medium">Members</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each groups as group}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3 font-medium">{group.name}</td>
                    <td class="px-4 py-3">
                      <Badge variant="secondary">{group.member_count}</Badge>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{group.description || "-"}</td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="3" class="px-4 py-8 text-center text-muted-foreground">No groups found</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Mappings tab -->
    {#if activeTab === "mappings"}
      <div class="flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Map IdP groups to application roles for automatic provisioning
        </p>
        <Button variant="secondary" on:click={autoSuggest} disabled={suggesting}>
          <Sparkles class="h-4 w-4 mr-1.5" />
          {suggesting ? "Suggesting..." : "Auto-suggest"}
        </Button>
      </div>

      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Group</th>
                  <th class="px-4 py-3 font-medium">App</th>
                  <th class="px-4 py-3 font-medium">Role</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each mappings as mapping}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3 font-medium">{mapping.group_name}</td>
                    <td class="px-4 py-3 text-muted-foreground">{mapping.app_id}</td>
                    <td class="px-4 py-3 text-muted-foreground">{mapping.role}</td>
                    <td class="px-4 py-3">
                      {#if mapping.suggested}
                        <Badge variant="warning">Suggested</Badge>
                      {:else}
                        <Badge variant="success">Confirmed</Badge>
                      {/if}
                    </td>
                    <td class="px-4 py-3 text-right">
                      {#if mapping.suggested}
                        <Button variant="ghost" size="sm" on:click={() => confirmMapping(mapping.id)}>
                          <Check class="h-4 w-4 mr-1 text-green-500" />
                          Confirm
                        </Button>
                        <Button variant="ghost" size="sm" on:click={() => removeMapping(mapping.id)}>
                          <X class="h-4 w-4 mr-1 text-destructive" />
                          Dismiss
                        </Button>
                      {:else}
                        <Button variant="ghost" size="sm" on:click={() => removeMapping(mapping.id)}>
                          <X class="h-4 w-4 mr-1 text-destructive" />
                          Remove
                        </Button>
                      {/if}
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                      <p>No mappings configured</p>
                      <p class="text-xs mt-1">Use Auto-suggest to generate mappings from your groups</p>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
