<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Users, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Link, Check, X, Plus, Trash2 } from "lucide-svelte";

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
    console_user_id?: string;
  }

  interface DirectoryGroup {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
  }

  interface Mapping {
    id: string;
    groupId: string;
    groupName: string;
    appId: string;
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

  // Reset pagination when search changes
  $: userSearch, (userPage = 0);

  $: pagedUsers = filteredUsers.slice(userPage * pageSize, (userPage + 1) * pageSize);
  $: totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Add User dialog state
  let addUserOpen = false;
  let addUserLoading = false;
  let addUserForm = { email: "", displayName: "", department: "", title: "" };

  // Add Group dialog state
  let addGroupOpen = false;
  let addGroupLoading = false;
  let addGroupForm = { name: "", description: "" };

  // Delete confirmation dialog state
  let deleteOpen = false;
  let deleteLoading = false;
  let deleteTarget: { type: "user" | "group"; id: string; name: string } | null = null;

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
        users = (data.users || []).map((u: any) => ({
          ...u,
          name: u.display_name || u.name || u.email,
        }));
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
        mappings = data.mappings || [];
      }
    } catch {}
  }

  async function loadAll() {
    loading = true;
    syncStatus = await fetchStatus();
    const promises: Promise<void>[] = [fetchUsers(), fetchGroups(), fetchMappings()];
    await Promise.all(promises);
    loading = false;

    // Auto-generate mapping suggestions if there are groups but no mappings yet
    if (groups.length > 0 && mappings.length === 0) {
      autoSuggest().catch(() => {});
    }
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
        const data = await res.json();
        if (data.suggestions?.length > 0) {
          pushToast({ message: `${data.suggestions.length} mapping suggestion(s) generated`, variant: "success" });
        } else {
          pushToast({ message: data.message || "No suggestions could be generated. Connect apps and sync your directory first.", variant: "info" });
        }
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

  // --- Add User ---
  async function submitAddUser() {
    if (!addUserForm.email) return;
    addUserLoading = true;
    try {
      const res = await fetch("/api/directory/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: addUserForm.email,
          displayName: addUserForm.displayName || undefined,
          department: addUserForm.department || undefined,
          title: addUserForm.title || undefined,
        }),
      });
      if (res.ok) {
        pushToast({ message: "User added", variant: "success" });
        addUserOpen = false;
        addUserForm = { email: "", displayName: "", department: "", title: "" };
        await fetchUsers();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to add user" }));
        pushToast({ message: data.error || "Failed to add user", variant: "error" });
      }
    } catch {
      pushToast({ message: "Add user request failed", variant: "error" });
    }
    addUserLoading = false;
  }

  // --- Add Group ---
  async function submitAddGroup() {
    if (!addGroupForm.name) return;
    addGroupLoading = true;
    try {
      const res = await fetch("/api/directory/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: addGroupForm.name,
          description: addGroupForm.description || undefined,
        }),
      });
      if (res.ok) {
        pushToast({ message: "Group added", variant: "success" });
        addGroupOpen = false;
        addGroupForm = { name: "", description: "" };
        await fetchGroups();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to add group" }));
        pushToast({ message: data.error || "Failed to add group", variant: "error" });
      }
    } catch {
      pushToast({ message: "Add group request failed", variant: "error" });
    }
    addGroupLoading = false;
  }

  // --- Delete ---
  function openDeleteDialog(type: "user" | "group", id: string, name: string) {
    deleteTarget = { type, id, name };
    deleteOpen = true;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    const { type, id } = deleteTarget;
    const endpoint = type === "user" ? `/api/directory/users/${id}` : `/api/directory/groups/${id}`;
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        pushToast({ message: `${type === "user" ? "User" : "Group"} deleted`, variant: "success" });
        if (type === "user") await fetchUsers();
        else await fetchGroups();
      } else {
        const data = await res.json().catch(() => ({ error: "Delete failed" }));
        pushToast({ message: data.error || "Delete failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Delete request failed", variant: "error" });
    }
    deleteLoading = false;
    deleteOpen = false;
    deleteTarget = null;
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

  $: tabs = [
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

  onMount(() => {
    const tabParam = $page.url.searchParams.get("tab");
    if (tabParam === "mappings" || tabParam === "groups" || tabParam === "users") {
      activeTab = tabParam;
    }
    loadAll();
  });
</script>

<div class="space-y-6">
  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>
  {:else}
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold tracking-tight">Directory</h1>
          {#if syncStatus.connected && syncStatus.provider}
            <Badge variant="secondary">
              {providerIcons[syncStatus.provider] || syncStatus.provider}
            </Badge>
          {/if}
        </div>
        {#if syncStatus.connected}
          <p class="text-sm text-muted-foreground">
            Last sync: {formatTime(syncStatus.lastSyncAt)} &middot;
            {syncStatus.userCount ?? users.length} users &middot;
            {syncStatus.groupCount ?? groups.length} groups
          </p>
        {:else}
          <p class="text-sm text-muted-foreground">
            Manage users and groups manually, or connect an identity provider for automatic sync
          </p>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if !syncStatus.connected}
          <a href="/console/marketplace">
            <Button variant="outline">
              <Link class="h-4 w-4 mr-1.5" />
              Connect IdP
            </Button>
          </a>
        {:else}
          <Button on:click={triggerSync} disabled={syncing}>
            <RefreshCw class="h-4 w-4 mr-1.5 {syncing ? 'animate-spin' : ''}" />
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        {/if}
      </div>
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
      <div class="flex items-center justify-between gap-4 mb-4">
        <Input
          type="text"
          bind:value={userSearch}
          placeholder="Search users by name, email, or department..."
          class="max-w-md"
        />
        <Button on:click={() => { addUserForm = { email: "", displayName: "", department: "", title: "" }; addUserOpen = true; }}>
          <Plus class="h-4 w-4 mr-1.5" />
          Add User
        </Button>
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
                  <th class="px-4 py-3 font-medium">Console Access</th>
                  <th class="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {#each pagedUsers as user}
                  <tr
                    class="border-t hover:bg-muted/50 cursor-pointer"
                    on:click={() => goto(`/console/directory/users/${user.id}`)}
                  >
                    <td class="px-4 py-3">{user.name}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.department || "-"}</td>
                    <td class="px-4 py-3 text-muted-foreground">{user.title || "-"}</td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(user.status)} class="capitalize">{user.status}</Badge>
                    </td>
                    <td class="px-4 py-3">
                      {#if user.console_user_id}
                        <Badge variant="secondary">Console Access</Badge>
                      {:else}
                        <span class="text-muted-foreground">-</span>
                      {/if}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-muted transition-colors"
                        on:click|stopPropagation={() => openDeleteDialog("user", user.id, user.name)}
                        title="Delete user"
                      >
                        <Trash2 class="h-4 w-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-muted-foreground">No users found</td>
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
      <div class="flex items-center justify-end mb-4">
        <Button on:click={() => { addGroupForm = { name: "", description: "" }; addGroupOpen = true; }}>
          <Plus class="h-4 w-4 mr-1.5" />
          Add Group
        </Button>
      </div>

      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Group Name</th>
                  <th class="px-4 py-3 font-medium">Members</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                  <th class="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {#each groups as group}
                  <tr
                    class="border-t hover:bg-muted/50 cursor-pointer"
                    on:click={() => goto(`/console/directory/groups/${group.id}`)}
                  >
                    <td class="px-4 py-3 font-medium">{group.name}</td>
                    <td class="px-4 py-3">
                      <Badge variant="secondary">{group.memberCount}</Badge>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{group.description || "-"}</td>
                    <td class="px-4 py-3 text-right">
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-muted transition-colors"
                        on:click|stopPropagation={() => openDeleteDialog("group", group.id, group.name)}
                        title="Delete group"
                      >
                        <Trash2 class="h-4 w-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-muted-foreground">No groups found</td>
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
                    <td class="px-4 py-3 font-medium">{mapping.groupName}</td>
                    <td class="px-4 py-3 text-muted-foreground">{mapping.appId}</td>
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

<!-- Add User Dialog -->
<Dialog open={addUserOpen} onClose={() => addUserOpen = false} title="Add User">
  <form on:submit|preventDefault={submitAddUser} class="space-y-4">
    <div class="space-y-1.5">
      <Label htmlFor="add-user-email">Email *</Label>
      <Input id="add-user-email" type="email" bind:value={addUserForm.email} placeholder="user@example.com" required />
    </div>
    <div class="space-y-1.5">
      <Label htmlFor="add-user-name">Display Name</Label>
      <Input id="add-user-name" type="text" bind:value={addUserForm.displayName} placeholder="Jane Doe" />
    </div>
    <div class="space-y-1.5">
      <Label htmlFor="add-user-dept">Department</Label>
      <Input id="add-user-dept" type="text" bind:value={addUserForm.department} placeholder="Engineering" />
    </div>
    <div class="space-y-1.5">
      <Label htmlFor="add-user-title">Title</Label>
      <Input id="add-user-title" type="text" bind:value={addUserForm.title} placeholder="Software Engineer" />
    </div>
    <DialogFooter>
      <Button variant="outline" type="button" on:click={() => addUserOpen = false}>Cancel</Button>
      <Button type="submit" disabled={!addUserForm.email || addUserLoading}>
        {addUserLoading ? "Adding..." : "Add User"}
      </Button>
    </DialogFooter>
  </form>
</Dialog>

<!-- Add Group Dialog -->
<Dialog open={addGroupOpen} onClose={() => addGroupOpen = false} title="Add Group">
  <form on:submit|preventDefault={submitAddGroup} class="space-y-4">
    <div class="space-y-1.5">
      <Label htmlFor="add-group-name">Name *</Label>
      <Input id="add-group-name" type="text" bind:value={addGroupForm.name} placeholder="Engineering" required />
    </div>
    <div class="space-y-1.5">
      <Label htmlFor="add-group-desc">Description</Label>
      <Input id="add-group-desc" type="text" bind:value={addGroupForm.description} placeholder="Engineering team members" />
    </div>
    <DialogFooter>
      <Button variant="outline" type="button" on:click={() => addGroupOpen = false}>Cancel</Button>
      <Button type="submit" disabled={!addGroupForm.name || addGroupLoading}>
        {addGroupLoading ? "Adding..." : "Add Group"}
      </Button>
    </DialogFooter>
  </form>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog open={deleteOpen} onClose={() => { deleteOpen = false; deleteTarget = null; }} title="Confirm Delete">
  {#if deleteTarget}
    <p class="text-sm text-muted-foreground mb-2">
      Are you sure you want to delete <strong class="text-foreground">{deleteTarget.name}</strong>?
    </p>
    <p class="text-xs text-muted-foreground">
      This action cannot be undone.{#if deleteTarget.type === "group"} All group memberships and app mappings will also be removed.{/if}
    </p>
    <DialogFooter>
      <Button variant="outline" on:click={() => { deleteOpen = false; deleteTarget = null; }}>Cancel</Button>
      <Button variant="destructive" on:click={confirmDelete} disabled={deleteLoading}>
        {deleteLoading ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  {/if}
</Dialog>
