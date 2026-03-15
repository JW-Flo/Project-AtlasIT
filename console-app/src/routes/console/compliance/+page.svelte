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

  let evaluating = false;
  let lastEvaluation: { tenantState: Record<string, boolean>; evaluations: any[] } | null = null;

  interface EvidenceItem {
    id: number;
    hash: string;
    tenantId: string;
    pack: string;
    subject: string | null;
    createdAt: string;
    linkedControl?: string;
  }

  let evidenceItems: EvidenceItem[] = [];
  let evidenceLoading = false;
  let evidenceError: string | null = null;
  let showRecordForm = false;
  let recordingEvidence = false;
  let newEvidenceDescription = "";
  let newEvidencePack = "manual";
  let linkingEvidenceId: number | null = null;
  let linkControlKey = "";

  const INTERNAL_CONTROLS = [
    { key: "SOC2_CC1.1", framework: "SOC2", title: "Control environment" },
    { key: "SOC2_CC2.2", framework: "SOC2", title: "Communication and information" },
    { key: "SOC2_CC6.1", framework: "SOC2", title: "Logical access" },
    { key: "ISO27001_A.8", framework: "ISO27001", title: "Asset management" },
    { key: "ISO27001_A.9", framework: "ISO27001", title: "Access control" },
    { key: "ISO27001_A.10", framework: "ISO27001", title: "Cryptography" },
    { key: "ISO27001_A.16", framework: "ISO27001", title: "Incident management" },
    { key: "NIST_ID", framework: "NIST CSF", title: "Identify" },
    { key: "NIST_PR", framework: "NIST CSF", title: "Protect" },
    { key: "NIST_DE", framework: "NIST CSF", title: "Detect" },
    { key: "NIST_RS", framework: "NIST CSF", title: "Respond" },
    { key: "NIST_RC", framework: "NIST CSF", title: "Recover" },
  ];

  function shortHash(hash: string): string {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }

  async function loadEvidence() {
    evidenceLoading = true;
    evidenceError = null;
    try {
      const res = await fetch("/api/tenant-compliance/evidence");
      if (!res.ok) throw new Error(`Failed to load evidence (${res.status})`);
      const data = await res.json();
      evidenceItems = data.items || [];
    } catch (e: any) {
      evidenceError = e?.message || "Failed to load evidence";
    } finally {
      evidenceLoading = false;
    }
  }

  async function recordEvidence() {
    if (!newEvidenceDescription.trim()) return;
    recordingEvidence = true;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(newEvidenceDescription);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const res = await fetch("/api/tenant-compliance/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: { description: newEvidenceDescription, hash: hashHex },
          pack: newEvidencePack,
          subject: "manual-upload",
        }),
      });
      if (!res.ok) throw new Error(`Failed to record evidence (${res.status})`);
      pushToast({ message: "Evidence recorded", variant: "success" });
      newEvidenceDescription = "";
      showRecordForm = false;
      await loadEvidence();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to record evidence", variant: "error" });
    } finally {
      recordingEvidence = false;
    }
  }

  async function linkEvidence(evidenceId: number) {
    if (!linkControlKey) return;
    try {
      const res = await fetch(`/api/tenant-compliance/evidence/${evidenceId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlKey: linkControlKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Link failed (${res.status})`);
      }
      pushToast({ message: `Evidence linked to ${linkControlKey}`, variant: "success" });
      linkingEvidenceId = null;
      linkControlKey = "";
      const item = evidenceItems.find((e) => e.id === evidenceId);
      if (item) item.linkedControl = linkControlKey;
      evidenceItems = [...evidenceItems];
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to link evidence", variant: "error" });
    }
  }

  async function runEvaluation() {
    evaluating = true;
    try {
      const res = await fetch("/api/tenant-compliance/evaluate", { method: "POST" });
      if (!res.ok) throw new Error(`Evaluation failed (${res.status})`);
      const data: { tenantState: Record<string, boolean>; evaluations: any[]; controlsUpdated: boolean } = await res.json();
      lastEvaluation = data;
      if (data.controlsUpdated) {
        pushToast({ message: `Auto-assessed ${data.evaluations.filter((e: any) => e.autoApplied).length} controls based on your configuration`, variant: "success" });
        await loadData();
      } else {
        pushToast({ message: "Evaluation complete — no changes needed", variant: "success" });
      }
    } catch (e: any) {
      pushToast({ message: e?.message || "Evaluation failed", variant: "error" });
    } finally {
      evaluating = false;
    }
  }

  $: if (activeTab === "evidence" && evidenceItems.length === 0 && !evidenceLoading && !evidenceError) {
    loadEvidence();
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
    <div class="flex items-center gap-2">
      <button
        on:click={runEvaluation}
        disabled={evaluating}
        class="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-3 py-1.5 rounded text-white"
      >
        {evaluating ? "Evaluating..." : "Evaluate Configuration"}
      </button>
      <a
        href="/console"
        class="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white"
      >
        Back to Dashboard
      </a>
    </div>
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
    <!-- Empty state when no frameworks configured -->
    {#if frameworks.length === 0 && controls.length === 0}
      <div class="rounded-lg p-8 bg-[var(--color-surface,#1a2332)] border border-dashed border-white/20 text-center mb-6">
        <svg class="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h2 class="text-xl font-semibold mb-2">No compliance frameworks configured yet</h2>
        <p class="text-white/60 mb-4 max-w-md mx-auto">Select your frameworks in the onboarding wizard or settings to get started.</p>
        <div class="flex gap-3 justify-center">
          <a href="/console/settings" class="text-sm bg-white/10 hover:bg-white/15 px-4 py-2 rounded text-white">Go to Settings</a>
          <a href="/console/onboarding" class="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white">Setup Wizard</a>
        </div>
      </div>
    {/if}

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

    {#if lastEvaluation}
      <div class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 mb-6">
        <h2 class="text-lg font-semibold mb-3">Configuration Assessment</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          {#each Object.entries(lastEvaluation.tenantState) as [key, met]}
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full {met ? 'bg-green-400' : 'bg-red-400'}"></div>
              <span class="text-xs text-white/60">{key.replace(/_/g, ' ')}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

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
    <!-- Evidence tab -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Evidence Locker</h2>
      <button
        on:click={() => (showRecordForm = !showRecordForm)}
        class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white transition-colors"
      >
        {showRecordForm ? "Cancel" : "Record Evidence"}
      </button>
    </div>

    {#if showRecordForm}
      <div class="rounded-lg p-5 bg-[var(--color-surface,#1a2332)] border border-white/10 mb-4">
        <h3 class="text-sm font-semibold mb-3">Record New Evidence</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label for="ev-desc" class="text-xs text-white/60 block mb-1">Description</label>
            <textarea
              id="ev-desc"
              bind:value={newEvidenceDescription}
              rows="3"
              placeholder="Describe the evidence (e.g., screenshot of MFA configuration, access review export)..."
              class="w-full bg-[#0f1923] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>
          <div>
            <label for="ev-pack" class="text-xs text-white/60 block mb-1">Evidence Pack</label>
            <select
              id="ev-pack"
              bind:value={newEvidencePack}
              class="bg-[#0f1923] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="manual">Manual Upload</option>
              <option value="access-review">Access Review</option>
              <option value="config-snapshot">Configuration Snapshot</option>
              <option value="audit-log">Audit Log</option>
              <option value="policy-doc">Policy Document</option>
            </select>
          </div>
          <button
            on:click={recordEvidence}
            disabled={recordingEvidence || !newEvidenceDescription.trim()}
            class="self-start text-sm bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 px-4 py-1.5 rounded text-white transition-colors"
          >
            {recordingEvidence ? "Recording..." : "Submit Evidence"}
          </button>
        </div>
      </div>
    {/if}

    {#if evidenceLoading}
      <div class="flex flex-col gap-3">
        <div class="h-12 bg-white/5 rounded-lg animate-pulse"></div>
        <div class="h-12 bg-white/5 rounded-lg animate-pulse"></div>
      </div>
    {:else if evidenceError}
      <div class="text-sm text-red-400 bg-red-900/20 rounded-lg p-4">{evidenceError}</div>
    {:else if evidenceItems.length === 0}
      <div class="rounded-lg p-12 bg-[var(--color-surface,#1a2332)] border border-dashed border-white/20 text-center">
        <svg class="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h3 class="text-lg font-semibold text-white/60 mb-2">No evidence recorded yet</h3>
        <p class="text-sm text-white/40 max-w-md mx-auto">
          Record evidence to demonstrate compliance during audits. Click "Record Evidence" above to get started.
        </p>
      </div>
    {:else}
      <div class="rounded-lg bg-[var(--color-surface,#1a2332)] border border-white/10 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-white/50 text-xs uppercase tracking-wider">
              <th class="px-4 py-3 font-medium">Hash</th>
              <th class="px-4 py-3 font-medium">Pack</th>
              <th class="px-4 py-3 font-medium">Subject</th>
              <th class="px-4 py-3 font-medium">Date</th>
              <th class="px-4 py-3 font-medium">Link to Control</th>
            </tr>
          </thead>
          <tbody>
            {#each evidenceItems as item (item.id)}
              <tr class="border-t border-white/10 hover:bg-white/[0.02]">
                <td class="px-4 py-3">
                  <span class="font-mono text-xs text-white/80" title={item.hash}>{shortHash(item.hash)}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {item.pack}
                  </span>
                </td>
                <td class="px-4 py-3 text-white/60 text-xs">{item.subject || "-"}</td>
                <td class="px-4 py-3 text-white/50 text-xs">{new Date(item.createdAt).toLocaleString()}</td>
                <td class="px-4 py-3">
                  {#if item.linkedControl}
                    <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
                      {item.linkedControl}
                    </span>
                  {:else if linkingEvidenceId === item.id}
                    <div class="flex items-center gap-2">
                      <select
                        bind:value={linkControlKey}
                        class="bg-[#0f1923] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select control...</option>
                        {#each INTERNAL_CONTROLS as ctrl}
                          <option value={ctrl.key}>{ctrl.key} - {ctrl.title}</option>
                        {/each}
                      </select>
                      <button
                        on:click={() => linkEvidence(item.id)}
                        disabled={!linkControlKey}
                        class="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 px-2 py-1 rounded text-white"
                      >Link</button>
                      <button
                        on:click={() => { linkingEvidenceId = null; linkControlKey = ""; }}
                        class="text-xs text-white/40 hover:text-white/60"
                      >Cancel</button>
                    </div>
                  {:else}
                    <button
                      on:click={() => { linkingEvidenceId = item.id; linkControlKey = ""; }}
                      class="text-xs text-blue-400 hover:text-blue-300 underline"
                    >Link</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

<style>
  select option {
    background: #0f1923;
    color: #f5f7fa;
  }
</style>
