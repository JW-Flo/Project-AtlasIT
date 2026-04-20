<script lang="ts">
  import { onMount } from "svelte";
  import { relativeTime } from "$lib/utils/time";

  interface Pack {
    id: string;
    label: string;
    framework: string;
    controlCount: number;
    description: string | null;
    version: string;
    status: string;
    installedAt: string | null;
    lastEvaluatedAt: string | null;
    passCount: number | null;
    failCount: number | null;
    unknownCount: number | null;
  }

  interface Control {
    controlId: string;
    title: string;
    ruleFn: string;
    state: "pass" | "fail" | "unknown";
    rationale: string[] | null;
    evaluatedAt: string | null;
    evidenceSampleSize: number;
  }

  let packs: Pack[] = [];
  let loading = true;
  let error: string | null = null;

  let selectedPackId: string | null = null;
  let detailLoading = false;
  let detail: { pack: Pack; controls: Control[] } | null = null;

  let busyPackId: string | null = null;
  let banner: { type: "info" | "error"; msg: string } | null = null;

  $: installedPacks = packs.filter((p) => p.installedAt);
  $: totalControls = installedPacks.reduce((s, p) => s + (p.controlCount ?? 0), 0);
  $: totalPass = installedPacks.reduce((s, p) => s + (p.passCount ?? 0), 0);
  $: totalFail = installedPacks.reduce((s, p) => s + (p.failCount ?? 0), 0);
  $: totalUnknown = installedPacks.reduce((s, p) => s + (p.unknownCount ?? 0), 0);
  $: overallScore = totalControls > 0 ? Math.round((totalPass * 100) / totalControls) : 0;

  async function loadPacks() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/compliance/api/v1/compliance-packs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const raw: Record<string, unknown>[] = j.data?.items ?? [];
      packs = raw.map((p) => ({
        id: String(p.id ?? ""),
        label: String(p.label ?? ""),
        framework: String(p.framework ?? ""),
        controlCount: Number(p.controlCount ?? p.control_count ?? 0),
        description: String(p.description ?? "") || null,
        version: String(p.version ?? ""),
        status: String(p.status ?? ""),
        installedAt: String(p.installedAt ?? p.installed_at ?? "") || null,
        lastEvaluatedAt: String(p.lastEvaluatedAt ?? p.last_evaluated_at ?? "") || null,
        passCount: p.passCount !== undefined ? Number(p.passCount) : (p.pass_count !== undefined ? Number(p.pass_count) : null),
        failCount: p.failCount !== undefined ? Number(p.failCount) : (p.fail_count !== undefined ? Number(p.fail_count) : null),
        unknownCount: p.unknownCount !== undefined ? Number(p.unknownCount) : (p.unknown_count !== undefined ? Number(p.unknown_count) : null),
      }));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function loadDetail(packId: string) {
    selectedPackId = packId;
    detailLoading = true;
    detail = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/compliance-packs/${packId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const rawData = j.data ?? {};
      const rawPack = rawData.pack ?? {};
      const rawControls: Record<string, unknown>[] = rawData.controls ?? [];
      detail = {
        pack: {
          id: String(rawPack.id ?? ""),
          label: String(rawPack.label ?? ""),
          framework: String(rawPack.framework ?? ""),
          controlCount: Number(rawPack.controlCount ?? rawPack.control_count ?? 0),
          description: String(rawPack.description ?? "") || null,
          version: String(rawPack.version ?? ""),
          status: String(rawPack.status ?? ""),
          installedAt: String(rawPack.installedAt ?? rawPack.installed_at ?? "") || null,
          lastEvaluatedAt: String(rawPack.lastEvaluatedAt ?? rawPack.last_evaluated_at ?? "") || null,
          passCount: rawPack.passCount !== undefined ? Number(rawPack.passCount) : (rawPack.pass_count !== undefined ? Number(rawPack.pass_count) : null),
          failCount: rawPack.failCount !== undefined ? Number(rawPack.failCount) : (rawPack.fail_count !== undefined ? Number(rawPack.fail_count) : null),
          unknownCount: rawPack.unknownCount !== undefined ? Number(rawPack.unknownCount) : (rawPack.unknown_count !== undefined ? Number(rawPack.unknown_count) : null),
        },
        controls: rawControls.map((c) => ({
          controlId: String(c.controlId ?? c.control_id ?? ""),
          title: String(c.title ?? ""),
          ruleFn: String(c.ruleFn ?? c.rule_fn ?? ""),
          state: (c.state ?? "unknown") as "pass" | "fail" | "unknown",
          rationale: (c.rationale ?? null) as string[] | null,
          evaluatedAt: String(c.evaluatedAt ?? c.evaluated_at ?? "") || null,
          evidenceSampleSize: Number(c.evidenceSampleSize ?? c.evidence_sample_size ?? 0),
        })),
      };
    } catch (e) {
      banner = { type: "error", msg: `Failed to load detail: ${(e as Error).message}` };
    } finally {
      detailLoading = false;
    }
  }

  async function install(packId: string) {
    busyPackId = packId;
    banner = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/compliance-packs/${packId}/install`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      banner = { type: "info", msg: "Pack installed. Click Evaluate to run CDT rules against your evidence." };
      await loadPacks();
    } catch (e) {
      banner = { type: "error", msg: `Install failed: ${(e as Error).message}` };
    } finally {
      busyPackId = null;
    }
  }

  async function uninstall(packId: string) {
    if (!confirm("Uninstall this pack? Control state for this pack will be removed.")) return;
    busyPackId = packId;
    try {
      const res = await fetch(`/api/compliance/api/v1/compliance-packs/${packId}/install`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      banner = { type: "info", msg: "Pack uninstalled." };
      if (selectedPackId === packId) { selectedPackId = null; detail = null; }
      await loadPacks();
    } catch (e) {
      banner = { type: "error", msg: `Uninstall failed: ${(e as Error).message}` };
    } finally {
      busyPackId = null;
    }
  }

  async function evaluate(packId: string) {
    busyPackId = packId;
    banner = null;
    try {
      const res = await fetch(`/api/compliance/api/v1/compliance-packs/${packId}/evaluate`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const r = j.data;
      banner = {
        type: "info",
        msg: `Evaluated ${r.controlCount} controls in ${r.durationMs}ms — ${r.passCount} pass, ${r.failCount} fail, ${r.unknownCount} unknown (score ${r.score}%).`,
      };
      await loadPacks();
      if (selectedPackId === packId) await loadDetail(packId);
    } catch (e) {
      banner = { type: "error", msg: `Evaluate failed: ${(e as Error).message}` };
    } finally {
      busyPackId = null;
    }
  }

  function stateClass(s: string): string {
    switch (s) {
      case "pass":    return "bg-success-muted text-success";
      case "fail":    return "bg-destructive-muted text-destructive";
      default:        return "bg-muted text-muted-foreground";
    }
  }

  onMount(loadPacks);
</script>

<div class="animate-fade-in" data-tour="compliance-packs">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-foreground">Compliance Packs</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      CDT-backed framework packs. Installing a pack binds its controls to your tenant; evaluation runs the live rule engine against your recent evidence.
    </p>
  </div>

  {#if banner}
    <div
      class="mb-5 rounded-lg p-4 text-sm border
        {banner.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'}"
    >
      {banner.msg}
    </div>
  {/if}

  {#if !loading && installedPacks.length > 0}
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500">Overall score</div>
        <div class="text-2xl font-bold text-foreground mt-1">{overallScore}%</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500">Installed packs</div>
        <div class="text-2xl font-bold text-foreground mt-1">{installedPacks.length}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500">Controls passing</div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{totalPass}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500">Controls failing</div>
        <div class="text-2xl font-bold text-destructive mt-1">{totalFail}</div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-xs uppercase text-gray-500">Unknown</div>
        <div class="text-2xl font-bold text-muted-foreground mt-1">{totalUnknown}</div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-44 bg-muted rounded-lg animate-pulse"></div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-destructive-muted border border-destructive/20 rounded-lg p-4">
      <p class="text-destructive">{error}</p>
      <button on:click={loadPacks} class="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-sm rounded-md">Retry</button>
    </div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each packs as p (p.id)}
        {@const score = p.controlCount > 0 && p.passCount !== null ? Math.round((p.passCount * 100) / p.controlCount) : null}
        <div
          class="bg-card border rounded-lg p-5 hover:border-primary cursor-pointer transition-colors
            {selectedPackId === p.id ? 'border-primary ring-2 ring-blue-200 dark:ring-blue-900' : 'border-border'}"
          on:click={() => loadDetail(p.id)}
          on:keydown={(e) => e.key === 'Enter' && loadDetail(p.id)}
          role="button"
          tabindex="0"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-foreground truncate">{p.label}</h3>
              <p class="text-xs text-muted-foreground mt-0.5">{p.framework} · {p.controlCount} controls · v{p.version}</p>
            </div>
            {#if p.installedAt}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-muted text-success">
                Installed
              </span>
            {/if}
          </div>

          {#if p.description}
            <p class="mt-3 text-xs text-gray-600 dark:text-muted-foreground/70 line-clamp-2">{p.description}</p>
          {/if}

          {#if p.installedAt}
            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between text-xs text-gray-600 dark:text-muted-foreground/70">
                <span>Score</span>
                <span class="font-semibold text-foreground">{score ?? "—"}%</span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                {#if score !== null}
                  <div
                    class="h-full {score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive'}"
                    style="width: {score}%"
                  ></div>
                {/if}
              </div>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span><span class="text-success font-medium">{p.passCount ?? 0}</span> pass</span>
                <span><span class="text-destructive font-medium">{p.failCount ?? 0}</span> fail</span>
                <span><span class="font-medium">{p.unknownCount ?? 0}</span> unknown</span>
              </div>
              <p class="text-xs text-muted-foreground/70">Last evaluated {relativeTime(p.lastEvaluatedAt)}</p>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                on:click|stopPropagation={() => evaluate(p.id)}
                disabled={busyPackId === p.id}
                class="flex-1 px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-md"
              >
                {busyPackId === p.id ? "Running..." : "Evaluate"}
              </button>
              <button
                on:click|stopPropagation={() => uninstall(p.id)}
                disabled={busyPackId === p.id}
                class="px-3 py-1.5 text-xs border border-input text-foreground/80 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Remove
              </button>
            </div>
          {:else}
            <div class="mt-4">
              <button
                on:click|stopPropagation={() => install(p.id)}
                disabled={busyPackId === p.id}
                class="w-full px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-md"
              >
                {busyPackId === p.id ? "Installing..." : "Install pack"}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if selectedPackId}
    <div class="mt-8 bg-card border border-border rounded-lg overflow-hidden">
      <div class="border-b border-border px-5 py-3 flex items-center justify-between">
        <h2 class="font-semibold text-foreground">
          {detail?.pack?.label ?? "Pack controls"}
        </h2>
        <button on:click={() => { selectedPackId = null; detail = null; }} class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Close
        </button>
      </div>
      {#if detailLoading}
        <div class="p-8 text-center text-sm text-gray-500">Loading controls...</div>
      {:else if !detail}
        <div class="p-8 text-center text-sm text-gray-500">No detail loaded.</div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th class="px-5 py-3 font-medium">Control</th>
                <th class="px-5 py-3 font-medium">Title</th>
                <th class="px-5 py-3 font-medium">State</th>
                <th class="px-5 py-3 font-medium">Evidence</th>
                <th class="px-5 py-3 font-medium">Rationale</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              {#each detail.controls as c (c.controlId)}
                <tr>
                  <td class="px-5 py-3 font-mono text-xs text-gray-600 dark:text-muted-foreground/70">{c.controlId}</td>
                  <td class="px-5 py-3 text-foreground">{c.title}</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize {stateClass(c.state)}">
                      {c.state}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-muted-foreground text-xs">
                    {c.evidenceSampleSize} record{c.evidenceSampleSize === 1 ? "" : "s"}
                  </td>
                  <td class="px-5 py-3 text-xs text-gray-600 dark:text-muted-foreground/70 max-w-md">
                    {#if c.rationale && c.rationale.length > 0}
                      {c.rationale.slice(0, 2).join("; ")}{c.rationale.length > 2 ? "…" : ""}
                    {:else}
                      <span class="text-muted-foreground/70">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>
