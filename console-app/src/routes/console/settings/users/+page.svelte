<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogHeader from "$lib/components/ui/dialog-header.svelte";
  import DialogTitle from "$lib/components/ui/dialog-title.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, UserPlus, Users, Trash2, Copy, ExternalLink } from "lucide-svelte";

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

  let inviteEmailError = "";

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
    inviteEmailError = "";
    inviteModalOpen = true;
  }

  function closeInviteModal() {
    inviteModalOpen = false;
    tempPassword = "";
  }

  async function inviteUser() {
    if (!inviteEmail) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      inviteEmailError = "Please enter a valid email address";
      return;
    }
    inviteEmailError = "";
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

<div class="space-y-6">
  <!-- Directory cross-link banner -->
  <a
    href="/console/directory"
    class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10 transition-colors"
  >
    <span class="text-foreground">
      <strong>Directory:</strong> View all organization users and groups in the Directory
    </span>
    <ExternalLink class="h-4 w-4 text-primary shrink-0" />
  </a>

  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-semibold tracking-tight">User Management</h1>
    <Button size="sm" on:click={openInviteModal}>
      <UserPlus class="h-4 w-4 mr-1.5" />
      Invite User
    </Button>
  </div>

  <div class="flex gap-1 border-b">
    {#each settingsTabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {current === tab.href
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
      >{tab.label}</a>
    {/each}
  </div>

  {#if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Email</th>
                <th class="px-4 py-3 font-medium">Role</th>
                <th class="px-4 py-3 font-medium">Last Login</th>
                <th class="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 font-medium">{user.displayName || "---"}</td>
                  <td class="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td class="px-4 py-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2 items-center">
                      <select
                        value={user.role}
                        on:change={(e) => changeRole(user, e.currentTarget.value)}
                        class="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                      </select>
                      <Button size="sm" variant="destructive" on:click={() => confirmDelete(user)}>
                        <Trash2 class="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="px-4 py-10 text-center">
                    <Users class="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p class="text-muted-foreground font-medium mb-1">Invite your first team member</p>
                    <p class="text-muted-foreground text-xs mb-3">Add admins or members to collaborate on your organization's IT management.</p>
                    <Button on:click={openInviteModal}>
                      <UserPlus class="h-4 w-4 mr-1.5" />
                      Invite Your First User
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<!-- Invite Modal: Show temp password -->
<Dialog open={inviteModalOpen && !!tempPassword} onClose={closeInviteModal}>
  <DialogHeader>
    <DialogTitle>User Invited</DialogTitle>
  </DialogHeader>
  <div class="space-y-3">
    <p class="text-sm text-muted-foreground">User invited. Share this temporary password:</p>
    <div class="flex items-center gap-2">
      <code class="flex-1 bg-muted border rounded-md px-3 py-2 text-sm font-mono">{tempPassword}</code>
      <Button size="sm" variant="outline" on:click={copyTempPassword}>
        <Copy class="h-4 w-4" />
      </Button>
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" on:click={closeInviteModal}>Done</Button>
  </DialogFooter>
</Dialog>

<!-- Invite Modal: Form -->
<Dialog open={inviteModalOpen && !tempPassword} onClose={closeInviteModal}>
  <DialogHeader>
    <DialogTitle>Invite User</DialogTitle>
  </DialogHeader>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label htmlFor="invite-email">Email <span class="text-destructive">*</span></Label>
      <Input id="invite-email" type="email" bind:value={inviteEmail} />
      {#if inviteEmailError}
        <p class="text-sm text-destructive">{inviteEmailError}</p>
      {/if}
    </div>
    <div class="space-y-2">
      <Label htmlFor="invite-name">Display Name</Label>
      <Input id="invite-name" bind:value={inviteDisplayName} />
    </div>
    <div class="space-y-2">
      <Label htmlFor="invite-role">Role</Label>
      <select
        id="invite-role"
        bind:value={inviteRole}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" on:click={closeInviteModal}>Cancel</Button>
    <Button on:click={inviteUser} disabled={!inviteEmail || inviting}>
      {inviting ? "Inviting..." : "Send Invite"}
    </Button>
  </DialogFooter>
</Dialog>

<!-- Delete Modal -->
<Dialog open={deleteModalOpen} onClose={closeDeleteModal}>
  <DialogHeader>
    <DialogTitle>Remove User</DialogTitle>
  </DialogHeader>
  <p class="text-sm text-muted-foreground">
    Are you sure you want to remove <strong class="text-foreground">{userToDelete?.email}</strong>? They will lose access immediately.
  </p>
  <DialogFooter>
    <Button variant="outline" on:click={closeDeleteModal}>Cancel</Button>
    <Button variant="destructive" on:click={deleteUser}>Remove</Button>
  </DialogFooter>
</Dialog>
