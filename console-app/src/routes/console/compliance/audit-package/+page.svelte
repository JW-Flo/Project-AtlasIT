<script lang="ts">
  import { onMount } from "svelte";

  interface Pack {
    id: string;
    framework: string;
    label: string;
    controlCount: number;
    passCount: number | null;
    failCount: number | null;
    unknownCount: number | null;
    installedAt: string | null;
    lastEvaluatedAt: string | null;
  }

  let packs: Pack[] = [];
  let loading = true;
  let error: string | null = null;
  let downloading: string | null = null;
  let userRole = "";

  let sinceDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  async function loadPacks() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/compliance/api/v1/compliance-packs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      packs = (j.data?.items ?? []).filter((p: Pack) => p.installedAt);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  // Fetch the audit HTML with Bearer auth, then open in a new tab via blob URL.
  // We can't use window.open() directly because the endpoint requires auth headers
  // that browser tab navigation doesn't carry.
  async function downloadHtml(pack: Pack) {
    downloading = pack.framework;
    try {
      const sinceIso = new Date(sinceDate).toISOString();
      const url = `/api/compliance/api/v1/audit-package/${encodeURIComponent(pack.framework)}?since=${encodeURIComponent(sinceIso)}`;
      const res = await fetch(url, { headers: { Accept: "text/html" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      // Revoke after a tick so the new tab has a chance to load it.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      downloading = null;
    }
  }

  async function downloadJson(pack: Pack) {
    downloading = pack.framework + "-json";
    try {
      const sinceIso = new Date(sinceDate).toISOString();
      const url = `/api/compliance/api/v1/audit-package/${encodeURIComponent(pack.framework)}?since=${encodeURIComponent(sinceIso)}&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = new Blob([await res.text()], { type: "application/json" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `atlasit-audit-${pack.framework}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      downloading = null;
    }
  }

  function frameworkColor(key: string): string {
    const map: Record<string, string> = {
      SOC2: "bg-info-muted text-info",
      ISO27001: "bg-primary-muted text-primary",
      "NIST CSF": "bg-info-muted text-info",
      NIST_CSF: "bg-info-muted text-info",
      HIPAA: "bg-warning-muted text-warning",
      GDPR: "bg-primary-muted text-primary",
    };
    return map[key] ?? "bg-muted text-muted-foreground";
  }

  onMount(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("atlasit_user") ?? "{}");
      userRole = u.role ?? "";
    } catch {}
    loadPacks();
  });

  $: isAdmin = userRole === "admin" || userRole === "owner";
</script>

<div class="animate-fade-in max-w-5xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Audit Package Export</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Generate an auditor-ready report bundling live compliance score, control state,
      evidence sample, attestations, policies, incidents, and audit trail for a chosen
      framework. HTML opens in a new tab — save as PDF via your browser's print dialog.
      JSON format includes a SHA-256 content hash for tamper verification.
    </p>
  </div>

  {#if !isAdmin}
    <div class="bg-warning-muted border border-warning/20 rounded-lg p-4 mb-5">
      <p class="text-sm text-amber-800 dark:text-amber-300">
        Admin or owner role required to download audit packages. Sign in as an admin or
        ask a tenant admin to generate the report.
      </p>
    </div>
  {/if}

  <div class="mb-5 bg-card border border-border rounded-lg p-4">
    <label class="block text-sm font-medium text-foreground/80 mb-1" for="since">
      Evidence window start
    </label>
    <input
      id="since"
      type="date"
      bind:value={sinceDate}
      class="px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"
    />
    <p class="mt-1 text-xs text-muted-foreground">
      Only evidence, incidents, and audit-log entries after this date will be included.
      Defaults to last 90 days. Attestations, policies, and control state are always full.
    </p>
  </div>

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3] as _}<div class="h-24 bg-muted rounded animate-pulse"></div>{/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive">{error}</p>
      <button on:click={loadPacks} class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else if packs.length === 0}
    <div class="bg-card border border-dashed border-input rounded-lg p-12 text-center">
      <p class="text-muted-foreground text-sm">No compliance packs installed.</p>
      <a href="/console/compliance/packs" class="mt-3 inline-block text-sm text-primary hover:underline">Browse packs →</a>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each packs as p (p.id)}
        {@const score = p.controlCount > 0 && p.passCount !== null ? Math.round((p.passCount * 100) / p.controlCount) : 0}
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {frameworkColor(p.framework)}">
              {p.framework}
            </span>
            <span class="text-sm font-medium text-foreground">{p.label}</span>
          </div>
          <div class="flex items-baseline gap-3 mb-1">
            <div class="text-2xl font-bold text-foreground">{score}%</div>
            <div class="text-xs text-muted-foreground">
              {p.passCount ?? 0} pass · {p.failCount ?? 0} fail · {p.unknownCount ?? 0} unknown
            </div>
          </div>
          <p class="text-xs text-muted-foreground/70 mb-4">
            {p.controlCount} controls{p.lastEvaluatedAt ? ` · last evaluated ${new Date(p.lastEvaluatedAt).toLocaleDateString()}` : ""}
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              on:click={() => downloadHtml(p)}
              disabled={!isAdmin || downloading !== null}
              class="flex-1 px-3 py-2 text-sm bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium"
            >
              {downloading === p.framework ? "Generating…" : "Open HTML (print to PDF)"}
            </button>
            <button
              type="button"
              on:click={() => downloadJson(p)}
              disabled={!isAdmin || downloading !== null}
              class="px-3 py-2 text-sm border border-input disabled:opacity-50 text-foreground/80 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              title="Download JSON bundle with content-hash"
            >
              {downloading === p.framework + "-json" ? "…" : "JSON"}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="mt-8 text-xs text-muted-foreground max-w-3xl">
    <h3 class="font-medium text-foreground/80 mb-1 text-sm">What's in the package?</h3>
    <ul class="space-y-1 list-disc pl-5">
      <li>Cover page: tenant, framework, score, evidence window, generation timestamp</li>
      <li>Per-control status (pass/fail/unknown) with rationale</li>
      <li>Active + revoked attestations (with statements and revocation reasons)</li>
      <li>Policies matching the framework with version, status, acknowledgement counts</li>
      <li>Evidence sample (up to 150 recent records, JSON has all up to 500)</li>
      <li>Incidents opened in the window</li>
      <li>Audit log: recent tenant actions</li>
      <li>SHA-256 content hash for tamper-evident verification</li>
    </ul>
  </div>
</div>
