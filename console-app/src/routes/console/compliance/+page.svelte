<script lang="ts">
  import { onMount } from "svelte";

  interface FrameworkSummary {
    framework: string;
    controlsTotal: number;
    controlsPassing: number;
    evidenceCount: number;
    score: number;
  }

  interface SummaryData {
    frameworks: FrameworkSummary[];
    totalEvidence: number;
    lastUpdated: string;
  }

  interface EvidenceItem {
    id: string;
    framework: string;
    controlId: string;
    controlName: string;
    source: string;
    createdAt: string;
  }

  let summaryLoading = true;
  let summaryError: string | null = null;
  let summary: SummaryData | null = null;

  let evidenceLoading = true;
  let evidenceError: string | null = null;
  let evidenceItems: EvidenceItem[] = [];
  let evidenceNextCursor: string | null = null;
  let evidenceLoadingMore = false;

  function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours > 0) return `${hours}h ago`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m ago`;
  }

  function scoreColor(score: number): string {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-500 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  async function loadSummary() {
    summaryLoading = true;
    summaryError = null;
    try {
      const res = await fetch("/api/compliance/api/v1/compliance/summary");
      if (!res.ok) {
        summaryError = `Failed to load compliance summary (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      if (result.data) {
        summary = result.data as SummaryData;
      } else {
        summaryError = "No summary data returned";
      }
    } catch (e) {
      summaryError = (e as Error).message;
    } finally {
      summaryLoading = false;
    }
  }

  async function loadEvidence(cursor?: string) {
    if (!cursor) {
      evidenceLoading = true;
      evidenceError = null;
    } else {
      evidenceLoadingMore = true;
    }
    try {
      const url = cursor
        ? `/api/compliance/api/v1/evidence?limit=25&cursor=${encodeURIComponent(cursor)}`
        : "/api/compliance/api/v1/evidence?limit=25";
      const res = await fetch(url);
      if (!res.ok) {
        evidenceError = `Failed to load evidence (HTTP ${res.status})`;
        return;
      }
      const result = await res.json();
      if (result.data) {
        if (cursor) {
          evidenceItems = [...evidenceItems, ...(result.data.items as EvidenceItem[])];
        } else {
          evidenceItems = result.data.items as EvidenceItem[];
        }
        evidenceNextCursor = result.data.nextCursor ?? null;
      } else {
        evidenceError = "No evidence data returned";
      }
    } catch (e) {
      evidenceError = (e as Error).message;
    } finally {
      evidenceLoading = false;
      evidenceLoadingMore = false;
    }
  }

  function refresh() {
    loadSummary();
    loadEvidence();
  }

  onMount(() => {
    loadSummary();
    loadEvidence();
  });
</script>

<div class="p-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Compliance</h1>
      {#if summary}
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {summary.totalEvidence.toLocaleString()} evidence records
        </span>
      {/if}
    </div>
    <button
      on:click={refresh}
      class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      Refresh
    </button>
  </div>

  <!-- Framework Cards -->
  {#if summaryLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {#each Array(5) as _}
        <div class="h-36 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if summaryError}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
      <p class="text-red-800 dark:text-red-300">{summaryError}</p>
      <button
        on:click={loadSummary}
        class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
      >
        Retry
      </button>
    </div>
  {:else if summary && summary.frameworks.length === 0}
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 text-sm text-gray-500 dark:text-gray-400">
      No framework data found. Ingest evidence to see compliance scores.
    </div>
  {:else if summary}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {#each summary.frameworks as fw}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {fw.framework}
          </div>
          <div class="text-5xl font-bold {scoreColor(fw.score)} mb-3">
            {fw.score}%
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {fw.controlsPassing} of {fw.controlsTotal} controls passing
          </div>
          <div class="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {fw.evidenceCount.toLocaleString()} evidence records
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Evidence Table -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Evidence</h2>
    </div>

    {#if evidenceLoading}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each Array(5) as _}
          <div class="px-6 py-4 flex gap-4">
            <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-20"></div>
            <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-16 ml-auto"></div>
          </div>
        {/each}
      </div>
    {:else if evidenceError}
      <div class="p-6">
        <p class="text-red-700 dark:text-red-400 text-sm">{evidenceError}</p>
        <button
          on:click={() => loadEvidence()}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
        >
          Retry
        </button>
      </div>
    {:else if evidenceItems.length === 0}
      <div class="p-6 text-sm text-gray-500 dark:text-gray-400">No evidence records found.</div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Framework</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Control</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collected</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each evidenceItems as item (item.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {item.framework ?? "—"}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  <span class="font-mono text-xs text-gray-500 dark:text-gray-500 mr-1">{item.controlId}</span>
                  {item.controlName ?? ""}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {item.source ?? "—"}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500">
                  {relativeTime(item.createdAt)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if evidenceNextCursor}
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            on:click={() => loadEvidence(evidenceNextCursor ?? undefined)}
            disabled={evidenceLoadingMore}
            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {evidenceLoadingMore ? "Loading…" : "Show more"}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>
