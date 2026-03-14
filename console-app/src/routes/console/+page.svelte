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

  function exportCSV() {
    if (!snapshot) return;
    const lines: string[] = [];

    // Framework coverage
    lines.push("=== Framework Coverage ===");
    lines.push("Framework,Coverage %,Passing,Failing,Total");
    for (const fw of snapshot.frameworkSummary) {
      lines.push(`${fw.framework},${fw.coveragePercent},${fw.passing},${fw.failing},${fw.total}`);
    }

    // Risks
    lines.push("");
    lines.push("=== Risk Register ===");
    lines.push("ID,Title,Severity,Likelihood,Impact,Owner");
    for (const r of snapshot.risks) {
      lines.push(`${r.id},"${r.title}",${r.severity},${r.likelihood},${r.impact},${r.owner || "unassigned"}`);
    }

    // Policies
    lines.push("");
    lines.push("=== Policies ===");
    lines.push("ID,Name,Status,Updated");
    for (const p of snapshot.policies) {
      lines.push(`${p.id},"${p.name}",${p.status},${p.updated}`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlasit-compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportHTML() {
    if (!snapshot) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>AtlasIT Compliance Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#1a1a1a;}
table{width:100%;border-collapse:collapse;margin:16px 0;}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;}
th{background:#f5f5f5;font-weight:600;}h1{color:#1e40af;}h2{color:#374151;margin-top:32px;}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:500;}
.high,.critical{background:#fee2e2;color:#991b1b;}.medium{background:#fef3c7;color:#92400e;}.low{background:#d1fae5;color:#065f46;}
.approved{background:#d1fae5;color:#065f46;}.draft{background:#e0e7ff;color:#3730a3;}
.bar{height:20px;border-radius:4px;background:#3b82f6;}</style></head>
<body>
<h1>AtlasIT Compliance Report</h1>
<p>Generated: ${new Date().toLocaleString()} | Tenant: ${snapshot.tenantId}</p>
<h2>Framework Coverage</h2>
<table><tr><th>Framework</th><th>Coverage</th><th>Passing</th><th>Failing</th><th>Total</th></tr>
${snapshot.frameworkSummary.map(fw => `<tr><td>${fw.framework}</td><td><div style="display:flex;align-items:center;gap:8px;"><div class="bar" style="width:${fw.coveragePercent}%;min-width:4px;"></div>${fw.coveragePercent}%</div></td><td>${fw.passing}</td><td>${fw.failing}</td><td>${fw.total}</td></tr>`).join("")}
</table>
<h2>Risk Register</h2>
<table><tr><th>ID</th><th>Title</th><th>Severity</th><th>Likelihood</th><th>Impact</th><th>Owner</th></tr>
${snapshot.risks.map(r => `<tr><td>${r.id}</td><td>${r.title}</td><td><span class="badge ${r.severity}">${r.severity}</span></td><td>${r.likelihood}</td><td>${r.impact}</td><td>${r.owner || "-"}</td></tr>`).join("")}
</table>
<h2>Policies</h2>
<table><tr><th>ID</th><th>Name</th><th>Status</th><th>Updated</th></tr>
${snapshot.policies.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td><span class="badge ${p.status}">${p.status}</span></td><td>${new Date(p.updated).toLocaleDateString()}</td></tr>`).join("")}
</table>
<footer style="margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">AtlasIT Compliance Platform</footer>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlasit-compliance-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
      <a
        href="/console/marketplace"
        class="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded text-white"
      >
        Marketplace
      </a>
      <a
        href="/console/platform-status"
        class="text-sm bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-white"
      >
        Platform Status
      </a>
      {#if snapshot}
        <button
          on:click={exportCSV}
          class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white"
          title="Export as CSV"
        >Export CSV</button>
        <button
          on:click={exportHTML}
          class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white"
          title="Export as printable HTML report"
        >Export Report</button>
      {/if}
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
