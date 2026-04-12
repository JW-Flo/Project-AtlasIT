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
      case "pass":    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "fail":    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  function frameworkClass(fw: string): string {
    switch (fw) {
      case "SOC2":      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "ISO27001":  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "NIST_CSF":  return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
      case "HIPAA":     return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "GDPR":      return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      default:          return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
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

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Compliance Controls</h1>
    {#if !loading && !error && installedPacks.length > 0}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {totalControls} controls across {installedPacks.length} installed pack{installedPacks.length !== 1 ? "s" : ""} —
        <span class="text-green-600 dark:text-green-400 font-medium">{totalPass} passing</span>,
        <span class="text-red-600 dark:text-red-400 font-medium">{totalFail} failing</span>,
        <span class="text-gray-500 dark:text-gray-400 font-medium">{totalUnknown} unknown</span>
      </p>
    {/if}
  </div>

  {#if loading}
    <!-- Loading skeleton -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {#each [1, 2, 3, 4] as _}
        <div class="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>

  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-300">{error}</p>
      <button on:click={load} class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">Retry</button>
    </div>

  {:else if installedPacks.length === 0}
    <!-- Empty state -->
    <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-16 text-center">
      <div class="text-4xl mb-4">
        <div class="inline-block w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-gray-300 dark:border-gray-500 rounded"></div>
        </div>
      </div>
      <p class="text-gray-700 dark:text-gray-300 font-medium text-sm">No compliance packs installed</p>
      <p class="mt-1 text-gray-400 dark:text-gray-500 text-xs">
        Install a pack from
        <a href="/console/compliance/packs" class="text-blue-600 dark:text-blue-400 hover:underline">/console/compliance/packs</a>
        to see controls.
      </p>
    </div>

  {:else}
    <!-- Stat cards -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500 dark:text-gray-400">Total Controls</div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalControls}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500 dark:text-gray-400">Passing</div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{totalPass}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500 dark:text-gray-400">Failing</div>
        <div class="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{totalFail}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500 dark:text-gray-400">Unknown</div>
        <div class="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">{totalUnknown}</div>
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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'}"
          >
            {s === "all" ? "All states" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        {/each}
      </div>

      <!-- Pack select -->
      <select
        bind:value={filterPack}
        on:change={() => { expandedId = null; }}
        class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
      />

      {#if filteredControls.length !== totalControls}
        <span class="text-xs text-gray-400 dark:text-gray-500">{filteredControls.length} of {totalControls} shown</span>
      {/if}
    </div>

    <!-- Table -->
    {#if filteredControls.length === 0}
      <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">No controls match the current filters.</p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60">
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
                  <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{ctrl.controlId}</td>
                  <td class="px-4 py-3 text-gray-900 dark:text-white max-w-xs">
                    <span class="line-clamp-2">{ctrl.title}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {frameworkClass(ctrl.framework)}">
                      {ctrl.framework}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{ctrl.packLabel}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {stateClass(ctrl.state)}">
                      {ctrl.state}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {ctrl.evidenceSampleSize} record{ctrl.evidenceSampleSize === 1 ? "" : "s"}
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {relativeTime(ctrl.evaluatedAt)}
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                    {#if ctrl.rationale && ctrl.rationale.length > 0}
                      <span class="line-clamp-1">{ctrl.rationale[0]}{ctrl.rationale.length > 1 ? "…" : ""}</span>
                    {:else}
                      <span class="text-gray-400 dark:text-gray-500">—</span>
                    {/if}
                  </td>
                </tr>

                {#if expandedId === rowKey}
                  <tr class="bg-gray-50 dark:bg-gray-700/30">
                    <td colspan="8" class="px-5 py-4">
                      <div class="space-y-3">
                        <div class="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                          <div>
                            <span class="font-semibold text-gray-400 uppercase text-xs">Control ID</span>
                            <p class="font-mono mt-0.5">{ctrl.controlId}</p>
                          </div>
                          <div>
                            <span class="font-semibold text-gray-400 uppercase text-xs">Rule</span>
                            <p class="font-mono mt-0.5">{ctrl.ruleFn}</p>
                          </div>
                          <div>
                            <span class="font-semibold text-gray-400 uppercase text-xs">Evaluated</span>
                            <p class="mt-0.5">{ctrl.evaluatedAt ? new Date(ctrl.evaluatedAt).toLocaleString() : "—"}</p>
                          </div>
                        </div>
                        {#if ctrl.rationale && ctrl.rationale.length > 0}
                          <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase mb-1">Rationale</p>
                            <ul class="space-y-1">
                              {#each ctrl.rationale as item}
                                <li class="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span class="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                                    {ctrl.state === 'pass' ? 'bg-green-500' : ctrl.state === 'fail' ? 'bg-red-500' : 'bg-gray-400'}"></span>
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
