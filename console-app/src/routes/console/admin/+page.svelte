<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogHeader from "$lib/components/ui/dialog-header.svelte";
  import DialogTitle from "$lib/components/ui/dialog-title.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, Shield, UserX, Eye, Trash2, KeyRound, Copy, Check } from "lucide-svelte";

  interface Tenant {
    id: string;
    name: string;
    ownerEmail: string;
    user_count: number;
    status: string;
    tier: string;
    createdAt: string;
  }

  const tierOptions = ["free", "starter", "professional", "enterprise"];

  let tenants: Tenant[] = [];
  let loading = true;
  let error = "";

  let deleteModalOpen = false;
  let tenantToDelete: Tenant | null = null;

  let disableModalOpen = false;
  let tenantToToggle: Tenant | null = null;

  let impersonateModalOpen = false;
  let tenantToImpersonate: Tenant | null = null;

  async function loadTenants() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/admin/tenants");
      if (!res.ok) throw new Error(`Failed to load tenants (${res.status})`);
      tenants = await res.json();
    } catch (e: any) {
      error = e?.message || "Failed to load tenants";
    } finally {
      loading = false;
    }
  }

  function confirmToggleStatus(tenant: Tenant) {
    tenantToToggle = tenant;
    disableModalOpen = true;
  }

  function closeDisableModal() {
    disableModalOpen = false;
    tenantToToggle = null;
  }

  async function toggleStatus() {
    if (!tenantToToggle) return;
    const tenant = tenantToToggle;
    const newStatus = tenant.status === "active" ? "disabled" : "active";
    closeDisableModal();
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Failed to update tenant`);
      tenant.status = newStatus;
      tenants = tenants;
      pushToast({ message: `Tenant ${newStatus === "active" ? "enabled" : "disabled"}`, variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to update tenant", variant: "error" });
    }
  }

  function confirmDelete(tenant: Tenant) {
    tenantToDelete = tenant;
    deleteModalOpen = true;
  }

  function closeDeleteModal() {
    deleteModalOpen = false;
    tenantToDelete = null;
  }

  async function deleteTenant() {
    if (!tenantToDelete) return;
    try {
      const res = await fetch(`/api/admin/tenants/${tenantToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tenant");
      pushToast({ message: `Tenant "${tenantToDelete.name}" deleted`, variant: "success" });
      closeDeleteModal();
      await loadTenants();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to delete tenant", variant: "error" });
    }
  }

  function confirmImpersonate(tenant: Tenant) {
    tenantToImpersonate = tenant;
    impersonateModalOpen = true;
  }

  function closeImpersonateModal() {
    impersonateModalOpen = false;
    tenantToImpersonate = null;
  }

  async function changeTier(tenant: Tenant, newTier: string) {
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (!res.ok) throw new Error("Failed to update tier");
      tenant.tier = newTier;
      tenants = tenants;
      pushToast({ message: `Tier updated to ${newTier}`, variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to update tier", variant: "error" });
    }
  }

  async function impersonate() {
    if (!tenantToImpersonate) return;
    const tenant = tenantToImpersonate;
    closeImpersonateModal();
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/impersonate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to impersonate tenant");
      const data = await res.json();
      const { token, user } = data?.data ?? {};
      if (!token || !user) throw new Error("Invalid impersonation response");
      // Preserve admin session so we can restore it on exit
      const originalToken = sessionStorage.getItem("atlasit_token");
      const originalUser = sessionStorage.getItem("atlasit_user");
      if (originalToken) sessionStorage.setItem("atlasit_original_token", originalToken);
      if (originalUser) sessionStorage.setItem("atlasit_original_user", originalUser);
      // Switch to tenant session
      sessionStorage.setItem("atlasit_token", token);
      sessionStorage.setItem("atlasit_user", JSON.stringify(user));
      location.href = "/console";
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to impersonate", variant: "error" });
    }
  }

  function exitImpersonation() {
    const originalToken = sessionStorage.getItem("atlasit_original_token");
    const originalUser = sessionStorage.getItem("atlasit_original_user");
    if (originalToken) {
      sessionStorage.setItem("atlasit_token", originalToken);
      sessionStorage.removeItem("atlasit_original_token");
    }
    if (originalUser) {
      sessionStorage.setItem("atlasit_user", originalUser);
      sessionStorage.removeItem("atlasit_original_user");
    }
    location.href = "/console/admin";
  }

  $: isImpersonating = typeof window !== "undefined" &&
    !!sessionStorage.getItem("atlasit_original_token");

  onMount(loadTenants);

  // ── Password reset ────────────────────────────────────────────────
  let resetEmail = "";
  let resetLoading = false;
  let resetResult: { tempPassword: string } | null = null;
  let resetError = "";
  let copied = false;

  async function resetPassword() {
    if (!resetEmail.trim()) return;
    resetLoading = true;
    resetResult = null;
    resetError = "";
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        resetError = data.error || `Error ${res.status}`;
      } else {
        resetResult = data;
        resetEmail = "";
      }
    } catch (e: any) {
      resetError = e?.message || "Request failed";
    } finally {
      resetLoading = false;
    }
  }

  async function copyPassword() {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult.tempPassword);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="space-y-6">
  {#if isImpersonating}
    <div class="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div class="flex items-center gap-2 text-sm text-amber-800">
        <Eye class="h-4 w-4 shrink-0" />
        <span>You are impersonating a tenant. Actions taken here affect their account.</span>
      </div>
      <Button size="sm" variant="outline" on:click={exitImpersonation}>Exit impersonation</Button>
    </div>
  {/if}

  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Platform Administration</h1>
      <p class="text-sm text-muted-foreground">Manage tenants across the platform</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Shield class="h-5 w-5 text-primary" />
    </div>
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
        <Skeleton class="h-16 rounded-lg" />
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-3 sm:px-4 py-3 font-medium">Org Name</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Owner Email</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Users</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Tier</th>
                <th class="px-3 sm:px-4 py-3 font-medium">Status</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Created</th>
                <th class="px-3 sm:px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each tenants as tenant}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-3 sm:px-4 py-3">
                    <div class="font-medium">{tenant.name}</div>
                    <div class="text-xs text-muted-foreground sm:hidden">{tenant.ownerEmail}</div>
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{tenant.ownerEmail}</td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">{tenant.user_count}</td>
                  <td class="px-3 sm:px-4 py-3 hidden sm:table-cell">
                    <select
                      class="text-xs border rounded px-2 py-1 bg-background"
                      value={tenant.tier || "free"}
                      on:change={(e) => changeTier(tenant, e.currentTarget.value)}
                    >
                      {#each tierOptions as t}
                        <option value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      {/each}
                    </select>
                  </td>
                  <td class="px-3 sm:px-4 py-3">
                    <Badge variant={tenant.status === 'active' ? 'success' : 'destructive'}>
                      {tenant.status}
                    </Badge>
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td class="px-3 sm:px-4 py-3">
                    <div class="flex flex-wrap gap-1.5 sm:gap-2">
                      <Button
                        size="sm"
                        variant={tenant.status === 'active' ? 'outline' : 'success'}
                        on:click={() => confirmToggleStatus(tenant)}
                      >
                        {tenant.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="secondary" on:click={() => confirmImpersonate(tenant)}>
                        <Eye class="h-3 w-3 mr-1" />
                        Impersonate
                      </Button>
                      <Button size="sm" variant="destructive" on:click={() => confirmDelete(tenant)}>
                        <Trash2 class="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="px-4 py-6 text-center text-muted-foreground">No tenants found</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<!-- ── Password Reset ──────────────────────────────────────────────── -->
<Card>
  <CardHeader>
    <CardTitle>
      <div class="flex items-center gap-2">
        <KeyRound class="h-4 w-4 text-primary" />
        Reset User Password
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p class="text-sm text-muted-foreground mb-4">
      Generate a new temporary password for any platform user. Share it securely — the user should change it immediately after logging in.
    </p>
    <form on:submit|preventDefault={resetPassword} class="flex gap-2 max-w-md">
      <input
        type="email"
        bind:value={resetEmail}
        placeholder="user@example.com"
        required
        class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={resetLoading}>
        {resetLoading ? "Resetting…" : "Reset"}
      </Button>
    </form>

    {#if resetError}
      <div class="mt-3 flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {resetError}
      </div>
    {/if}

    {#if resetResult}
      <div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 max-w-md">
        <p class="text-xs font-medium text-amber-800 mb-1">Temporary password — share securely and discard</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 font-mono text-sm text-amber-900 break-all">{resetResult.tempPassword}</code>
          <button
            on:click={copyPassword}
            class="shrink-0 rounded p-1.5 text-amber-700 hover:bg-amber-100 transition-colors"
            title="Copy to clipboard"
          >
            {#if copied}
              <Check class="h-4 w-4 text-green-600" />
            {:else}
              <Copy class="h-4 w-4" />
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>

<Dialog open={deleteModalOpen} onClose={closeDeleteModal}>
  <DialogHeader>
    <DialogTitle>Delete Tenant</DialogTitle>
  </DialogHeader>
  <p class="text-sm text-muted-foreground">
    Are you sure you want to delete tenant <strong class="text-foreground">{tenantToDelete?.name}</strong>? This cannot be undone.
  </p>
  <DialogFooter>
    <Button variant="outline" on:click={closeDeleteModal}>Cancel</Button>
    <Button variant="destructive" on:click={deleteTenant}>Delete</Button>
  </DialogFooter>
</Dialog>

<Dialog open={disableModalOpen} onClose={closeDisableModal}>
  <DialogHeader>
    <DialogTitle>{tenantToToggle?.status === "active" ? "Disable" : "Enable"} Tenant</DialogTitle>
  </DialogHeader>
  <p class="text-sm text-muted-foreground">
    Are you sure you want to {tenantToToggle?.status === "active" ? "disable" : "enable"} tenant
    <strong class="text-foreground">{tenantToToggle?.name}</strong>?
    {#if tenantToToggle?.status === "active"}
      All users will lose access immediately.
    {/if}
  </p>
  <DialogFooter>
    <Button variant="outline" on:click={closeDisableModal}>Cancel</Button>
    <Button variant={tenantToToggle?.status === "active" ? "destructive" : "default"} on:click={toggleStatus}>
      {tenantToToggle?.status === "active" ? "Disable" : "Enable"}
    </Button>
  </DialogFooter>
</Dialog>

<Dialog open={impersonateModalOpen} onClose={closeImpersonateModal}>
  <DialogHeader>
    <DialogTitle>Impersonate Tenant</DialogTitle>
  </DialogHeader>
  <div class="space-y-2">
    <p class="text-sm text-muted-foreground">
      You are about to impersonate <strong class="text-foreground">{tenantToImpersonate?.name}</strong>.
    </p>
    <p class="text-sm text-muted-foreground">
      Your session will switch to this tenant's context and all actions you take will be performed as that tenant. This session change is logged in the audit trail.
    </p>
  </div>
  <DialogFooter>
    <Button variant="outline" on:click={closeImpersonateModal}>Cancel</Button>
    <Button variant="secondary" on:click={impersonate}>
      <Eye class="h-3 w-3 mr-1" />
      Impersonate
    </Button>
  </DialogFooter>
</Dialog>
