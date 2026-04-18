<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Separator from "$lib/components/ui/separator.svelte";
  import { ArrowLeft, Save, Trash2, Plus, Users, Shield } from "lucide-svelte";

  interface DirectoryUser {
    id: string;
    external_id: string;
    email: string;
    display_name: string;
    department: string | null;
    title: string | null;
    status: string;
    source: string;
    console_user_id: string | null;
    created_at: string;
    updated_at: string;
  }

  interface GroupMembership {
    id: string;
    name: string;
    description: string | null;
    joined_at: string;
  }

  interface DirectoryGroup {
    id: string;
    name: string;
    description: string | null;
    member_count: number;
  }

  let user: DirectoryUser | null = null;
  let groups: GroupMembership[] = [];
  let allGroups: DirectoryGroup[] = [];
  let loading = true;
  let saving = false;
  let error = "";

  // Edit form
  let editDisplayName = "";
  let editDepartment = "";
  let editTitle = "";
  let editStatus = "active";

  // Add-to-group
  let selectedGroupId = "";
  let addingToGroup = false;

  $: userId = $page.params.id;
  $: availableGroups = allGroups.filter((g) => !groups.some((m) => m.id === g.id));

  function statusVariant(status: string): "success" | "destructive" | "warning" | "secondary" {
    switch (status.toLowerCase()) {
      case "active": return "success";
      case "suspended": return "destructive";
      case "inactive": return "warning";
      default: return "secondary";
    }
  }

  async function loadUser() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/directory/users/${userId}`);
      if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
      const data = await res.json();
      user = data.user ?? data.data?.user ?? null;
      groups = data.groups ?? data.data?.groups ?? [];

      if (user) {
        editDisplayName = user.display_name || "";
        editDepartment = user.department || "";
        editTitle = user.title || "";
        editStatus = user.status || "active";
      }
    } catch (e: any) {
      error = e?.message || "Failed to load user";
    } finally {
      loading = false;
    }
  }

  async function loadAllGroups() {
    try {
      const res = await fetch("/api/directory/groups");
      if (res.ok) {
        const data = await res.json();
        allGroups = data.groups ?? data.data?.items ?? [];
      }
    } catch {}
  }

  async function saveUser() {
    if (!user) return;
    saving = true;
    try {
      const res = await fetch(`/api/directory/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: editDisplayName,
          department: editDepartment,
          title: editTitle,
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to save user");
      const data = await res.json();
      user = data.user ?? data.data?.user ?? user;
      pushToast({ message: "User updated", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save user", variant: "error" });
    } finally {
      saving = false;
    }
  }

  async function addToGroup() {
    if (!selectedGroupId) return;
    addingToGroup = true;
    try {
      const res = await fetch(`/api/directory/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to add to group");
      pushToast({ message: "Added to group", variant: "success" });
      selectedGroupId = "";
      await loadUser();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to add to group", variant: "error" });
    } finally {
      addingToGroup = false;
    }
  }

  async function removeFromGroup(groupId: string) {
    try {
      const res = await fetch(`/api/directory/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to remove from group");
      pushToast({ message: "Removed from group", variant: "success" });
      groups = groups.filter((g) => g.id !== groupId);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to remove from group", variant: "error" });
    }
  }

  onMount(() => {
    loadUser();
    loadAllGroups();
  });
</script>

<div class="space-y-6">
  <!-- Back link -->
  <a href="/console/directory" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
    <ArrowLeft class="h-4 w-4" />
    Back to Directory
  </a>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>
  {:else if error}
    <Card>
      <CardContent class="py-8 text-center">
        <p class="text-destructive">{error}</p>
        <Button variant="outline" class="mt-4" on:click={loadUser}>Retry</Button>
      </CardContent>
    </Card>
  {:else if user}
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold tracking-tight">
            {user.display_name || user.email}
          </h1>
          <Badge variant={statusVariant(user.status)} class="capitalize">{user.status}</Badge>
          {#if user.console_user_id}
            <Badge variant="default">
              <Shield class="h-3 w-3 mr-1" />
              Console Access
            </Badge>
          {/if}
        </div>
        <p class="text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>

    <!-- Profile info & edit form -->
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" value={user.email} disabled />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-source">Source</Label>
            <Input id="edit-source" value={user.source || "manual"} disabled />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-display-name">Display Name</Label>
            <Input id="edit-display-name" bind:value={editDisplayName} />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
            <Input id="edit-department" bind:value={editDepartment} />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" bind:value={editTitle} />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              bind:value={editStatus}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <Button on:click={saveUser} disabled={saving}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Group memberships -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Group Memberships</CardTitle>
          <Badge variant="secondary">{groups.length}</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Add to group -->
        {#if availableGroups.length > 0}
          <div class="flex items-end gap-2">
            <div class="flex-1 space-y-2">
              <Label htmlFor="add-group">Add to Group</Label>
              <select
                id="add-group"
                bind:value={selectedGroupId}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a group...</option>
                {#each availableGroups as group}
                  <option value={group.id}>{group.name}</option>
                {/each}
              </select>
            </div>
            <Button on:click={addToGroup} disabled={!selectedGroupId || addingToGroup}>
              <Plus class="h-4 w-4 mr-1.5" />
              {addingToGroup ? "Adding..." : "Add"}
            </Button>
          </div>
          <Separator />
        {/if}

        <!-- Memberships list -->
        {#if groups.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Group</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                  <th class="px-4 py-3 font-medium">Joined</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each groups as group}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3">
                      <a href="/console/directory/groups/{group.id}" class="font-medium text-primary hover:underline">
                        {group.name}
                      </a>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{group.description || "-"}</td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {group.joined_at ? new Date(group.joined_at).toLocaleDateString() : "-"}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" on:click={() => removeFromGroup(group.id)}>
                        <Trash2 class="h-3.5 w-3.5 mr-1 text-destructive" />
                        Remove
                      </Button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-8">
            <Users class="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p class="text-muted-foreground text-sm">Not a member of any groups</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Metadata -->
    <div class="text-xs text-muted-foreground flex gap-4">
      <span>Created: {new Date(user.created_at).toLocaleString()}</span>
      <span>Updated: {new Date(user.updated_at).toLocaleString()}</span>
      {#if user.external_id}
        <span>External ID: {user.external_id}</span>
      {/if}
    </div>
  {/if}
</div>
