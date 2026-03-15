<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Modal from "$lib/components/overlays/Modal.svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
  ];
  $: current = $page.url.pathname;

  interface User {
    id: string;
    displayName: string;
    email: string;
    role: string;
    lastLogin: string | null;
  }

  let users: User[] = [];
  let loading = true;
  let error = "";

  let inviteModalOpen = false;
  let inviteEmail = "";
  let inviteDisplayName = "";
  let inviteRole = "member";
  let inviting = false;
  let tempPassword = "";

  let deleteModalOpen = false;
  let userToDelete: User | null = null;

  async function loadUsers() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/tenant/users");
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      users = await res.json();
    } catch (e: any) {
      error = e?.message || "Failed to load users";
    } finally {
      loading = false;
    }
  }

  function openInviteModal() {
    inviteEmail = "";
    inviteDisplayName = "";
    inviteRole = "member";
    tempPassword = "";
    inviteModalOpen = true;
  }

  function closeInviteModal() {
    inviteModalOpen = false;
    tempPassword = "";
  }

  async function inviteUser() {
    if (!inviteEmail) return;
    inviting = true;
    try {
      const res = await fetch("/api/tenant/users/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          displayName: inviteDisplayName || undefined,
          role: inviteRole,
        }),
      });
      if (!res.ok) throw new Error("Failed to invite user");
      const data: { tempPassword?: string } = await res.json();
      tempPassword = data.tempPassword || "";
      pushToast({ message: "User invited successfully", variant: "success" });
      await loadUsers();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to invite user", variant: "error" });
    } finally {
      inviting = false;
    }
  }

  async function copyTempPassword() {
    try {
      await navigator.clipboard.writeText(tempPassword);
      pushToast({ message: "Temporary password copied", variant: "success" });
    } catch {
      pushToast({ message: "Failed to copy password", variant: "error" });
    }
  }

  async function changeRole(user: User, newRole: string) {
    try {
      const res = await fetch(`/api/tenant/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roles: [newRole] }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      user.role = newRole;
      users = users;
      pushToast({ message: `Role updated to ${newRole}`, variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to update role", variant: "error" });
    }
  }

  function confirmDelete(user: User) {
    userToDelete = user;
    deleteModalOpen = true;
  }

  function closeDeleteModal() {
    deleteModalOpen = false;
    userToDelete = null;
  }

  async function deleteUser() {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/tenant/users/${userToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove user");
      pushToast({ message: "User removed", variant: "success" });
      closeDeleteModal();
      await loadUsers();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to remove user", variant: "error" });
    }
  }

  onMount(loadUsers);
</script>

<div class="px-6 py-6 space-y-6 max-w-5xl mx-auto">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold">User Management</h1>
    <button
      on:click={openInviteModal}
      class="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white"
    >
      Invite User
    </button>
  </div>

  <div class="flex gap-6 border-b border-white/10 mb-6">
    {#each settingsTabs as tab}
      <a href={tab.href}
         class="pb-2 text-sm {current === tab.href ? 'text-white border-b-2 border-indigo-500' : 'text-white/50 hover:text-white/80'}"
      >{tab.label}</a>
    {/each}
  </div>

  {#if error}
    <div class="text-red-400 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
  {/if}

  {#if loading}
    <div class="text-white/50 text-sm">Loading users...</div>
  {:else}
    <div class="bg-[#1a2332] rounded-lg border border-white/10 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-white/50 border-b border-white/10">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Email</th>
            <th class="px-4 py-3 font-medium">Role</th>
            <th class="px-4 py-3 font-medium">Last Login</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr class="border-b border-white/10 hover:bg-white/5">
              <td class="px-4 py-3 text-white">{user.displayName || "—"}</td>
              <td class="px-4 py-3 text-white/80">{user.email}</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  {user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}">
                  {user.role}
                </span>
              </td>
              <td class="px-4 py-3 text-white/60">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 items-center">
                  <select
                    value={user.role}
                    on:change={(e) => changeRole(user, e.currentTarget.value)}
                    class="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                  >
                    <option value="admin">admin</option>
                    <option value="member">member</option>
                  </select>
                  <button
                    on:click={() => confirmDelete(user)}
                    class="text-xs bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded text-white"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-4 py-10 text-center">
                <div class="flex flex-col items-center gap-3">
                  <svg class="w-10 h-10 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p class="text-white/60 font-medium mb-1">Invite your first team member to get started</p>
                    <p class="text-white/40 text-xs mb-3">Add admins or members to collaborate on your organization's IT management.</p>
                  </div>
                  <button
                    on:click={openInviteModal}
                    class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-medium"
                  >
                    Invite Your First User
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if inviteModalOpen && tempPassword}
  <Modal open={true} title="Invite User" ariaLabel="Invite result" close={closeInviteModal}>
    <div class="space-y-3">
      <p class="text-sm text-white/80">User invited. Share this temporary password:</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono">{tempPassword}</code>
        <button
          on:click={copyTempPassword}
          class="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white"
        >
          Copy
        </button>
      </div>
    </div>
    <svelte:fragment slot="footer">
      <button on:click={closeInviteModal} class="text-sm px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white">Done</button>
    </svelte:fragment>
  </Modal>
{:else if inviteModalOpen}
  <Modal open={true} title="Invite User" ariaLabel="Invite user form" close={closeInviteModal}>
    <div class="space-y-4">
      <div>
        <label for="invite-email" class="block text-sm text-white/60 mb-1.5">Email <span class="text-red-400">*</span></label>
        <input
          id="invite-email"
          type="email"
          bind:value={inviteEmail}
          data-autofocus
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="invite-name" class="block text-sm text-white/60 mb-1.5">Display Name</label>
        <input
          id="invite-name"
          type="text"
          bind:value={inviteDisplayName}
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="invite-role" class="block text-sm text-white/60 mb-1.5">Role</label>
        <select
          id="invite-role"
          bind:value={inviteRole}
          class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
    <svelte:fragment slot="footer">
      <button on:click={closeInviteModal} class="text-sm px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
      <button
        on:click={inviteUser}
        disabled={!inviteEmail || inviting}
        class="text-sm px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
      >
        {inviting ? "Inviting..." : "Send Invite"}
      </button>
    </svelte:fragment>
  </Modal>
{/if}

{#if deleteModalOpen}
  <Modal open={true} title="Remove User" ariaLabel="Confirm user removal" close={closeDeleteModal}>
    <p class="text-sm text-white/80">
      Are you sure you want to remove <strong class="text-white">{userToDelete?.email}</strong>? They will lose access immediately.
    </p>
    <svelte:fragment slot="footer">
      <button on:click={closeDeleteModal} class="text-sm px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
      <button on:click={deleteUser} class="text-sm px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white">Remove</button>
    </svelte:fragment>
  </Modal>
{/if}
