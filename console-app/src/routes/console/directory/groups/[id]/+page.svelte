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
  import { ArrowLeft, Save, Trash2, Plus, Users, Search, AppWindow } from "lucide-svelte";

  interface GroupDetail {
    id: string;
    external_id: string;
    name: string;
    description: string | null;
    member_count: number;
    created_at: string;
    updated_at: string;
  }

  interface GroupMember {
    id: string;
    email: string;
    display_name: string | null;
    department: string | null;
    title: string | null;
    status: string;
    joined_at: string;
  }

  interface DirectoryUser {
    id: string;
    name: string;
    email: string;
    department?: string;
    title?: string;
    status: string;
  }

  let group: GroupDetail | null = null;
  let members: GroupMember[] = [];
  let allUsers: DirectoryUser[] = [];
  let loading = true;
  let saving = false;
  let error = "";

  // Edit form
  let editName = "";
  let editDescription = "";

  // Add members
  let userSearchQuery = "";
  let selectedUserId = "";
  let addingMember = false;

  // App/role assignment
  interface ConnectedApp {
    id: string;
    connected: boolean;
  }
  let connectedApps: ConnectedApp[] = [];
  let groupApps: Array<{ id?: string; appId: string; role: string }> = [];
  let newAppId = "";
  let newAppRole = "member";

  function displayNameFromEmail(email: string, displayName: string | null): string {
    if (displayName && displayName !== "-") return displayName;
    const local = email.split("@")[0];
    return local
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  $: groupId = $page.params.id;
  $: memberIds = new Set(members.map((m) => m.id));
  $: filteredAvailableUsers = allUsers
    .filter((u) => !memberIds.has(u.id))
    .filter((u) => {
      if (!userSearchQuery) return true;
      const q = userSearchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  function statusVariant(status: string): "success" | "destructive" | "warning" | "secondary" {
    switch (status.toLowerCase()) {
      case "active": return "success";
      case "suspended": return "destructive";
      case "inactive": return "warning";
      default: return "secondary";
    }
  }

  async function loadGroup() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/v1/directory/groups/${groupId}`);
      if (!res.ok) throw new Error(`Failed to load group (${res.status})`);
      const data = await res.json();
      group = data.group ?? data.data?.group ?? null;
      members = data.members ?? data.data?.members ?? [];

      const appMappings = data.appMappings ?? data.data?.appMappings;
      if (appMappings) {
        groupApps = appMappings.map((m: any) => ({ id: m.id, appId: m.appId || m.app_id, role: m.role }));
      }

      if (group) {
        editName = group.name || "";
        editDescription = group.description || "";
      }
    } catch (e: any) {
      error = e?.message || "Failed to load group";
    } finally {
      loading = false;
    }
  }

  async function loadAllUsers() {
    try {
      const res = await fetch("/api/v1/directory/users?limit=500");
      if (res.ok) {
        const data = await res.json();
        const items = data.users ?? data.data?.items ?? [];
        // Normalize to {id, name, email, department, title, status}
        allUsers = items.map((u: any) => ({
          id: u.id,
          name: u.display_name ?? u.name ?? u.email,
          email: u.email,
          department: u.department,
          title: u.title,
          status: u.status ?? "active",
        }));
      }
    } catch {}
  }

  async function saveGroup() {
    if (!group) return;
    saving = true;
    try {
      const res = await fetch(`/api/v1/directory/groups/${groupId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });
      if (!res.ok) throw new Error("Failed to save group");
      const data = await res.json();
      const updated = data.group ?? data.data?.group;
      group = updated ? { ...group, ...updated } : group;
      pushToast({ message: "Group updated", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save group", variant: "error" });
    } finally {
      saving = false;
    }
  }

  async function addMember() {
    if (!selectedUserId) return;
    addingMember = true;
    try {
      const res = await fetch(`/api/v1/directory/groups/${groupId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      pushToast({ message: "Member added", variant: "success" });
      selectedUserId = "";
      userSearchQuery = "";
      await loadGroup();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to add member", variant: "error" });
    } finally {
      addingMember = false;
    }
  }

  async function removeMember(userId: string) {
    try {
      const res = await fetch(`/api/v1/directory/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to remove member");
      pushToast({ message: "Member removed", variant: "success" });
      members = members.filter((m) => m.id !== userId);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to remove member", variant: "error" });
    }
  }

  async function loadConnectedApps() {
    try {
      const res = await fetch("/api/apps/status");
      if (res.ok) {
        const data = await res.json();
        connectedApps = (data.applications || []).filter((a: any) => a.connected);
      }
    } catch {}
  }

  async function addAppAssignment() {
    if (!newAppId || groupApps.some(a => a.appId === newAppId)) return;
    try {
      const res = await fetch("/api/v1/directory/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directoryGroupId: group!.id,
          directoryGroupName: group!.name,
          appProvider: newAppId,
          appRole: newAppRole || "member",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      const mappingId = data.id ?? data.mapping?.id ?? data.data?.id;
      groupApps = [...groupApps, { id: mappingId, appId: newAppId, role: newAppRole || "member" }];
      newAppId = "";
      newAppRole = "member";
    } catch {
      pushToast({ title: "Error", description: "Failed to assign app", variant: "destructive" });
    }
  }

  async function removeAppAssignment(appId: string) {
    const mapping = groupApps.find(a => a.appId === appId);
    if (mapping?.id) {
      await fetch(`/api/v1/directory/mappings/${encodeURIComponent(mapping.id)}`, { method: "DELETE" });
    }
    groupApps = groupApps.filter(a => a.appId !== appId);
  }

  onMount(() => {
    loadGroup();
    loadAllUsers();
    loadConnectedApps();
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
        <Button variant="outline" class="mt-4" on:click={loadGroup}>Retry</Button>
      </CardContent>
    </Card>
  {:else if group}
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-2xl font-semibold tracking-tight">{group.name}</h1>
          <Badge variant="secondary">
            <Users class="h-3 w-3 mr-1" />
            {members.length} members
          </Badge>
        </div>
        {#if group.description}
          <p class="text-sm text-muted-foreground">{group.description}</p>
        {/if}
      </div>
    </div>

    <!-- Group info & edit form -->
    <Card>
      <CardHeader>
        <CardTitle>Group Details</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" bind:value={editName} />
          </div>
          <div class="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" bind:value={editDescription} />
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <Button on:click={saveGroup} disabled={saving || !editName}>
            <Save class="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Members -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Members</CardTitle>
          <Badge variant="secondary">{members.length}</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Add member -->
        <div class="flex items-end gap-2">
          <div class="flex-1 space-y-2">
            <Label htmlFor="add-member">Add Member</Label>
            <div class="flex gap-2">
              <Input
                id="add-member-search"
                bind:value={userSearchQuery}
                placeholder="Search users..."
                class="max-w-xs"
              />
              <select
                id="add-member"
                bind:value={selectedUserId}
                class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a user...</option>
                {#each filteredAvailableUsers as u}
                  <option value={u.id}>{u.name || u.email} ({u.email})</option>
                {/each}
              </select>
            </div>
          </div>
          <Button on:click={addMember} disabled={!selectedUserId || addingMember}>
            <Plus class="h-4 w-4 mr-1.5" />
            {addingMember ? "Adding..." : "Add"}
          </Button>
        </div>

        <Separator />

        <!-- Members table -->
        {#if members.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Name</th>
                  <th class="px-4 py-3 font-medium">Email</th>
                  <th class="px-4 py-3 font-medium">Department</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">Joined</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each members as member}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3">
                      <a href="/console/directory/users/{member.id}" class="font-medium text-primary hover:underline">
                        {displayNameFromEmail(member.email, member.display_name)}
                      </a>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{member.email}</td>
                    <td class="px-4 py-3 text-muted-foreground">{member.department || "-"}</td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(member.status)} class="capitalize">{member.status}</Badge>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" on:click={() => removeMember(member.id)}>
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
            <p class="text-muted-foreground text-sm">No members in this group</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Application Assignments -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Application Assignments</CardTitle>
          <Badge variant="secondary">{groupApps.length}</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-end gap-2">
          <div class="flex-1 space-y-2">
            <Label htmlFor="assign-app">Assign Application</Label>
            <div class="flex gap-2">
              <select
                id="assign-app"
                bind:value={newAppId}
                class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select application...</option>
                {#each connectedApps.filter((a) => !groupApps.some((g) => g.appId === a.id)) as app}
                  <option value={app.id}>{app.id}</option>
                {/each}
              </select>
              <select
                bind:value={newAppRole}
                class="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          </div>
          <Button on:click={addAppAssignment} disabled={!newAppId}>
            <Plus class="h-4 w-4 mr-1.5" />
            Assign
          </Button>
        </div>

        <Separator />

        {#if groupApps.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Application</th>
                  <th class="px-4 py-3 font-medium">Role</th>
                  <th class="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each groupApps as app}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-4 py-3 font-medium flex items-center gap-2">
                      <AppWindow class="h-4 w-4 text-muted-foreground" />
                      {app.appId}
                    </td>
                    <td class="px-4 py-3">
                      <Badge variant="outline" class="capitalize">{app.role}</Badge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" on:click={() => removeAppAssignment(app.appId)}>
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
          <div class="text-center py-6">
            <AppWindow class="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p class="text-muted-foreground text-sm">No applications assigned to this group</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Metadata -->
    <div class="text-xs text-muted-foreground flex gap-4">
      <span>Created: {new Date(group.created_at).toLocaleString()}</span>
      <span>Updated: {new Date(group.updated_at).toLocaleString()}</span>
      {#if group.external_id}
        <span>External ID: {group.external_id}</span>
      {/if}
    </div>
  {/if}
</div>
