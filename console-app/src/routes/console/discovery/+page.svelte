<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Search, ScanSearch, ChevronDown } from "lucide-svelte";

  // --- Types ---
  interface DiscoveredApp {
    id: string;
    appName: string;
    category?: string;
    provider?: string;
    userCount: number;
    riskTier: "approved" | "under_review" | "blocked" | "unknown";
    isAiTool: number | boolean;
    marketplaceMatch?: string | null;
    firstSeenAt?: string;
    lastSeenAt?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }

  // --- State ---
  let apps: DiscoveredApp[] = [];
  let loading = true;
  let scanning = false;

  // Filters
  let filterRiskTier = "";
  let filterAiOnly = false;
  let searchQuery = "";

  // Actions dropdown state
  let openActionDropdown: string | null = null;

  // --- Derived stats ---
  $: totalDiscovered = apps.length;
  $: aiToolsCount = apps.filter((a) => a.isAiTool === true || a.isAiTool === 1).length;
  $: highRiskCount = apps.filter(
    (a) => a.riskTier === "unknown" && a.userCount > 1,
  ).length;
  $: managedCount = apps.filter((a) => a.marketplaceMatch != null).length;

  // --- Filtered list ---
  $: filteredApps = apps.filter((a) => {
    if (filterRiskTier && a.riskTier !== filterRiskTier) return false;
    if (filterAiOnly && a.isAiTool !== true && a.isAiTool !== 1) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !a.appName.toLowerCase().includes(q) &&
        !(a.category || "").toLowerCase().includes(q) &&
        !(a.provider || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Reset dropdown when filters change
  $: filterRiskTier, filterAiOnly, searchQuery, (openActionDropdown = null);

  // --- Data fetching ---
  async function fetchApps() {
    try {
      const res = await fetch("/api/discovery");
      if (res.ok) {
        const data = await res.json();
        apps = data.apps || [];
      }
    } catch {}
  }

  // --- Actions ---
  async function triggerScan() {
    scanning = true;
    try {
      const res = await fetch("/api/discovery", { method: "POST" });
      if (res.ok) {
        pushToast({ message: "OAuth grant scan started", variant: "success" });
        await fetchApps();
      } else {
        const data = await res.json().catch(() => ({}));
        pushToast({ message: data.message || "Scan failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Scan request failed", variant: "error" });
    }
    scanning = false;
  }

  async function updateRiskTier(
    id: string,
    riskTier: "approved" | "under_review" | "blocked" | "unknown",
  ) {
    openActionDropdown = null;
    try {
      const res = await fetch(`/api/discovery/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ riskTier }),
      });
      if (res.ok) {
        apps = apps.map((a) => (a.id === id ? { ...a, riskTier } : a));
        pushToast({ message: "Risk tier updated", variant: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        pushToast({ message: data.error || "Update failed", variant: "error" });
      }
    } catch {
      pushToast({ message: "Update request failed", variant: "error" });
    }
  }

  // --- Helpers ---
  function riskTierClass(tier: string): string {
    switch (tier) {
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "under_review": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "blocked": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  function riskTierLabel(tier: string): string {
    switch (tier) {
      case "approved": return "Approved";
      case "under_review": return "Under Review";
      case "blocked": return "Blocked";
      default: return "Unknown";
    }
  }

  function formatDate(iso: string | undefined): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  }

  function isAiApp(app: DiscoveredApp): boolean {
    return app.isAiTool === true || app.isAiTool === 1;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".action-dropdown-container")) {
      openActionDropdown = null;
    }
  }

  onMount(() => {
    fetchApps().finally(() => (loading = false));
  });
</script>

<svelte:window on:click={handleClickOutside} />

<div class="space-y-6">
  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-8 w-56" />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each Array(4) as _}
          <Skeleton class="h-24 rounded-lg" />
        {/each}
      </div>
      <Skeleton class="h-64 w-full rounded-lg" />
    </div>
  {:else}
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">SaaS & AI Discovery</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Shadow IT detection via OAuth grant scanning and network telemetry
        </p>
      </div>
      <Button on:click={triggerScan} disabled={scanning}>
        <ScanSearch class="h-4 w-4 mr-1.5" />
        {scanning ? "Scanning..." : "Scan OAuth Grants"}
      </Button>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Discovered</div>
          <div class="text-3xl font-bold">{totalDiscovered}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Tools</div>
          <div class="text-3xl font-bold text-red-500 dark:text-red-400">{aiToolsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground uppercase tracking-wider mb-1">High Risk</div>
          <div class="text-3xl font-bold">{highRiskCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Managed</div>
          <div class="text-3xl font-bold">{managedCount}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          bind:value={searchQuery}
          placeholder="Search apps..."
          class="pl-9"
        />
      </div>

      <select
        bind:value={filterRiskTier}
        class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Risk Tiers</option>
        <option value="approved">Approved</option>
        <option value="under_review">Under Review</option>
        <option value="blocked">Blocked</option>
        <option value="unknown">Unknown</option>
      </select>

      <label class="flex items-center gap-2 text-sm font-medium cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          bind:checked={filterAiOnly}
          class="h-4 w-4 rounded border-input accent-primary"
        />
        AI Tools Only
      </label>
    </div>

    <!-- Table -->
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-3 sm:px-4 py-3 font-medium">App Name</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Provider</th>
                <th class="px-3 sm:px-4 py-3 font-medium text-right">Users</th>
                <th class="px-3 sm:px-4 py-3 font-medium">Risk Tier</th>
                <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">First Seen</th>
                <th class="px-3 sm:px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredApps as app (app.id)}
                <tr class="border-t hover:bg-muted/50 transition-colors">
                  <td class="px-3 sm:px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{app.appName}</span>
                      {#if isAiApp(app)}
                        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          AI
                        </span>
                      {/if}
                    </div>
                    <div class="text-xs text-muted-foreground md:hidden">{app.category || "—"}</div>
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {app.category || "—"}
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {app.provider || "—"}
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-right tabular-nums">
                    {app.userCount}
                  </td>
                  <td class="px-3 sm:px-4 py-3">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {riskTierClass(app.riskTier)}">
                      {riskTierLabel(app.riskTier)}
                    </span>
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatDate(app.firstSeenAt)}
                  </td>
                  <td class="px-3 sm:px-4 py-3 text-right">
                    <div class="action-dropdown-container relative inline-block">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors"
                        on:click|stopPropagation={() =>
                          openActionDropdown = openActionDropdown === app.id ? null : app.id}
                        aria-label="Actions for {app.appName}"
                      >
                        Actions
                        <ChevronDown class="h-3 w-3" />
                      </button>

                      {#if openActionDropdown === app.id}
                        <div class="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-card shadow-lg z-20 overflow-hidden">
                          <button
                            type="button"
                            class="flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            on:click={() => updateRiskTier(app.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            class="flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            on:click={() => updateRiskTier(app.id, "under_review")}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            class="flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-destructive"
                            on:click={() => updateRiskTier(app.id, "blocked")}
                          >
                            Block
                          </button>
                        </div>
                      {/if}
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
                    {apps.length === 0
                      ? "No apps discovered yet. Run a scan to detect OAuth grants."
                      : "No apps match your filters."}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {#if filteredApps.length > 0}
      <p class="text-xs text-muted-foreground text-right">
        Showing {filteredApps.length} of {apps.length} discovered app{apps.length !== 1 ? "s" : ""}
      </p>
    {/if}
  {/if}
</div>
