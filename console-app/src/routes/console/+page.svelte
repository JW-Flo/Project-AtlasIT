<script lang="ts">
  import { onMount } from "svelte";
  import FrameworkCoverage from "$lib/components/FrameworkCoverage.svelte";
  import RiskMatrix from "$lib/components/RiskMatrix.svelte";
  import PolicyCards from "$lib/components/PolicyCards.svelte";
  import RiskHeatmap from "$lib/components/visual/RiskHeatmap.svelte";
  import Skeleton from "$lib/components/loading/Skeleton.svelte";
  import EvidenceSummary, {
    type EvidenceSummaryItem,
  } from "$lib/components/EvidenceSummary.svelte";
  import { getRuntimeConfig } from "$lib/config";

  interface SnapshotRisk {
    id: string;
    title: string;
    severity: string;
    likelihood: number;
    impact: number;
    owner?: string;
  }

  interface SnapshotPolicy {
    id: string;
    name: string;
    status: string;
    updated: string;
  }

  interface SnapshotFramework {
    framework: string;
    coveragePercent: number;
    passing: number;
    failing: number;
    total: number;
  }

  interface Snapshot {
    tenantId: string;
    generatedAt: string;
    ageSeconds?: number;
    frameworkSummary: SnapshotFramework[];
    risks: SnapshotRisk[];
    policies: SnapshotPolicy[];
  }

  let snapshot: Snapshot | null = null;
  let loading = true;
  let error: string | null = null;
  let evidence: EvidenceSummaryItem[] = [];
  let evidenceError: string | null = null;
  let usingFallback = false;
  let resolvedBase: string | null = null;
  let primaryBase: string | null = null;

  function ensureBase(base: string | undefined | null) {
    if (!base) return "";
    return base.replace(/\/$/, "");
  }

  function deriveEvidenceBase(base: string) {
    if (!base) return base;
    return base.replace(/\/compliance$/, "/evidence");
  }

  async function fetchJson<T = any>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return res.json();
  }

  async function load() {
    loading = true;
    error = null;
    evidenceError = null;
    try {
      const cfg = await getRuntimeConfig();
      primaryBase = cfg.complianceBase;
      resolvedBase = cfg.resolvedBase || null;
      const serviceBase = ensureBase(cfg.resolvedBase || cfg.complianceBase);
      usingFallback = Boolean(
        cfg.resolvedBase && cfg.resolvedBase !== cfg.complianceBase
      );

      const snapshotJson = await fetchJson<Snapshot>(`${serviceBase}/snapshot`);
      snapshot = snapshotJson;

      const tenantId = snapshot?.tenantId || "demo";
      const evidenceBase = ensureBase(deriveEvidenceBase(serviceBase));
      try {
        const search = await fetchJson<{ items?: EvidenceSummaryItem[] }>(
          `${evidenceBase}/search?tenantId=${encodeURIComponent(tenantId)}&limit=5`
        );
        evidence = Array.isArray(search?.items) ? search.items : [];
      } catch (err: any) {
        evidenceError = err?.message || "Unable to load evidence";
        evidence = [];
      }
    } catch (e: any) {
      error = e?.message || "unknown error";
      snapshot = null;
      evidence = [];
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

<div class="px-5 py-5 max-w-[1400px] mx-auto">
  <div
    class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4"
  >
    <div>
      <h1 class="text-3xl font-semibold mb-1">AtlasIT Console</h1>
      <p class="text-sm text-white/60">
        Compliance & risk snapshot view.
        {#if snapshot?.generatedAt}
          <span class="generated">
            Generated {new Date(snapshot.generatedAt).toLocaleString()}
            {#if typeof snapshot.ageSeconds === "number"}
              (<span title="Age in seconds">age {snapshot.ageSeconds}s</span>)
            {/if}
          </span>
        {/if}
      </p>
    </div>
    <div class="header-actions">
      {#if usingFallback && resolvedBase}
        <span class="fallback-badge" title={`Primary base ${primaryBase}`}
          >Fallback endpoint active</span
        >
      {/if}
      <button
        on:click={load}
        class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white"
        >Refresh</button
      >
    </div>
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
        <div class="flex-1 basis-[420px] min-w-[360px] flex flex-col gap-4">
          <RiskMatrix risks={snapshot.risks} />
          <RiskHeatmap risks={snapshot.risks} />
          <EvidenceSummary items={evidence} error={evidenceError} />
        </div>
        <div class="flex-[2] basis-[640px] min-w-[480px]">
          <PolicyCards policies={snapshot.policies} />
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .fallback-badge {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(251, 191, 36, 0.2);
    color: #fcd34d;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid rgba(251, 191, 36, 0.4);
  }
  .generated {
    margin-left: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
  }
</style>
