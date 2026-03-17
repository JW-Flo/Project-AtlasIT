<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import AppCard from "$lib/components/marketplace/AppCard.svelte";
  import CategoryFilter from "$lib/components/marketplace/CategoryFilter.svelte";
  import type { MarketplaceApp, Install } from "$lib/api/marketplace";
  import { installApp } from "$lib/api/marketplace";
  import { session, fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, Package, RefreshCw } from "lucide-svelte";

  export let data: { apps: MarketplaceApp[]; installs: Install[] };

  let apps: MarketplaceApp[] = data.apps;
  let installs: Install[] = data.installs;
  let searchQuery = "";
  let activeCategory = "all";
  let loading = false;
  let installingId: string | null = null;
  let error: string | null = null;

  $: categories = [
    ...new Set(apps.map((a) => a.category).filter(Boolean)),
  ].sort();

  $: installMap = new Map(
    installs
      .filter((i) => i.status !== "uninstalled")
      .map((i) => [i.app_id, i]),
  );

  $: filtered = apps.filter((app) => {
    if (activeCategory !== "all" && app.category !== activeCategory)
      return false;
    if (
      searchQuery &&
      !app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(app.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  $: installedCount = installs.filter(
    (i) => i.status === "active" || i.status === "installed",
  ).length;

  onMount(async () => {
    await fetchSession();

    if (apps.length === 0) {
      loading = true;
      try {
        const res = await fetch("/api/marketplace");
        if (res.ok) {
          const body = await res.json();
          apps = body.data ?? [];
        } else {
          error = "Failed to load marketplace apps";
        }
      } catch {
        error = "Failed to connect to marketplace";
      }

      try {
        const res = await fetch("/api/marketplace/installs");
        if (res.ok) {
          const body = await res.json();
          installs = body.data ?? [];
        }
      } catch {
        // Non-blocking
      }
      loading = false;
    }
  });

  async function handleInstall(app: MarketplaceApp) {
    let tenantId: string | undefined;
    session.subscribe((s) => (tenantId = s?.tenantId))();

    if (!tenantId) {
      pushToast({ message: "No tenant found. Please log in.", variant: "error" });
      return;
    }

    installingId = app.id;
    try {
      const install = await installApp(tenantId, app.id);
      installs = [...installs, install];
      pushToast({
        message: `${app.name} installed successfully`,
        variant: "success",
      });
    } catch (e: any) {
      pushToast({
        message: e?.message || `Failed to install ${app.name}`,
        variant: "error",
      });
    }
    installingId = null;
  }
</script>

<div class="space-y-6 px-5 py-5 max-w-[1400px] mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Marketplace</h1>
      <p class="text-sm text-muted-foreground">
        Browse and install apps to extend your IT automation platform
      </p>
    </div>
    <div class="flex items-center gap-3">
      {#if installedCount > 0}
        <Badge variant="success">{installedCount} Installed</Badge>
      {/if}
      <a href="/console">
        <Button variant="outline" size="sm">Back to Dashboard</Button>
      </a>
    </div>
  </div>

  <!-- Search -->
  <Input
    type="text"
    bind:value={searchQuery}
    placeholder="Search apps..."
    class="max-w-md"
  />

  <!-- Category filter -->
  <div>
    <CategoryFilter
      {categories}
      active={activeCategory}
      onChange={(cat) => (activeCategory = cat)}
    />
  </div>

  <!-- Loading state -->
  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each Array(8) as _}
        <Skeleton class="h-56 rounded-lg" />
      {/each}
    </div>

  <!-- Error state -->
  {:else if error}
    <Card class="py-16 text-center">
      <CardContent>
        <AlertTriangle class="w-12 h-12 mx-auto mb-4 text-destructive/60" />
        <p class="text-lg mb-2">{error}</p>
        <Button on:click={() => location.reload()} class="mt-2">
          <RefreshCw class="h-4 w-4 mr-1.5" />
          Retry
        </Button>
      </CardContent>
    </Card>

  <!-- Empty state -->
  {:else if filtered.length === 0 && !searchQuery && activeCategory === "all"}
    <Card class="py-16 text-center">
      <CardContent>
        <Package class="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p class="text-lg mb-1">No apps available yet</p>
        <p class="text-sm text-muted-foreground">
          The marketplace catalog is being populated. Check back soon.
        </p>
      </CardContent>
    </Card>

  <!-- No results for search/filter -->
  {:else if filtered.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      <p class="text-lg">No apps found</p>
      <p class="text-sm mt-1">Try a different search term or category</p>
    </div>

  <!-- App grid -->
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each filtered as app (app.id)}
        <AppCard
          {app}
          install={installMap.get(app.id) ?? null}
          loading={installingId === app.id}
          onInstall={handleInstall}
        />
      {/each}
    </div>
  {/if}
</div>
