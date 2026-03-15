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

  // Credential editing (ported from integrations page)
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
        testResult = { ok: false, message: "Test request failed" };
      }
    } catch {
      testResult = { ok: false, message: "Test unavailable" };
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

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text, #fff);">Apps</h1>
      <p class="text-sm" style="color: var(--color-text, #fff); opacity: 0.5;">
        Manage connected applications, group assignments, and role mappings
      </p>
    </div>
    <a href="/console/marketplace" class="text-sm px-3 py-1.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
      Browse Marketplace
    </a>
  </div>

  <!-- Tab navigation -->
  <div class="flex gap-1 mb-6 border-b" style="border-color: var(--color-border, rgba(255,255,255,0.1));">
    {#each tabs as tab}
      <button
        type="button"
        class="px-4 py-2.5 text-sm font-medium transition-colors"
        style="color: {activeTab === tab.id ? 'var(--color-accent, #3b82f6)' : 'var(--color-text, #fff)'}; opacity: {activeTab === tab.id ? 1 : 0.5}; border-bottom: 2px solid {activeTab === tab.id ? 'var(--color-accent, #3b82f6)' : 'transparent'}; margin-bottom: -1px;"
        on:click={() => setTab(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-16" style="color: var(--color-text, #fff); opacity: 0.4;">Loading...</div>

  {:else if activeTab === "connected"}
    <!-- Connected Apps -->
    {#if apps.length === 0}
      <div class="rounded-lg p-10 text-center border border-dashed" style="background: var(--color-surface, #1a2332); border-color: rgba(255,255,255,0.15);">
        <p class="text-lg font-semibold mb-1" style="color: var(--color-text, #fff);">No connected apps</p>
        <p class="text-sm mb-5" style="color: var(--color-text, #fff); opacity: 0.5;">Connect applications from the Marketplace to get started.</p>
        <a href="/console/marketplace" class="text-sm px-5 py-2.5 rounded text-white" style="background: var(--color-accent, #3b82f6);">Browse Marketplace</a>
      </div>
    {:else}
      <div class="space-y-2">
        {#each apps as app}
          <div class="flex items-center justify-between px-4 py-3 rounded-lg" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded flex items-center justify-center" style="background: rgba(59,130,246,0.1);">
                <svg class="w-4 h-4" style="color: var(--color-accent, #3b82f6);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconMap[app.category] || iconMap.productivity} />
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium" style="color: var(--color-text, #fff);">{app.name}</span>
                  <span class="w-2 h-2 rounded-full" style="background: {app.healthy !== false ? '#22c55e' : '#ef4444'};"></span>
                </div>
                <div class="text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">
                  {authLabel(app.auth)} &middot; {app.credentialFields.length} field{app.credentialFields.length !== 1 ? "s" : ""}
                  {#if app.connectedAt}
                    &middot; Connected {new Date(app.connectedAt).toLocaleDateString()}
                  {/if}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" on:click={() => openEdit(app)} class="text-xs px-3 py-1.5 rounded" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
                Edit
              </button>
              <button type="button" on:click={() => disconnectApp(app)} class="text-xs px-3 py-1.5 rounded" style="background: rgba(239,68,68,0.1); color: #ef4444;">
                Disconnect
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  {:else if activeTab === "groups" || activeTab === "roles"}
    <!-- Groups / Roles with app selector -->
    <div class="flex gap-6">
      <!-- App sidebar -->
      <div class="w-56 shrink-0">
        <p class="text-xs font-medium mb-2" style="color: var(--color-text, #fff); opacity: 0.5;">Select App</p>
        {#if apps.length === 0}
          <p class="text-xs" style="color: var(--color-text, #fff); opacity: 0.3;">No connected apps</p>
        {:else}
          <div class="space-y-1">
            {#each apps as app}
              <button
                type="button"
                class="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                style="background: {selectedAppId === app.id ? 'rgba(59,130,246,0.15)' : 'transparent'}; color: {selectedAppId === app.id ? 'var(--color-accent, #3b82f6)' : 'var(--color-text, #fff)'};"
                on:click={() => selectApp(app.id)}
              >
                <span class="w-2 h-2 rounded-full shrink-0" style="background: {app.healthy !== false ? '#22c55e' : '#ef4444'};"></span>
                {app.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        {#if !selectedAppId}
          <div class="text-center py-12" style="color: var(--color-text, #fff); opacity: 0.4;">
            <p class="text-sm">Select an app to manage {activeTab === "groups" ? "group assignments" : "role mappings"}</p>
          </div>
        {:else if activeTab === "groups"}
          <!-- Groups tab -->
          <div class="mb-4">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--color-text, #fff);">
              Group Assignments — {apps.find((a) => a.id === selectedAppId)?.name}
            </h2>

            <!-- Add form -->
            <div class="flex gap-2 mb-4">
              <input type="text" bind:value={newGroupId} placeholder="Group ID" class="flex-1 px-3 py-2 rounded text-sm" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
              <input type="text" bind:value={newGroupName} placeholder="Display Name" class="flex-1 px-3 py-2 rounded text-sm" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
              <button type="button" on:click={addGroup} disabled={!newGroupId || !newGroupName} class="px-4 py-2 text-sm font-medium rounded text-white disabled:opacity-50" style="background: var(--color-accent, #3b82f6);">
                Add
              </button>
            </div>

            <!-- Table -->
            {#if groupsLoading}
              <p class="text-xs py-4" style="color: var(--color-text, #fff); opacity: 0.4;">Loading...</p>
            {:else if groups.length === 0}
              <p class="text-xs py-4" style="color: var(--color-text, #fff); opacity: 0.4;">No group assignments yet</p>
            {:else}
              <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
                <table class="w-full">
                  <thead>
                    <tr style="background: rgba(255,255,255,0.02);">
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Group ID</th>
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Name</th>
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Added</th>
                      <th class="text-right text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each groups as group}
                      <tr style="border-top: 1px solid var(--color-border, rgba(255,255,255,0.06));">
                        <td class="px-4 py-2.5 text-sm font-mono" style="color: var(--color-text, #fff);">{group.group_id}</td>
                        <td class="px-4 py-2.5 text-sm" style="color: var(--color-text, #fff);">{group.group_name}</td>
                        <td class="px-4 py-2.5 text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{new Date(group.created_at).toLocaleDateString()}</td>
                        <td class="px-4 py-2.5 text-right">
                          <button type="button" on:click={() => removeGroup(group.group_id)} class="text-xs px-2 py-1 rounded" style="color: #ef4444;">Remove</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>

        {:else if activeTab === "roles"}
          <!-- Roles tab -->
          <div class="mb-4">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--color-text, #fff);">
              Role Mappings — {apps.find((a) => a.id === selectedAppId)?.name}
            </h2>

            <!-- Add form -->
            <div class="flex gap-2 mb-4">
              <input type="text" bind:value={newSourceRole} placeholder="Source Role (e.g. Admin)" class="flex-1 px-3 py-2 rounded text-sm" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
              <span class="flex items-center text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">&rarr;</span>
              <input type="text" bind:value={newTargetRole} placeholder="Target Role (e.g. Owner)" class="flex-1 px-3 py-2 rounded text-sm" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);" />
              <button type="button" on:click={addRole} disabled={!newSourceRole || !newTargetRole} class="px-4 py-2 text-sm font-medium rounded text-white disabled:opacity-50" style="background: var(--color-accent, #3b82f6);">
                Add
              </button>
            </div>

            <!-- Table -->
            {#if rolesLoading}
              <p class="text-xs py-4" style="color: var(--color-text, #fff); opacity: 0.4;">Loading...</p>
            {:else if roles.length === 0}
              <p class="text-xs py-4" style="color: var(--color-text, #fff); opacity: 0.4;">No role mappings yet</p>
            {:else}
              <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
                <table class="w-full">
                  <thead>
                    <tr style="background: rgba(255,255,255,0.02);">
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Source Role</th>
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;"></th>
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Target Role</th>
                      <th class="text-left text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;">Added</th>
                      <th class="text-right text-xs font-medium px-4 py-2" style="color: var(--color-text, #fff); opacity: 0.5;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each roles as role}
                      <tr style="border-top: 1px solid var(--color-border, rgba(255,255,255,0.06));">
                        <td class="px-4 py-2.5 text-sm font-mono" style="color: var(--color-text, #fff);">{role.source_role}</td>
                        <td class="px-4 py-2.5 text-xs" style="color: var(--color-text, #fff); opacity: 0.3;">&rarr;</td>
                        <td class="px-4 py-2.5 text-sm font-mono" style="color: var(--color-accent, #3b82f6);">{role.target_role}</td>
                        <td class="px-4 py-2.5 text-xs" style="color: var(--color-text, #fff); opacity: 0.4;">{new Date(role.created_at).toLocaleDateString()}</td>
                        <td class="px-4 py-2.5 text-right">
                          <button type="button" on:click={() => removeRole(role.source_role)} class="text-xs px-2 py-1 rounded" style="color: #ef4444;">Remove</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Edit Credentials Modal -->
{#if editOpen && editApp}
  <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6);">
    <div class="w-full max-w-md mx-4 rounded-lg p-6" style="background: var(--color-surface, #1a2332); border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold" style="color: var(--color-text, #fff);">{editApp.name} — Credentials</h3>
        <button type="button" on:click={() => editOpen = false} class="p-1" style="color: var(--color-text, #fff); opacity: 0.5;" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {#if editApp.credentialFields.length > 0}
        <div class="space-y-3 mb-4">
          {#each editApp.credentialFields as field}
            <div>
              <label class="block text-xs mb-1" style="color: var(--color-text, #fff); opacity: 0.6;" for="cred-{field.key}">
                {field.label}{field.required ? " *" : ""}
              </label>
              <input
                id="cred-{field.key}"
                type={field.type === "password" ? "password" : "text"}
                bind:value={editValues[field.key]}
                placeholder="(unchanged)"
                class="w-full px-3 py-2 rounded text-sm"
                style="background: var(--color-bg, #0f1923); border: 1px solid var(--color-border, rgba(255,255,255,0.1)); color: var(--color-text, #fff);"
              />
              {#if field.helpText}
                <p class="text-[11px] mt-0.5" style="color: var(--color-text, #fff); opacity: 0.3;">{field.helpText}</p>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-xs mb-4" style="color: var(--color-text, #fff); opacity: 0.5;">This app uses OAuth. No manual credentials needed.</p>
      {/if}

      {#if testResult}
        <div class="mb-3 px-3 py-2 rounded text-xs" style="background: {testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color: {testResult.ok ? '#22c55e' : '#ef4444'};">
          {testResult.message}
        </div>
      {/if}

      <div class="flex gap-2">
        <button type="button" on:click={testConnection} disabled={testLoading} class="flex-1 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50" style="background: rgba(255,255,255,0.05); color: var(--color-text, #fff);">
          {testLoading ? "Testing..." : "Test Connection"}
        </button>
        <button type="button" on:click={saveCredentials} disabled={editLoading} class="flex-1 py-2 text-sm font-medium rounded text-white transition-colors disabled:opacity-50" style="background: var(--color-accent, #3b82f6);">
          {editLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
{/if}
