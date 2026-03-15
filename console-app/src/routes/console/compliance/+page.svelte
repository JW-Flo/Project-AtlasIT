<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  type ControlStatus = "not_started" | "in_progress" | "implemented" | "verified";

  interface Control {
    id: string;
    framework: string;
    name: string;
    status: ControlStatus;
    notes: string;
  }

  interface FrameworkScore {
    framework: string;
    score: number;
    grade: string;
    controlsTotal: number;
    controlsImplemented: number;
    controlsVerified: number;
  }

  interface FrameworkSummary {
    name: string;
    total: number;
    implemented: number;
    percent: number;
    status: string;
  }

  let loading = true;
  let saving = false;
  let error: string | null = null;
  let frameworks: string[] = [];
  let controls: Control[] = [];
  let scores: FrameworkScore[] = [];
  let activeTab: "overview" | "controls" | "evidence" = "overview";
  let filterFramework = "all";

  const STATUS_LABELS: Record<ControlStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    implemented: "Implemented",
    verified: "Verified",
  };

  const STATUS_COLORS: Record<ControlStatus, string> = {
    not_started: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    implemented: "bg-green-500/20 text-green-300 border-green-500/30",
    verified: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const GRADE_COLORS: Record<string, string> = {
    A: "bg-green-500/20 text-green-300 border-green-500/30",
    B: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    C: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    D: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    F: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  $: frameworkSummaries = buildSummaries(frameworks, controls);
  $: filteredControls =
    filterFramework === "all"
      ? controls
      : controls.filter((c) => c.framework === filterFramework);
  $: overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length * 100) / 100
      : 0;
  $: overallGrade = computeGrade(overallScore);

  function computeGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  function buildSummaries(fws: string[], ctrls: Control[]): FrameworkSummary[] {
    return fws.map((fw) => {
      const fwControls = ctrls.filter((c) => c.framework === fw);
      const done = fwControls.filter(
        (c) => c.status === "implemented" || c.status === "verified",
      ).length;
      const total = fwControls.length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      let status = "Not Started";
      if (percent === 100) status = "Compliant";
      else if (percent > 0 || fwControls.some((c) => c.status === "in_progress"))
        status = "In Progress";
      return { name: fw, total, implemented: done, percent, status };
    });
  }

  async function loadScores() {
    try {
      const res = await fetch("/api/tenant-compliance/scores");
      if (res.ok) {
        const data = await res.json();
        scores = data.scores || [];
      }
    } catch {
      // scores fetch is non-blocking; overview falls back to empty
    }
  }

  async function loadData() {
    loading = true;
    error = null;
    try {
      const [controlsRes] = await Promise.all([
        fetch("/api/tenant-compliance/controls"),
        loadScores(),
      ]);
      if (!controlsRes.ok) throw new Error(`Failed to load compliance data (${controlsRes.status})`);
      const data = await controlsRes.json();
      frameworks = data.frameworks || [];
      controls = data.controls || [];
    } catch (e: any) {
      error = e?.message || "Failed to load compliance data";
    } finally {
      loading = false;
    }
  }

  async function saveControls() {
    saving = true;
    try {
      const res = await fetch("/api/tenant-compliance/controls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controls }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      pushToast({ message: "Control statuses saved", variant: "success" });
      // Recalculate scores after saving control changes
      await loadScores();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save", variant: "error" });
    } finally {
      saving = false;
    }
  }

  function updateControlStatus(id: string, status: ControlStatus) {
    controls = controls.map((c) => (c.id === id ? { ...c, status } : c));
  }

  function updateControlNotes(id: string, notes: string) {
    controls = controls.map((c) => (c.id === id ? { ...c, notes } : c));
  }

  function exportReport() {
    const rows = [["Framework", "Control", "Status", "Notes"]];
    for (const c of controls) {
      rows.push([c.framework, c.name, STATUS_LABELS[c.status], c.notes]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ message: "Compliance report exported", variant: "success" });
  }

  onMount(loadData);
</script>

<div class="px-5 py-5 max-w-[1200px] mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-3xl font-semibold mb-1">Compliance Manager</h1>
      <p class="text-sm text-white/60">
        Track frameworks, controls, and overall compliance posture.
      </p>
    </div>
    <a
      href="/console"
      class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white"
    >
      Back to Dashboard
    </a>
  </div>

  <!-- Sub-navigation tabs -->
  <div class="flex gap-1 mb-6 border-b border-white/10 pb-0">
    {#each [
      { key: "overview", label: "Overview" },
      { key: "controls", label: "Controls" },
      { key: "evidence", label: "Evidence" },
    ] as tab}
      <button
        class="px-4 py-2 text-sm font-medium transition-colors relative -mb-px
          {activeTab === tab.key
          ? 'text-white border-b-2 border-blue-500'
          : 'text-white/50 hover:text-white/70'}"
        on:click={() => (activeTab = tab.key)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="flex flex-col gap-4">
      <div class="h-12 bg-white/5 rounded-lg animate-pulse"></div>
      <div class="grid gap-4 md:grid-cols-3">
        <div class="h-32 bg-white/5 rounded-lg animate-pulse"></div>
        <div class="h-32 bg-white/5 rounded-lg animate-pulse"></div>
        <div class="h-32 bg-white/5 rounded-lg animate-pulse"></div>
      </div>
    </div>
  {:else if error}
    <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-4">{error}</div>
  {:else if activeTab === "overview"}
    <!-- Overall posture card -->
    <div class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 mb-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold">Overall Compliance Posture</h2>
          <span
            class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border {GRADE_COLORS[overallGrade] || GRADE_COLORS.F}"
          >
            {overallGrade}
          </span>
        </div>
        <span class="text-2xl font-bold text-white">{overallScore}%</span>
      </div>
      <div class="h-3 rounded-full bg-white/10">
        <div
          class="h-3 rounded-full transition-all duration-500
            {overallGrade === 'A' ? 'bg-green-500' : overallGrade === 'B' ? 'bg-blue-500' : overallGrade === 'C' ? 'bg-yellow-500' : overallGrade === 'D' ? 'bg-orange-500' : 'bg-red-500'}"
          style="width: {Math.min(overallScore, 100)}%"
        ></div>
      </div>
      <p class="text-xs text-white/40 mt-2">
        Weighted average across {scores.length} framework{scores.length !== 1 ? 's' : ''}
      </p>
    </div>

    <!-- Framework cards -->
    <h2 class="text-lg font-semibold mb-3">Frameworks</h2>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {#each scores as fw}
        <div class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-white">{fw.framework}</h3>
            <span
              class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border {GRADE_COLORS[fw.grade] || GRADE_COLORS.F}"
            >
              {fw.grade}
            </span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-white/70">{fw.score}%</span>
            <span class="text-xs text-white/40">{fw.controlsImplemented + fw.controlsVerified}/{fw.controlsTotal} controls</span>
          </div>
          <div class="h-2 rounded-full bg-white/10 mb-2">
            <div
              class="h-2 rounded-full transition-all duration-500
                {fw.grade === 'A' ? 'bg-green-500' : fw.grade === 'B' ? 'bg-blue-500' : fw.grade === 'C' ? 'bg-yellow-500' : fw.grade === 'D' ? 'bg-orange-500' : 'bg-red-500'}"
              style="width: {Math.min(fw.score, 100)}%"
            ></div>
          </div>
          <p class="text-xs text-white/40">
            {fw.controlsVerified} verified, {fw.controlsImplemented} implemented
          </p>
        </div>
      {/each}
      {#if scores.length === 0}
        {#each frameworkSummaries as fw}
          <div class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-white">{fw.name}</h3>
              <span
                class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border {GRADE_COLORS.F}"
              >
                F
              </span>
            </div>
            <div class="h-2 rounded-full bg-white/10 mb-2">
              <div class="h-2 rounded-full bg-red-500" style="width: 0%"></div>
            </div>
            <p class="text-xs text-white/40">
              {fw.implemented}/{fw.total} controls completed
            </p>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Quick actions -->
    <h2 class="text-lg font-semibold mb-3">Quick Actions</h2>
    <div class="grid gap-4 md:grid-cols-3">
      <a
        href="/console/policies"
        class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-blue-500/40 transition-colors group"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">Generate Policy</p>
            <p class="text-xs text-white/40">Create compliance policy documents</p>
          </div>
        </div>
      </a>

      <button
        on:click={() => (activeTab = "controls")}
        class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-blue-500/40 transition-colors group text-left"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">View Risk Register</p>
            <p class="text-xs text-white/40">Review controls and risk posture</p>
          </div>
        </div>
      </button>

      <button
        on:click={exportReport}
        class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 hover:border-blue-500/40 transition-colors group text-left"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-white group-hover:text-green-300 transition-colors">Export Compliance Report</p>
            <p class="text-xs text-white/40">Download CSV of control statuses</p>
          </div>
        </div>
      </button>
    </div>

  {:else if activeTab === "controls"}
    <!-- Controls tab -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <label for="fw-filter" class="text-sm text-white/60">Framework:</label>
        <select
          id="fw-filter"
          bind:value={filterFramework}
          class="bg-[#0f1923] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Frameworks</option>
          {#each frameworks as fw}
            <option value={fw}>{fw}</option>
          {/each}
        </select>
      </div>
      <button
        on:click={saveControls}
        disabled={saving}
        class="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 px-4 py-1.5 rounded text-white transition-colors"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>

    <div class="rounded-lg bg-[var(--color-surface,#1a2332)] border border-white/10 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-white/50 text-xs uppercase tracking-wider">
            <th class="px-4 py-3 font-medium">Control</th>
            <th class="px-4 py-3 font-medium">Framework</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredControls as control (control.id)}
            <tr class="border-t border-white/10 hover:bg-white/[0.02]">
              <td class="px-4 py-3 text-white">{control.name}</td>
              <td class="px-4 py-3">
                <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {control.framework}
                </span>
              </td>
              <td class="px-4 py-3">
                <select
                  value={control.status}
                  on:change={(e) => updateControlStatus(control.id, e.currentTarget.value)}
                  class="bg-[#0f1923] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="implemented">Implemented</option>
                  <option value="verified">Verified</option>
                </select>
              </td>
              <td class="px-4 py-3">
                <input
                  type="text"
                  value={control.notes}
                  on:blur={(e) => updateControlNotes(control.id, e.currentTarget.value)}
                  placeholder="Add notes..."
                  class="w-full bg-transparent border-b border-white/10 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-blue-500 py-1"
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {:else if activeTab === "evidence"}
    <!-- Evidence tab (placeholder) -->
    <div class="rounded-lg p-12 bg-[var(--color-surface,#1a2332)] border border-white/10 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <h3 class="text-lg font-semibold text-white/60 mb-2">Evidence Locker</h3>
      <p class="text-sm text-white/40 max-w-md mx-auto">
        Upload and manage compliance evidence documents. Attach evidence to controls to demonstrate
        compliance during audits. Coming soon.
      </p>
    </div>
  {/if}
</div>

<style>
  select option {
    background: #0f1923;
    color: #f5f7fa;
  }
</style>
