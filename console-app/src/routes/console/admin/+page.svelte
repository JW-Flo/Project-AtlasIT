<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Modal from "$lib/components/overlays/Modal.svelte";

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

<div class="px-6 py-6 space-y-6 max-w-6xl mx-auto">
  <h1 class="text-2xl font-semibold">Platform Administration</h1>

  {#if error}
    <div class="text-red-400 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
  {/if}

  {#if loading}
    <div class="text-white/50 text-sm">Loading tenants...</div>
  {:else}
    <div class="bg-[#1a2332] rounded-lg border border-white/10 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-white/50 border-b border-white/10">
            <th class="px-4 py-3 font-medium">Org Name</th>
            <th class="px-4 py-3 font-medium">Owner Email</th>
            <th class="px-4 py-3 font-medium">Users</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Created</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each tenants as tenant}
            <tr class="border-b border-white/10 hover:bg-white/5">
              <td class="px-4 py-3 text-white">{tenant.name}</td>
              <td class="px-4 py-3 text-white/80">{tenant.ownerEmail}</td>
              <td class="px-4 py-3 text-white/80">{tenant.user_count}</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  {tenant.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                  {tenant.status}
                </span>
              </td>
              <td class="px-4 py-3 text-white/60">{new Date(tenant.createdAt).toLocaleDateString()}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button
                    on:click={() => toggleStatus(tenant)}
                    class="text-xs px-2.5 py-1 rounded {tenant.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} text-white"
                  >
                    {tenant.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button
                    on:click={() => impersonate(tenant)}
                    class="text-xs bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded text-white"
                  >
                    Impersonate
                  </button>
                  <button
                    on:click={() => confirmDelete(tenant)}
                    class="text-xs bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded text-white"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-4 py-6 text-center text-white/40">No tenants found</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if deleteModalOpen}
  <Modal open={true} title="Delete Tenant" ariaLabel="Confirm tenant deletion" close={closeDeleteModal}>
    <p class="text-sm text-white/80">
      Are you sure you want to delete tenant <strong class="text-white">{tenantToDelete?.name}</strong>? This cannot be undone.
    </p>
    <svelte:fragment slot="footer">
      <button on:click={closeDeleteModal} class="text-sm px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
      <button on:click={deleteTenant} class="text-sm px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white">Delete</button>
    </svelte:fragment>
  </Modal>
{/if}
