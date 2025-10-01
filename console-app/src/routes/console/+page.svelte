<script lang="ts">
  import { onMount } from "svelte";
  import FrameworkCoverage from "$lib/components/FrameworkCoverage.svelte";
  import RiskMatrix from "$lib/components/RiskMatrix.svelte";
  import PolicyCards from "$lib/components/PolicyCards.svelte";
  import RiskHeatmap from "$lib/components/visual/RiskHeatmap.svelte";
  import Skeleton from "$lib/components/loading/Skeleton.svelte";

  interface Snapshot {
    generatedAt: string;
    frameworkSummary: Array<{
      framework: string;
      coveragePercent: number;
      passing: number;
      failing: number;
      total: number;
    }>;
    risks: Array<{
      id: string;
      title: string;
      severity: string;
      likelihood: number;
      impact: number;
      owner?: string;
    }>;
    policies: Array<{
      id: string;
      name: string;
      status: string;
      updated: string;
    }>;
  }

  let snapshot: Snapshot | null = null;
  let loading = true;
  let error: string | null = null;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/mock/compliance/snapshot");
      if (!res.ok) throw new Error("fetch failed");
      snapshot = await res.json();
    } catch (e: any) {
      error = e.message || "unknown error";
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h1 class="text-3xl font-semibold mb-1">AtlasIT Console</h1>
      <p class="text-sm text-white/60">
        Mocked preview of compliance & risk view.
      </p>
    </div>
    <button
      on:click={load}
      class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white"
      >Refresh</button
    >
  </div>

  {#if loading}
    <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div class="flex gap-4">
        <Skeleton width="180px" height="20px" />
        <Skeleton width="140px" height="20px" />
        <Skeleton width="160px" height="20px" />
      </div>
      <Skeleton width="60%" height="14px" />
      <div class="flex gap-6 mt-4">
        <Skeleton width="45%" height="180px" />
        <Skeleton width="45%" height="180px" />
      </div>
    </div>
  {:else if error}
    <div class="text-sm text-red-400">{error}</div>
  {:else if snapshot}
    <section class="mt-2">
      <h2 class="text-lg font-semibold mb-3">Framework Coverage</h2>
      <FrameworkCoverage frameworks={snapshot.frameworkSummary} />
      <div class="flex flex-wrap gap-4 mt-6">
        <div class="flex-1 basis-[480px] min-w-[420px] flex flex-col gap-4">
          <RiskMatrix risks={snapshot.risks} />
          <RiskHeatmap risks={snapshot.risks} />
        </div>
        <div class="flex-[2] basis-[640px] min-w-[480px]">
          <PolicyCards policies={snapshot.policies} />
        </div>
      </div>
    </section>
  {/if}
</div>
