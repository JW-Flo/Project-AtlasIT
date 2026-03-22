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
  import { AlertTriangle, Shield, UserX, Eye, Trash2 } from "lucide-svelte";

  interface Tenant {
    id: string;
    name: string;
    ownerEmail: string;
    user_count: number;
    status: string;
    createdAt: string;
  }

  let tenants: Tenant[] = [];
  let loading = true;
  let error = "";

  let deleteModalOpen = false;
  let tenantToDelete: Tenant | null = null;

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

  async function toggleStatus(tenant: Tenant) {
    const newStatus = tenant.status === "active" ? "disabled" : "active";
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

  async function impersonate(tenant: Tenant) {
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/impersonate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to impersonate tenant");
      location.href = "/console";
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to impersonate", variant: "error" });
    }
  }

  onMount(loadTenants);
</script>

<div class="space-y-6">
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
                        on:click={() => toggleStatus(tenant)}
                      >
                        {tenant.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="secondary" on:click={() => impersonate(tenant)}>
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
                  <td colspan="6" class="px-4 py-6 text-center text-muted-foreground">No tenants found</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

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
