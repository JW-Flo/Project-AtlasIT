<script lang="ts">
  import { onMount } from "svelte";

  interface Integration {
    id: string;
    provider: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  let integrations: Integration[] = [];
  let loading = true;
  let error: string | null = null;
  let filter: "all" | "active" | "inactive" | "error" = "all";

  async function loadIntegrations() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/v1/apps/integrations");
      if (!res.ok) {
        error = `Failed to load integrations (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      integrations = result.data?.items ?? [];
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadIntegrations();
  });

  $: filtered = integrations.filter((i) => {
    if (filter === "all") return true;
    if (filter === "active") return i.status === "active";
    if (filter === "inactive") return i.status === "inactive" || i.status === "disabled";
    if (filter === "error") return i.status === "error" || i.status === "failed";
    return true;
  });

  $: totalCount = integrations.length;
  $: activeCount = integrations.filter((i) => i.status === "active").length;
  $: inactiveCount = integrations.filter(
    (i) => i.status === "inactive" || i.status === "disabled",
  ).length;

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m ago`;
  }

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-success-muted text-success";
      case "inactive":
      case "disabled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-muted-foreground/70";
      case "error":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-warning-muted text-warning";
    }
  }

  const filterOptions: { label: string; value: typeof filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Error", value: "error" },
  ];
</script>

<div class="animate-fade-in">
  <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Connected Apps</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manage your tenant's connected integrations
      </p>
    </div>
    <a
      href="/console/marketplace"
      class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors"
    >
      Connect App
    </a>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {#each Array(3) as _}
        <div class="h-20 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="h-64 bg-muted rounded-lg animate-pulse"></div>
  {:else if error}
    <div
      class="bg-destructive-muted border border-destructive/20 rounded-lg p-4"
    >
      <p class="text-destructive">{error}</p>
      <button
        on:click={loadIntegrations}
        class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        class="bg-card border border-border rounded-lg p-5"
      >
        <div class="text-sm text-muted-foreground">Total</div>
        <div class="mt-1 text-3xl font-bold text-foreground">{totalCount}</div>
      </div>
      <div
        class="bg-card border border-border rounded-lg p-5"
      >
        <div class="text-sm text-muted-foreground">Active</div>
        <div class="mt-1 text-3xl font-bold text-success">{activeCount}</div>
      </div>
      <div
        class="bg-card border border-border rounded-lg p-5"
      >
        <div class="text-sm text-muted-foreground">Inactive</div>
        <div class="mt-1 text-3xl font-bold text-foreground">{inactiveCount}</div>
      </div>
    </div>

    <!-- Filter pills -->
    <div class="flex gap-2 mb-4 flex-wrap">
      {#each filterOptions as opt}
        <button
          type="button"
          on:click={() => (filter = opt.value)}
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {filter === opt.value
            ? 'bg-blue-600 text-white'
            : 'bg-muted text-foreground/80 hover:bg-gray-200 dark:hover:bg-gray-700'}"
        >
          {opt.label}
        </button>
      {/each}
    </div>

    <!-- Table -->
    <div class="bg-card border border-border rounded-lg overflow-hidden">
      {#if filtered.length === 0}
        <div class="p-12 text-center text-muted-foreground">
          {#if integrations.length === 0}
            <p class="text-base font-medium mb-2">No apps connected</p>
            <p class="text-sm mb-4">Click Connect App to get started.</p>
            <a
              href="/console/marketplace"
              class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors"
            >
              Connect App
            </a>
          {:else}
            No integrations match the selected filter.
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider text-left"
              >
                <th class="px-6 py-3">Provider</th>
                <th class="px-6 py-3">Type</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Connected</th>
                <th class="px-6 py-3">Last Sync</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              {#each filtered as integration (integration.id)}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-foreground capitalize">
                    {integration.provider}
                  </td>
                  <td class="px-6 py-4 text-foreground/80 capitalize">
                    {integration.type}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {statusBadgeClass(integration.status)}"
                    >
                      {integration.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-muted-foreground">
                    {relativeTime(integration.created_at)}
                  </td>
                  <td class="px-6 py-4 text-muted-foreground">
                    {relativeTime(integration.updated_at)}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a
                      href="/console/marketplace?provider={integration.provider}"
                      class="text-primary hover:text-primary-hover text-sm font-medium"
                    >
                      Manage
                    </a>
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
