<script lang="ts">
  import { onMount } from "svelte";

  interface InstalledPack {
    id: string;
    label: string;
    framework: string;
    controlCount: number;
    passCount: number | null;
    failCount: number | null;
    unknownCount: number | null;
    lastEvaluatedAt: string | null;
  }

  interface Control {
    controlId: string;
    title: string;
    ruleFn: string;
    state: "pass" | "fail" | "unknown";
    rationale: string[] | null;
    evaluatedAt: string | null;
    evidenceSampleSize: number;
    packId: string;
    packLabel: string;
    framework: string;
  }

  type SortKey = "controlId" | "title" | "framework" | "packLabel" | "state" | "evidenceSampleSize" | "evaluatedAt";
  type SortDir = "asc" | "desc";

  let loading = true;
  let error: string | null = null;
  let installedPacks: InstalledPack[] = [];
  let allControls: Control[] = [];
  let expandedId: string | null = null;

  let filterPack = "all";
  let filterState = "all";
  let filterFramework = "all";
  let searchText = "";
  let sortKey: SortKey = "controlId";
  let sortDir: SortDir = "asc";

  const FRAMEWORKS = ["SOC2", "ISO27001", "NIST_CSF", "HIPAA", "GDPR"] as const;

  $: totalControls = allControls.length;
  $: totalPass = allControls.filter((c) => c.state === "pass").length;
  $: totalFail = allControls.filter((c) => c.state === "fail").length;
  $: totalUnknown = allControls.filter((c) => c.state === "unknown").length;

  $: filteredControls = allControls
    .filter((c) => {
      if (filterPack !== "all" && c.packId !== filterPack) return false;
      if (filterState !== "all" && c.state !== filterState) return false;
      if (filterFramework !== "all" && c.framework !== filterFramework) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!c.controlId.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "evidenceSampleSize") {
        av = Number(av);
        bv = Number(bv);
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function stateClass(s: string): string {
    switch (s) {
      case "pass":    return "bg-success-muted text-success";
      case "fail":    return "bg-destructive-muted text-destructive";
      default:        return "bg-muted text-muted-foreground";
    }
  }

  function frameworkClass(fw: string): string {
    switch (fw) {
      case "SOC2":      return "bg-info-muted text-info";
      case "ISO27001":  return "bg-primary-muted text-primary";
      case "NIST_CSF":  return "bg-info-muted text-info";
      case "HIPAA":     return "bg-warning-muted text-warning";
      case "GDPR":      return "bg-primary-muted text-primary";
      default:          return "bg-muted text-muted-foreground";
    }
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return mins > 0 ? `${mins}m ago` : "just now";
  }

  async function load() {
    loading = true;
    error = null;
    allControls = [];
    installedPacks = [];
    try {
      const res = await fetch("/api/compliance/api/v1/compliance-packs/installed");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      installedPacks = j.data?.items ?? [];

      if (installedPacks.length === 0) {
        loading = false;
        return;
      }

      const details = await Promise.all(
        installedPacks.map(async (pack) => {
          const dr = await fetch(`/api/compliance/api/v1/compliance-packs/${pack.id}`);
          if (!dr.ok) return [];
          const dj = await dr.json();
          const controls: Control[] = (dj.data?.controls ?? []).map((c: Omit<Control, "packId" | "packLabel" | "framework">) => ({
            ...c,
            packId: pack.id,
            packLabel: pack.label,
            framework: pack.framework,
          }));
          return controls;
        })
      );

      allControls = details.flat();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

<div class="animate-fade-in">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Compliance Controls</h1>
    {#if !loading && !error && installedPacks.length > 0}
      <p class="mt-1 text-sm text-muted-foreground">
        {totalControls} controls across {installedPacks.length} installed pack{installedPacks.length !== 1 ? "s" : ""} —
        <span class="text-success font-medium">{totalPass} passing</span>,
        <span class="text-destructive font-medium">{totalFail} failing</span>,
        <span class="text-muted-foreground font-medium">{totalUnknown} unknown</span>
      </p>
    {/if}
  </div>

  {#if loading}
    <!-- Loading skeleton -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {#each [1, 2, 3, 4] as _}
        <div class="h-20 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-12 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>

  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button>
    </div>

  {:else if installedPacks.length === 0}
    <!-- Empty state -->
    <div class="bg-card border border-dashed border-input rounded-lg p-16 text-center">
      <div class="text-4xl mb-4">
        <div class="inline-block w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-gray-300 dark:border-gray-500 rounded"></div>
        </div>
      </div>
      <p class="text-foreground/80 font-medium text-sm">No compliance packs installed</p>
      <p class="mt-1 text-muted-foreground/70 text-xs">
        Install a pack from
        <a href="/console/compliance/packs" class="text-primary hover:underline">/console/compliance/packs</a>
        to see controls.
      </p>
    </div>

  {:else}
    <!-- Stat cards -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-muted-foreground">Total Controls</div>
        <div class="text-2xl font-bold text-foreground mt-1">{totalControls}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-muted-foreground">Passing</div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{totalPass}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-muted-foreground">Failing</div>
        <div class="text-2xl font-bold text-destructive mt-1">{totalFail}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-muted-foreground">Unknown</div>
        <div class="text-2xl font-bold text-muted-foreground mt-1">{totalUnknown}</div>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <!-- State pills -->
      <div class="flex gap-1">
        {#each ["all", "pass", "fail", "unknown"] as s}
          <button
            on:click={() => { filterState = s; expandedId = null; }}
            class="px-3 py-1 text-xs font-medium rounded-full border transition-colors
              {filterState === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-card text-foreground/80 border-input hover:border-primary'}"
          >
            {s === "all" ? "All states" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        {/each}
      </div>

      <!-- Pack select -->
      <select
        bind:value={filterPack}
        on:change={() => { expandedId = null; }}
        class="px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">All packs</option>
        {#each installedPacks as pack}
          <option value={pack.id}>{pack.label}</option>
        {/each}
      </select>

      <!-- Framework select -->
      <select
        bind:value={filterFramework}
        on:change={() => { expandedId = null; }}
        class="px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">All frameworks</option>
        {#each FRAMEWORKS as fw}
          <option value={fw}>{fw}</option>
        {/each}
      </select>

      <!-- Search -->
      <input
        type="text"
        bind:value={searchText}
        placeholder="Search control ID or title..."
        class="px-3 py-1 text-xs border border-input rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary w-52"
      />

      {#if filteredControls.length !== totalControls}
        <span class="text-xs text-muted-foreground/70">{filteredControls.length} of {totalControls} shown</span>
      {/if}
    </div>

    <!-- Table -->
    {#if filteredControls.length === 0}
      <div class="bg-card border border-dashed border-input rounded-lg p-10 text-center">
        <p class="text-sm text-muted-foreground">No controls match the current filters.</p>
      </div>
    {:else}
      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground bg-gray-50 dark:bg-gray-800/60">
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("controlId")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Control ID{sortIndicator("controlId")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("title")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Title{sortIndicator("title")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("framework")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Framework{sortIndicator("framework")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("packLabel")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Pack{sortIndicator("packLabel")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("state")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    State{sortIndicator("state")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("evidenceSampleSize")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Evidence{sortIndicator("evidenceSampleSize")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">
                  <button on:click={() => toggleSort("evaluatedAt")} class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Last Evaluated{sortIndicator("evaluatedAt")}
                  </button>
                </th>
                <th class="px-4 py-3 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              {#each filteredControls as ctrl (ctrl.packId + ":" + ctrl.controlId)}
                {@const rowKey = ctrl.packId + ":" + ctrl.controlId}
                <tr
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                  on:click={() => { expandedId = expandedId === rowKey ? null : rowKey; }}
                  on:keydown={(e) => e.key === "Enter" && (expandedId = expandedId === rowKey ? null : rowKey)}
                  role="button"
                  tabindex="0"
                >
                  <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-muted-foreground/70 whitespace-nowrap">{ctrl.controlId}</td>
                  <td class="px-4 py-3 text-foreground max-w-xs">
                    <span class="line-clamp-2">{ctrl.title}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {frameworkClass(ctrl.framework)}">
                      {ctrl.framework}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-muted-foreground/70 whitespace-nowrap">{ctrl.packLabel}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {stateClass(ctrl.state)}">
                      {ctrl.state}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {ctrl.evidenceSampleSize} record{ctrl.evidenceSampleSize === 1 ? "" : "s"}
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {relativeTime(ctrl.evaluatedAt)}
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-muted-foreground/70 max-w-xs">
                    {#if ctrl.rationale && ctrl.rationale.length > 0}
                      <span class="line-clamp-1">{ctrl.rationale[0]}{ctrl.rationale.length > 1 ? "…" : ""}</span>
                    {:else}
                      <span class="text-muted-foreground/70">—</span>
                    {/if}
                  </td>
                </tr>

                {#if expandedId === rowKey}
                  <tr class="bg-gray-50 dark:bg-gray-700/30">
                    <td colspan="8" class="px-5 py-4">
                      <div class="space-y-3">
                        <div class="flex flex-wrap gap-x-8 gap-y-1 text-xs text-foreground/80">
                          <div>
                            <span class="font-semibold text-muted-foreground/70 uppercase text-xs">Control ID</span>
                            <p class="font-mono mt-0.5">{ctrl.controlId}</p>
                          </div>
                          <div>
                            <span class="font-semibold text-muted-foreground/70 uppercase text-xs">Rule</span>
                            <p class="font-mono mt-0.5">{ctrl.ruleFn}</p>
                          </div>
                          <div>
                            <span class="font-semibold text-muted-foreground/70 uppercase text-xs">Evaluated</span>
                            <p class="mt-0.5">{ctrl.evaluatedAt ? new Date(ctrl.evaluatedAt).toLocaleString() : "—"}</p>
                          </div>
                        </div>
                        {#if ctrl.rationale && ctrl.rationale.length > 0}
                          <div>
                            <p class="text-xs font-semibold text-muted-foreground/70 uppercase mb-1">Rationale</p>
                            <ul class="space-y-1">
                              {#each ctrl.rationale as item}
                                <li class="text-xs text-foreground/80 flex items-start gap-2">
                                  <span class="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                                    {ctrl.state === 'pass' ? 'bg-success' : ctrl.state === 'fail' ? 'bg-destructive' : 'bg-gray-400'}"></span>
                                  {item}
                                </li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</div>
