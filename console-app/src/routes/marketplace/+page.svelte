<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import AppCard from "$lib/components/marketplace/AppCard.svelte";
  import CategoryFilter from "$lib/components/marketplace/CategoryFilter.svelte";
  import type { MarketplaceApp, Install } from "$lib/api/marketplace";
  import { installApp } from "$lib/api/marketplace";
  import { session, fetchSession } from "$lib/stores/session";

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

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1" style="color: var(--color-text);">
        Marketplace
      </h1>
      <p class="text-sm" style="color: var(--color-text-dim);">
        Browse and install apps to extend your IT automation platform
      </p>
    </div>
    <div class="flex items-center gap-3">
      {#if installedCount > 0}
        <span
          class="text-sm px-3 py-1.5 rounded font-medium"
          style="background: rgba(34,197,94,0.15); color: #22c55e;"
        >
          {installedCount} Installed
        </span>
      {/if}
      <a
        href="/console"
        class="text-sm px-3 py-1.5 rounded"
        style="background: var(--color-surface); color: var(--color-text);"
      >
        Back to Dashboard
      </a>
    </div>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search apps..."
      class="w-full max-w-md px-4 py-2.5 rounded-lg text-sm"
      style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text);"
    />
  </div>

  <!-- Category filter -->
  <div class="mb-6">
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
        <div
          class="rounded-lg p-5 animate-pulse"
          style="background: var(--color-surface); height: 220px;"
        >
          <div
            class="w-10 h-10 rounded-lg mb-3"
            style="background: var(--color-surface-alt);"
          ></div>
          <div
            class="h-4 rounded mb-2 w-2/3"
            style="background: var(--color-surface-alt);"
          ></div>
          <div
            class="h-3 rounded mb-1 w-1/3"
            style="background: var(--color-surface-alt);"
          ></div>
          <div
            class="h-3 rounded w-full mt-4"
            style="background: var(--color-surface-alt);"
          ></div>
        </div>
      {/each}
    </div>

  <!-- Error state -->
  {:else if error}
    <div
      class="text-center py-16 rounded-lg"
      style="background: var(--color-surface);"
    >
      <svg
        class="w-12 h-12 mx-auto mb-4"
        style="color: #ef4444; opacity: 0.6;"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p class="text-lg mb-2" style="color: var(--color-text);">{error}</p>
      <button
        type="button"
        class="text-sm px-4 py-2 rounded mt-2 font-medium text-white"
        style="background: var(--color-accent);"
        on:click={() => location.reload()}
      >
        Retry
      </button>
    </div>

  <!-- Empty state -->
  {:else if filtered.length === 0 && !searchQuery && activeCategory === "all"}
    <div
      class="text-center py-16 rounded-lg"
      style="background: var(--color-surface);"
    >
      <svg
        class="w-12 h-12 mx-auto mb-4"
        style="color: var(--color-text-dim); opacity: 0.3;"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <p class="text-lg mb-1" style="color: var(--color-text);">
        No apps available yet
      </p>
      <p class="text-sm" style="color: var(--color-text-dim);">
        The marketplace catalog is being populated. Check back soon.
      </p>
    </div>

  <!-- No results for search/filter -->
  {:else if filtered.length === 0}
    <div class="text-center py-12" style="color: var(--color-text-dim);">
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
