<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    integrations as allIntegrations,
    iconMap,
    type Integration,
    type CredentialField,
  } from "$lib/data/integrations";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Settings, Trash2, Plus, ArrowRight, ShoppingBag } from "lucide-svelte";

  interface ConnectedApp extends Integration {
    connectedAt?: string;
    lastSync?: string;
    healthy?: boolean;
  }

  interface GroupAssignment {
    id: string;
    group_id: string;
    group_name: string;
    created_at: string;
  }

  interface RoleMapping {
    id: string;
    source_role: string;
    target_role: string;
    created_at: string;
  }

  let apps: ConnectedApp[] = [];
  let loading = true;

  // Tab state
  $: activeTab = $page.url.searchParams.get("tab") || "connected";
  $: selectedAppId = $page.url.searchParams.get("app") || "";

  function setTab(tab: string) {
    const url = new URL($page.url);
    url.searchParams.set("tab", tab);
    if (tab === "connected") {
      url.searchParams.delete("app");
    }
    goto(url.toString(), { replaceState: true, noScroll: true });
  }

  function selectApp(appId: string) {
    const url = new URL($page.url);
    url.searchParams.set("app", appId);
    goto(url.toString(), { replaceState: true, noScroll: true });
  }

  // Edit modal state
  let editApp: ConnectedApp | null = null;
  let editOpen = false;
  let editValues: Record<string, string> = {};
  let editLoading = false;
  let testLoading = false;
  let testResult: { ok: boolean; message: string } | null = null;

  // Groups state
  let groups: GroupAssignment[] = [];
  let groupsLoading = false;
  let newGroupId = "";
  let newGroupName = "";

  // Roles state
  let roles: RoleMapping[] = [];
  let rolesLoading = false;
  let newSourceRole = "";
  let newTargetRole = "";

  onMount(async () => {
    loading = true;
    try {
      const res = await fetch("/api/apps/status");
      if (res.ok) {
        const data: any = await res.json();
        const statusApps: any[] = data.applications || [];
        const connected: Record<string, any> = {};
        for (const sa of statusApps) {
          if (sa.connected) connected[sa.id] = sa;
        }
        apps = allIntegrations
          .filter((i) => connected[i.id])
          .map((i) => ({
            ...i,
            connected: true,
            connectedAt: connected[i.id]?.connectedAt,
            lastSync: connected[i.id]?.lastSync,
            healthy: connected[i.id]?.healthy ?? true,
          }));
      }
    } catch {
      apps = allIntegrations.filter((i) => i.connected).map((i) => ({ ...i }));
    }
    loading = false;
  });

  // Fetch groups/roles when app or tab changes
  $: if (selectedAppId && activeTab === "groups") fetchGroups(selectedAppId);
  $: if (selectedAppId && activeTab === "roles") fetchRoles(selectedAppId);

  async function fetchGroups(appId: string) {
    groupsLoading = true;
    try {
      const res = await fetch(`/api/apps/${appId}/groups`);
      if (res.ok) {
        const data = await res.json();
        groups = data.groups || [];
      } else {
        groups = [];
      }
    } catch {
      groups = [];
    }
    groupsLoading = false;
  }

  async function addGroup() {
    if (!selectedAppId || !newGroupId || !newGroupName) return;
    await fetch(`/api/apps/${selectedAppId}/groups`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId: newGroupId, groupName: newGroupName }),
    });
    newGroupId = "";
    newGroupName = "";
    await fetchGroups(selectedAppId);
    pushToast({ message: "Group assignment added", variant: "success" });
  }

  async function removeGroup(groupId: string) {
    if (!selectedAppId) return;
    await fetch(`/api/apps/${selectedAppId}/groups/${encodeURIComponent(groupId)}`, { method: "DELETE" });
    groups = groups.filter((g) => g.group_id !== groupId);
    pushToast({ message: "Group assignment removed", variant: "info" });
  }

  async function fetchRoles(appId: string) {
    rolesLoading = true;
    try {
      const res = await fetch(`/api/apps/${appId}/roles`);
      if (res.ok) {
        const data = await res.json();
        roles = data.roles || [];
      } else {
        roles = [];
      }
    } catch {
      roles = [];
    }
    rolesLoading = false;
  }

  async function addRole() {
    if (!selectedAppId || !newSourceRole || !newTargetRole) return;
    await fetch(`/api/apps/${selectedAppId}/roles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceRole: newSourceRole, targetRole: newTargetRole }),
    });
    newSourceRole = "";
    newTargetRole = "";
    await fetchRoles(selectedAppId);
    pushToast({ message: "Role mapping added", variant: "success" });
  }

  async function removeRole(sourceRole: string) {
    if (!selectedAppId) return;
    await fetch(`/api/apps/${selectedAppId}/roles/${encodeURIComponent(sourceRole)}`, { method: "DELETE" });
    roles = roles.filter((r) => r.source_role !== sourceRole);
    pushToast({ message: "Role mapping removed", variant: "info" });
  }

  // Credential editing
  function openEdit(app: ConnectedApp) {
    editApp = app;
    editValues = {};
    testResult = null;
    editOpen = true;
  }

  async function testConnection() {
    if (!editApp) return;
    testLoading = true;
    testResult = null;
    try {
      const res = await fetch("/api/apps/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId: editApp.id }),
      });
      if (res.ok) {
        const data: any = await res.json();
        testResult = { ok: data.healthy !== false, message: data.message || "Connection successful" };
      } else {
        const errData: any = await res.json().catch(() => null);
        testResult = {
          ok: false,
          message: errData?.error || errData?.message || `Test failed (${res.status}). Verify your credentials are correct and the app's API is accessible.`,
        };
      }
    } catch {
      testResult = { ok: false, message: "Connection test unavailable. The adapter for this app may not be deployed yet." };
    }
    testLoading = false;
  }

  async function saveCredentials() {
    if (!editApp) return;
    editLoading = true;
    const credentials: Record<string, string> = {};
    for (const [k, v] of Object.entries(editValues)) {
      if (v.trim()) credentials[k] = v;
    }
    try {
      const res = await fetch("/api/apps/credentials", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId: editApp.id, credentials }),
      });
      pushToast({ message: `${editApp.name} credentials updated`, variant: res.ok ? "success" : "info" });
    } catch {
      pushToast({ message: `${editApp.name} credentials saved locally`, variant: "info" });
    }
    editLoading = false;
    editOpen = false;
  }

  async function disconnectApp(app: ConnectedApp) {
    try {
      await fetch("/api/apps/disconnect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId: app.id }),
      });
    } catch { /* continue locally */ }
    apps = apps.filter((a) => a.id !== app.id);
    pushToast({ message: `${app.name} disconnected`, variant: "info" });
  }

  function authLabel(auth: string): string {
    if (auth === "platform_oauth" || auth === "tenant_oauth") return "OAuth 2.0";
    if (auth === "api_key") return "API Key";
    if (auth === "service_account") return "Service Account";
    return auth;
  }

  const tabs = [
    { id: "connected", label: "Connected" },
    { id: "groups", label: "Groups" },
    { id: "roles", label: "Role Mappings" },
  ];
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Apps</h1>
      <p class="text-sm text-muted-foreground">
        Manage connected applications, group assignments, and role mappings
      </p>
    </div>
    <a href="/console/marketplace" class="shrink-0">
      <Button variant="outline">
        <ShoppingBag class="h-4 w-4 mr-1.5" />
        Browse Marketplace
      </Button>
    </a>
  </div>

  <!-- Tab navigation -->
  <div class="flex gap-1 border-b">
    {#each tabs as tab}
      <button
        type="button"
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {activeTab === tab.id
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
        on:click={() => setTab(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-16 rounded-lg" />
      {/each}
    </div>

  {:else if activeTab === "connected"}
    <!-- Connected Apps -->
    {#if apps.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-10 text-center">
          <ShoppingBag class="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p class="text-lg font-semibold mb-1">No connected apps</p>
          <p class="text-sm text-muted-foreground mb-5">Connect applications from the Marketplace to get started.</p>
          <a href="/console/marketplace"><Button>Browse Marketplace</Button></a>
        </CardContent>
      </Card>
    {:else}
      <div class="space-y-2">
        {#each apps as app}
          <Card>
            <CardContent class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded flex items-center justify-center bg-primary/10">
                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{app.name}</span>
                    <span class="w-2 h-2 rounded-full {app.healthy !== false ? 'bg-green-500' : 'bg-destructive'}"></span>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {authLabel(app.auth)} &middot; {app.credentialFields.length} field{app.credentialFields.length !== 1 ? "s" : ""}
                    {#if app.connectedAt}
                      &middot; Connected {new Date(app.connectedAt).toLocaleDateString()}
                    {/if}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" on:click={() => openEdit(app)}>
                  <Settings class="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" on:click={() => disconnectApp(app)}>
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "groups" || activeTab === "roles"}
    <!-- Groups / Roles with app selector -->
    <div class="flex flex-col md:flex-row gap-4 md:gap-6">
      <!-- App sidebar -->
      <div class="md:w-56 shrink-0">
        <p class="text-xs font-medium text-muted-foreground mb-2">Select App</p>
        {#if apps.length === 0}
          <p class="text-xs text-muted-foreground">No connected apps</p>
        {:else}
          <div class="space-y-1">
            {#each apps as app}
              <button
                type="button"
                class="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors {selectedAppId === app.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
                on:click={() => selectApp(app.id)}
              >
                <span class="w-2 h-2 rounded-full shrink-0 {app.healthy !== false ? 'bg-green-500' : 'bg-destructive'}"></span>
                {app.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        {#if !selectedAppId && apps.length > 0}
          <div class="text-center py-12 text-muted-foreground">
            <p class="text-sm">Select an app to manage {activeTab === "groups" ? "group assignments" : "role mappings"}</p>
          </div>
        {:else if !selectedAppId}
          <div class="text-center py-12 text-muted-foreground">
            <p class="text-sm mb-3">No connected apps to manage {activeTab === "groups" ? "group assignments" : "role mappings"}</p>
            <a href="/console/marketplace"><Button variant="outline" size="sm">Browse Marketplace</Button></a>
          </div>
        {:else if activeTab === "groups"}
          <!-- Groups tab -->
          <div class="space-y-4">
            <h2 class="text-sm font-semibold">
              Group Assignments -- {apps.find((a) => a.id === selectedAppId)?.name}
            </h2>

            <!-- Add form -->
            <div class="flex flex-col sm:flex-row gap-2">
              <Input type="text" bind:value={newGroupId} placeholder="Group ID" class="sm:flex-1" />
              <Input type="text" bind:value={newGroupName} placeholder="Display Name" class="sm:flex-1" />
              <Button class="shrink-0" on:click={addGroup} disabled={!newGroupId || !newGroupName}>
                <Plus class="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <!-- Table -->
            {#if groupsLoading}
              <Skeleton class="h-32 rounded-lg" />
            {:else if groups.length === 0}
              <p class="text-xs text-muted-foreground py-4">No group assignments yet</p>
            {:else}
              <Card>
                <CardContent class="p-0">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                        <th class="px-4 py-2 font-medium">Group ID</th>
                        <th class="px-4 py-2 font-medium">Name</th>
                        <th class="px-4 py-2 font-medium">Added</th>
                        <th class="px-4 py-2 font-medium text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each groups as group}
                        <tr class="border-t hover:bg-muted/50">
                          <td class="px-4 py-2.5 font-mono">{group.group_id}</td>
                          <td class="px-4 py-2.5">{group.group_name}</td>
                          <td class="px-4 py-2.5 text-xs text-muted-foreground">{new Date(group.created_at).toLocaleDateString()}</td>
                          <td class="px-4 py-2.5 text-right">
                            <Button variant="ghost" size="sm" on:click={() => removeGroup(group.group_id)}>
                              <Trash2 class="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            {/if}
          </div>

        {:else if activeTab === "roles"}
          <!-- Roles tab -->
          <div class="space-y-4">
            <h2 class="text-sm font-semibold">
              Role Mappings -- {apps.find((a) => a.id === selectedAppId)?.name}
            </h2>

            <!-- Add form -->
            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input type="text" bind:value={newSourceRole} placeholder="Source Role (e.g. Admin)" class="sm:flex-1" />
              <ArrowRight class="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Input type="text" bind:value={newTargetRole} placeholder="Target Role (e.g. Owner)" class="sm:flex-1" />
              <Button class="shrink-0" on:click={addRole} disabled={!newSourceRole || !newTargetRole}>
                <Plus class="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <!-- Table -->
            {#if rolesLoading}
              <Skeleton class="h-32 rounded-lg" />
            {:else if roles.length === 0}
              <p class="text-xs text-muted-foreground py-4">No role mappings yet</p>
            {:else}
              <Card>
                <CardContent class="p-0">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                        <th class="px-4 py-2 font-medium">Source Role</th>
                        <th class="px-4 py-2 font-medium"></th>
                        <th class="px-4 py-2 font-medium">Target Role</th>
                        <th class="px-4 py-2 font-medium">Added</th>
                        <th class="px-4 py-2 font-medium text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each roles as role}
                        <tr class="border-t hover:bg-muted/50">
                          <td class="px-4 py-2.5 font-mono">{role.source_role}</td>
                          <td class="px-4 py-2.5 text-xs text-muted-foreground">&rarr;</td>
                          <td class="px-4 py-2.5 font-mono text-primary">{role.target_role}</td>
                          <td class="px-4 py-2.5 text-xs text-muted-foreground">{new Date(role.created_at).toLocaleDateString()}</td>
                          <td class="px-4 py-2.5 text-right">
                            <Button variant="ghost" size="sm" on:click={() => removeRole(role.source_role)}>
                              <Trash2 class="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Edit Credentials Modal -->
<Dialog open={editOpen} onClose={() => editOpen = false} title="{editApp?.name || ''} -- Credentials">
  {#if editApp}
    {#if editApp.credentialFields.length > 0}
      <div class="space-y-3 mb-4">
        {#each editApp.credentialFields as field}
          <div class="space-y-1.5">
            <Label>
              {field.label}{field.required ? " *" : ""}
            </Label>
            <Input
              type={field.type === "password" ? "password" : "text"}
              bind:value={editValues[field.key]}
              placeholder="(unchanged)"
            />
            {#if field.helpText}
              <p class="text-xs text-muted-foreground">{field.helpText}</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-muted-foreground mb-4">This app uses OAuth. No manual credentials needed.</p>
    {/if}

    {#if testResult}
      <div class="mb-3 px-3 py-2 rounded text-xs {testResult.ok ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}">
        {testResult.message}
      </div>
    {/if}

    <DialogFooter>
      <Button variant="outline" on:click={testConnection} disabled={testLoading}>
        {testLoading ? "Testing..." : "Test Connection"}
      </Button>
      <Button on:click={saveCredentials} disabled={editLoading}>
        {editLoading ? "Saving..." : "Save Changes"}
      </Button>
    </DialogFooter>
  {/if}
</Dialog>
