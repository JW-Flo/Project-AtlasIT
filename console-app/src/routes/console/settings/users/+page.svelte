<script lang="ts">
  import { onMount } from "svelte";
  import { session } from "$lib/stores/session";

  interface TenantUser {
    id: string; email: string; display_name: string | null;
    role: string; status: string; last_login_at: string | null; created_at: string;
  }

  let users: TenantUser[] = [];
  let loading = true;
  let error: string | null = null;
  let currentEmail: string | null = null;
  let isAdmin = false;
  let showInvite = false;
  let inviteEmail = "";
  let inviteDisplayName = "";
  let inviteRole = "member";
  let inviting = false;
  let inviteError: string | null = null;
  let inviteSuccess: string | null = null;
  let lastInviteUrl: string | null = null;
  let copiedLink = false;

  session.subscribe((s) => {
    if (s) {
      currentEmail = s.email ?? null;
      isAdmin = s.roles?.includes("admin") || s.roles?.includes("owner") || false;
    }
  });

  async function loadUsers() {
    loading = true; error = null;
    try {
      const res = await fetch("/api/v1/tenant/users");
      if (!res.ok) { error = `Failed to load users (HTTP ${res.status})`; return; }
      const result = await res.json();
      users = result.data?.items ?? [];
    } catch (e) { error = (e as Error).message; } finally { loading = false; }
  }

  async function submitInvite() {
    inviteError = null; inviteSuccess = null;
    if (!inviteEmail.trim()) { inviteError = "Email is required"; return; }
    const emailRe = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRe.test(inviteEmail.trim())) { inviteError = "Enter a valid email address"; return; }
    inviting = true;
    try {
      const res = await fetch("/api/v1/tenant/users/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), displayName: inviteDisplayName.trim() || undefined, role: inviteRole }),
      });
      const result = await res.json() as { message?: string; data?: { inviteUrl?: string } };
      if (!res.ok) { inviteError = result.message ?? "Failed to invite user"; return; }
      inviteSuccess = `Invite created for ${inviteEmail.trim()}.`;
      lastInviteUrl = result.data?.inviteUrl ?? null;
      copiedLink = false;
      inviteEmail = ""; inviteDisplayName = ""; inviteRole = "member";
      await loadUsers();
    } catch (e) { inviteError = (e as Error).message; } finally { inviting = false; }
  }

  async function copyInviteLink() {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    copiedLink = true;
    setTimeout(() => { copiedLink = false; }, 2500);
  }

  function roleBadgeClass(role: string): string {
    if (role === "admin" || role === "owner") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (role === "viewer") return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  }

  function statusBadgeClass(status: string): string {
    return status === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "Never";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 30) return new Date(iso).toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return `${Math.floor(ms / 60000)}m ago`;
  }

  onMount(() => { loadUsers(); });
</script>

<div class="p-8 max-w-5xl mx-auto">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Users &amp; Roles</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage who has access to your organization.</p>
    </div>
    {#if isAdmin}
      <button
        on:click={() => { showInvite = !showInvite; inviteError = null; inviteSuccess = null; lastInviteUrl = null; copiedLink = false; }}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {showInvite ? "Cancel" : "Invite User"}
      </button>
    {/if}
  </div>

  {#if showInvite && isAdmin}
    <div class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Invite a New User</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label for="invite-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span class="text-red-500">*</span></label>
          <input id="invite-email" type="email" bind:value={inviteEmail} placeholder="user@example.com"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="invite-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
          <input id="invite-name" type="text" bind:value={inviteDisplayName} placeholder="Jane Smith"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label for="invite-role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select id="invite-role" bind:value={inviteRole}
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="viewer">Viewer</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {#if inviteError}<p class="mt-3 text-sm text-red-600 dark:text-red-400">{inviteError}</p>{/if}
      {#if inviteSuccess}
        <div class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p class="text-sm text-green-700 dark:text-green-300 font-medium mb-2">{inviteSuccess} Share this invite link:</p>
          {#if lastInviteUrl}
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                value={lastInviteUrl}
                class="flex-1 text-xs px-2 py-1.5 border border-green-300 dark:border-green-700 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-mono truncate"
              />
              <button
                type="button"
                on:click={copyInviteLink}
                class="shrink-0 px-3 py-1.5 text-xs font-medium rounded border transition-colors {copiedLink ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-gray-800 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'}"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Link expires in 7 days. Share it directly with the invitee.</p>
          {/if}
        </div>
      {/if}
      <div class="mt-4">
        <button on:click={submitInvite} disabled={inviting}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {inviting ? "Inviting..." : "Send Invite"}
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each Array(4) as _}<div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>{/each}
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300 text-sm">{error}</p>
      <button on:click={loadUsers} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if users.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <p class="text-gray-500 dark:text-gray-400 font-medium">No users yet</p>
      <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Invite your first team member above.</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700 text-left">
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each users as user}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">
                {user.email}
                {#if user.email === currentEmail}
                  <span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">you</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{user.display_name ?? "—"}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(user.role)}">{user.role}</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusBadgeClass(user.status)}">{user.status}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{relativeTime(user.last_login_at)}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
