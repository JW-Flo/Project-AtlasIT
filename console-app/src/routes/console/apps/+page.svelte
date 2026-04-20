<script lang="ts">
  import { onMount } from "svelte";
  import { PageHeader, Card, Badge, Button, EmptyState, StatCard } from "$lib/components/ui";
  import { relativeTime } from "$lib/utils/time";
  import { AlertCircle, AppWindow, CheckCircle2, Plug, Plus } from "lucide-svelte";

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

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-success-muted text-success";
      case "inactive":
      case "disabled":
        return "bg-muted text-muted-foreground";
      case "error":
      case "failed":
        return "bg-destructive-muted text-destructive";
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

<svelte:head>
  <title>Connected Apps · AtlasIT</title>
</svelte:head>

<div class="animate-fade-in">
  <PageHeader title="Connected Apps" description="Manage integrations that feed your compliance evidence pipeline">
    <svelte:fragment slot="actions">
      <Button variant="primary" size="sm" href="/console/marketplace">
        <Plus class="h-3.5 w-3.5" strokeWidth={2.25} />
        Connect app
      </Button>
    </svelte:fragment>
  </PageHeader>

  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {#each Array(3) as _}
        <div class="h-24 skeleton rounded-xl"></div>
      {/each}
    </div>
    <div class="h-64 skeleton rounded-xl"></div>
  {:else if error}
    <Card padding="md" class="bg-destructive-muted border-destructive/20">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2} />
        <div class="flex-1">
          <p class="text-sm text-destructive font-medium">{error}</p>
          <Button variant="destructive" size="sm" class="mt-3" on:click={loadIntegrations}>Retry</Button>
        </div>
      </div>
    </Card>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <StatCard label="Total" value={totalCount} icon={AppWindow} />
      <StatCard label="Active" value={activeCount} icon={CheckCircle2} intent="success" />
      <StatCard label="Inactive" value={inactiveCount} icon={Plug} />
    </div>

    <!-- Filter pills -->
    <div class="flex gap-1.5 mb-4 flex-wrap">
      {#each filterOptions as opt}
        <button
          type="button"
          on:click={() => (filter = opt.value)}
          class={"px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-fast " +
            (filter === opt.value
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground border border-transparent hover:border-border")}
        >
          {opt.label}
        </button>
      {/each}
    </div>

    <Card padding="none" class="overflow-hidden">
      {#if filtered.length === 0}
        {#if integrations.length === 0}
          <EmptyState
            title="No apps connected"
            description="Connect your first integration to start collecting compliance evidence automatically."
            icon={AppWindow}
          >
            <svelte:fragment slot="action">
              <Button variant="primary" size="sm" href="/console/marketplace">
                <Plus class="h-3 w-3" strokeWidth={2.25} />
                Connect first app
              </Button>
            </svelte:fragment>
          </EmptyState>
        {:else}
          <div class="p-10 text-center text-sm text-muted-foreground">No integrations match the selected filter.</div>
        {/if}
      {:else}
        <div class="overflow-x-auto mobile-table-wrapper">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-muted/40 border-b border-border">
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Connected</th>
                <th class="px-5 py-2.5 text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Last sync</th>
                <th class="px-5 py-2.5 text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filtered as integration (integration.id)}
                <tr class="row-hover">
                  <td class="px-5 py-2.5 font-medium text-foreground capitalize">{integration.provider}</td>
                  <td class="px-5 py-2.5 text-xs text-muted-foreground capitalize">{integration.type}</td>
                  <td class="px-5 py-2.5">
                    <Badge
                      variant={integration.status === "active" ? "success" : integration.status === "error" ? "destructive" : "muted"}
                      size="sm"
                      dot
                    >
                      {integration.status}
                    </Badge>
                  </td>
                  <td class="px-5 py-2.5 text-2xs text-muted-foreground tabular-nums">{relativeTime(integration.created_at)}</td>
                  <td class="px-5 py-2.5 text-2xs text-muted-foreground tabular-nums">{relativeTime(integration.updated_at)}</td>
                  <td class="px-5 py-2.5 text-right">
                    <a
                      href="/console/marketplace?provider={integration.provider}"
                      class="text-2xs font-medium text-primary hover:underline"
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
    </Card>
  {/if}
</div>
