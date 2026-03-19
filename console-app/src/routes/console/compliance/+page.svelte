<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Progress from "$lib/components/ui/progress.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    AlertTriangle, ShieldCheck, FileText, ClipboardCheck, Download,
    Play, Link2, Upload, Search, Settings,
  } from "lucide-svelte";

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

  const STATUS_VARIANTS: Record<ControlStatus, "default" | "destructive" | "warning" | "secondary" | "outline" | "success"> = {
    not_started: "secondary",
    in_progress: "warning",
    implemented: "success",
    verified: "success",
  };

  const GRADE_VARIANTS: Record<string, "default" | "destructive" | "warning" | "secondary" | "outline" | "success"> = {
    A: "success",
    B: "default",
    C: "warning",
    D: "warning",
    F: "destructive",
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
    } catch {}
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

      // Auto-evaluate configuration on page load (non-blocking, silent)
      // This ensures controls advance from "not_started" based on actual tenant state
      runEvaluation(true).catch(() => {});
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

  async function runEvaluation(silent = false) {
    evaluating = true;
    try {
      const res = await fetch("/api/tenant-compliance/evaluate", { method: "POST" });
      if (!res.ok) throw new Error(`Evaluation failed (${res.status})`);
      const data: { tenantState: Record<string, boolean>; evaluations: any[]; controlsUpdated: boolean } = await res.json();
      lastEvaluation = data;
      if (data.controlsUpdated) {
        if (!silent) pushToast({ message: `Auto-assessed ${data.evaluations.filter((e: any) => e.autoApplied).length} controls based on your configuration`, variant: "success" });
        // Reload controls and scores to reflect updated statuses
        const controlsRes = await fetch("/api/tenant-compliance/controls");
        if (controlsRes.ok) {
          const cData = await controlsRes.json();
          frameworks = cData.frameworks || [];
          controls = cData.controls || [];
        }
        await loadScores();
      } else {
        if (!silent) pushToast({ message: "Evaluation complete -- no changes needed", variant: "success" });
      }
    } catch (e: any) {
      if (!silent) pushToast({ message: e?.message || "Evaluation failed", variant: "error" });
    } finally {
      evaluating = false;
    }
  }

  $: if (activeTab === "evidence" && evidenceItems.length === 0 && !evidenceLoading && !evidenceError) {
    loadEvidence();
  }

  // Evidence feed (real-time evidence from automations)
  interface EvidenceFeedItem {
    id: string;
    framework: string;
    controlId: string;
    category: string;
    source: string;
    actor: string;
    subject: string | null;
    impact: string;
    createdAt: string;
  }

  let evidenceFeed: EvidenceFeedItem[] = [];
  let feedSummary: { totalEvidence: number; frameworksCovered: number; controlsCovered: number } | null = null;

  // Score history
  interface ScoreHistoryPoint { date: string; score: number; grade: string }
  interface FrameworkHistory { framework: string; points: ScoreHistoryPoint[]; trend: "up" | "down" | "flat"; latestScore: number }
  let scoreHistory: FrameworkHistory[] = [];

  async function loadEvidenceFeed() {
    try {
      const res = await fetch("/api/compliance/evidence-feed?limit=10");
      if (res.ok) {
        const data = await res.json();
        evidenceFeed = data.feed || [];
        feedSummary = data.summary || null;
      }
    } catch {}
  }

  async function loadScoreHistory() {
    try {
      const res = await fetch("/api/tenant-compliance/history?days=30");
      if (res.ok) {
        const data = await res.json();
        scoreHistory = data.history || [];
      }
    } catch {}
  }

  function feedTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  onMount(() => {
    loadData();
    loadEvidenceFeed();
    loadScoreHistory();
  });
</script>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Compliance Manager</h1>
      <p class="text-sm text-muted-foreground">Track frameworks, controls, and overall compliance posture.</p>
    </div>
    <div class="flex items-center gap-2">
      <Button size="sm" on:click={runEvaluation} disabled={evaluating}>
        <Play class="h-3.5 w-3.5 mr-1.5" />
        {evaluating ? "Evaluating..." : "Evaluate Configuration"}
      </Button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 mb-6 border-b">
    {#each [
      { key: "overview", label: "Overview" },
      { key: "controls", label: "Controls" },
      { key: "evidence", label: "Evidence" },
    ] as tab}
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px
          {activeTab === tab.key
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
        on:click={() => (activeTab = tab.key)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="flex flex-col gap-4">
      <Skeleton class="h-12 rounded-lg" />
      <div class="grid gap-4 md:grid-cols-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-32 rounded-lg" />
        {/each}
      </div>
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else if activeTab === "overview"}
    <!-- Empty state -->
    {#if frameworks.length === 0 && controls.length === 0}
      <Card class="border-dashed mb-6">
        <CardContent class="py-8 text-center">
          <ShieldCheck class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 class="text-xl font-semibold mb-2">No compliance frameworks configured yet</h2>
          <p class="text-muted-foreground mb-4 max-w-md mx-auto">Select your frameworks in the onboarding wizard or settings to get started.</p>
          <div class="flex gap-3 justify-center">
            <Button href="/console/settings" variant="outline">
              <Settings class="h-4 w-4 mr-1.5" />
              Go to Settings
            </Button>
            <Button href="/console/onboarding">Setup Wizard</Button>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Overall posture -->
    <Card class="mb-6">
      <CardContent class="pt-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold">Overall Compliance Posture</h2>
            <Badge variant={GRADE_VARIANTS[overallGrade] || "destructive"}>{overallGrade}</Badge>
          </div>
          <span class="text-2xl font-bold">{overallScore}%</span>
        </div>
        <Progress value={overallScore} max={100} />
        <p class="text-xs text-muted-foreground mt-2">
          Weighted average across {scores.length} framework{scores.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>

    {#if lastEvaluation}
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Configuration Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            {#each Object.entries(lastEvaluation.tenantState) as [key, met]}
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full {met ? 'bg-green-500' : 'bg-destructive'}"></div>
                <span class="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Framework cards -->
    <h2 class="text-lg font-semibold mb-3">Frameworks</h2>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {#each scores as fw}
        <Card>
          <CardContent class="pt-5">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">{fw.framework}</h3>
              <Badge variant={GRADE_VARIANTS[fw.grade] || "destructive"}>{fw.grade}</Badge>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">{fw.score}%</span>
              <span class="text-xs text-muted-foreground">{fw.controlsImplemented + fw.controlsVerified}/{fw.controlsTotal} controls</span>
            </div>
            <Progress value={fw.score} max={100} />
            <p class="text-xs text-muted-foreground mt-2">
              {fw.controlsVerified} verified, {fw.controlsImplemented} implemented
            </p>
          </CardContent>
        </Card>
      {/each}
      {#if scores.length === 0}
        {#each frameworkSummaries as fw}
          <Card>
            <CardContent class="pt-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold">{fw.name}</h3>
                <Badge variant="destructive">F</Badge>
              </div>
              <Progress value={0} max={100} />
              <p class="text-xs text-muted-foreground mt-2">{fw.implemented}/{fw.total} controls completed</p>
            </CardContent>
          </Card>
        {/each}
      {/if}
    </div>

    <!-- Quick actions -->
    <h2 class="text-lg font-semibold mb-3">Quick Actions</h2>
    <div class="grid gap-4 md:grid-cols-3">
      <a href="/console/policies" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer group">
          <CardContent class="pt-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-sm font-medium group-hover:text-primary transition-colors">Generate Policy</p>
                <p class="text-xs text-muted-foreground">Create compliance policy documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
      <button on:click={() => (activeTab = "controls")} class="text-left">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer group">
          <CardContent class="pt-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <ClipboardCheck class="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p class="text-sm font-medium group-hover:text-primary transition-colors">View Risk Register</p>
                <p class="text-xs text-muted-foreground">Review controls and risk posture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>
      <button on:click={exportReport} class="text-left">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer group">
          <CardContent class="pt-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Download class="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p class="text-sm font-medium group-hover:text-primary transition-colors">Export Compliance Report</p>
                <p class="text-xs text-muted-foreground">Download CSV of control statuses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>
    </div>

    <!-- Evidence Activity Feed -->
    <div class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Evidence Activity</h2>
      {#if evidenceFeed.length > 0}
        <Card>
          <CardContent class="p-0">
            {#each evidenceFeed as item}
              <div class="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                <span class="w-2 h-2 rounded-full shrink-0 {item.impact === 'positive' ? 'bg-green-500' : item.impact === 'detrimental' ? 'bg-red-500' : 'bg-blue-500'}"></span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">
                    <span class="font-medium">{item.controlId}</span>
                    <span class="text-muted-foreground"> — {item.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" class="text-[10px]">{item.framework}</Badge>
                    <span class="text-[10px] text-muted-foreground">{item.source}</span>
                    {#if item.actor}
                      <span class="text-[10px] text-muted-foreground">{item.actor}</span>
                    {/if}
                  </div>
                </div>
                <span class="text-xs text-muted-foreground shrink-0">{feedTimeAgo(item.createdAt)}</span>
              </div>
            {/each}
          </CardContent>
        </Card>
        {#if feedSummary}
          <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{feedSummary.totalEvidence} total evidence items</span>
            <span>{feedSummary.frameworksCovered} framework{feedSummary.frameworksCovered !== 1 ? 's' : ''} covered</span>
            <span>{feedSummary.controlsCovered} control{feedSummary.controlsCovered !== 1 ? 's' : ''} covered</span>
          </div>
        {/if}
      {:else}
        <Card class="border-dashed">
          <CardContent class="py-8 text-center">
            <p class="text-sm text-muted-foreground">No evidence activity yet. Evidence is auto-generated when automations and workflows execute.</p>
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- Score Trend -->
    {#if scoreHistory.length > 0}
      <div class="mt-6">
        <h2 class="text-lg font-semibold mb-3">Score Trend (30 days)</h2>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {#each scoreHistory as fw}
            <Card>
              <CardContent class="pt-4 pb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">{fw.framework}</span>
                  <div class="flex items-center gap-1.5">
                    {#if fw.trend === "up"}
                      <span class="text-green-500 text-xs font-medium">Improving</span>
                    {:else if fw.trend === "down"}
                      <span class="text-red-500 text-xs font-medium">Declining</span>
                    {:else}
                      <span class="text-muted-foreground text-xs">Stable</span>
                    {/if}
                    <span class="text-lg font-bold">{Math.round(fw.latestScore)}%</span>
                  </div>
                </div>
                {#if fw.points.length > 1}
                  <!-- Simple sparkline using SVG -->
                  <svg class="w-full h-8" viewBox="0 0 {fw.points.length * 10} 40" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={fw.trend === "up" ? "rgb(34, 197, 94)" : fw.trend === "down" ? "rgb(239, 68, 68)" : "rgb(148, 163, 184)"}
                      stroke-width="2"
                      points={fw.points.map((p, i) => `${i * 10},${40 - (p.score / 100) * 40}`).join(" ")}
                    />
                  </svg>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      </div>
    {/if}

  {:else if activeTab === "controls"}
    <!-- Controls tab -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <Label htmlFor="fw-filter">Framework:</Label>
        <select
          id="fw-filter"
          bind:value={filterFramework}
          class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Frameworks</option>
          {#each frameworks as fw}
            <option value={fw}>{fw}</option>
          {/each}
        </select>
      </div>
      <Button size="sm" on:click={saveControls} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>

    <Card>
      <CardContent class="p-0">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
              <th class="px-4 py-3 font-medium">Control</th>
              <th class="px-4 py-3 font-medium">Framework</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredControls as control (control.id)}
              <tr class="border-t hover:bg-muted/50">
                <td class="px-4 py-3 font-medium">{control.name}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline">{control.framework}</Badge>
                </td>
                <td class="px-4 py-3">
                  <select
                    value={control.status}
                    on:change={(e) => updateControlStatus(control.id, e.currentTarget.value)}
                    class="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    class="w-full bg-transparent border-b border-input text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary py-1"
                  />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </CardContent>
    </Card>

  {:else if activeTab === "evidence"}
    <!-- Evidence tab -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Evidence Locker</h2>
      <Button size="sm" variant={showRecordForm ? "outline" : "default"} on:click={() => (showRecordForm = !showRecordForm)}>
        <Upload class="h-3.5 w-3.5 mr-1.5" />
        {showRecordForm ? "Cancel" : "Record Evidence"}
      </Button>
    </div>

    {#if showRecordForm}
      <Card class="mb-4">
        <CardHeader>
          <CardTitle class="text-base">Record New Evidence</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="space-y-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <textarea
              id="ev-desc"
              bind:value={newEvidenceDescription}
              rows="3"
              placeholder="Describe the evidence..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            ></textarea>
          </div>
          <div class="space-y-1.5">
            <Label htmlFor="ev-pack">Evidence Pack</Label>
            <select
              id="ev-pack"
              bind:value={newEvidencePack}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="manual">Manual Upload</option>
              <option value="access-review">Access Review</option>
              <option value="config-snapshot">Configuration Snapshot</option>
              <option value="audit-log">Audit Log</option>
              <option value="policy-doc">Policy Document</option>
            </select>
          </div>
          <Button variant="success" size="sm" on:click={recordEvidence} disabled={recordingEvidence || !newEvidenceDescription.trim()}>
            {recordingEvidence ? "Recording..." : "Submit Evidence"}
          </Button>
        </CardContent>
      </Card>
    {/if}

    {#if evidenceLoading}
      <div class="space-y-3">
        {#each [1, 2] as _}
          <Skeleton class="h-12 rounded-lg" />
        {/each}
      </div>
    {:else if evidenceError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{evidenceError}</p>
      </Alert>
    {:else if evidenceItems.length === 0}
      <Card class="border-dashed">
        <CardContent class="py-12 text-center">
          <Upload class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 class="text-lg font-semibold text-muted-foreground mb-2">No evidence recorded yet</h3>
          <p class="text-sm text-muted-foreground max-w-md mx-auto">
            Record evidence to demonstrate compliance during audits. Click "Record Evidence" above to get started.
          </p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">Hash</th>
                <th class="px-4 py-3 font-medium">Pack</th>
                <th class="px-4 py-3 font-medium">Subject</th>
                <th class="px-4 py-3 font-medium">Date</th>
                <th class="px-4 py-3 font-medium">Link to Control</th>
              </tr>
            </thead>
            <tbody>
              {#each evidenceItems as item (item.id)}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs" title={item.hash}>{shortHash(item.hash)}</span>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant="secondary">{item.pack}</Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{item.subject || "-"}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</td>
                  <td class="px-4 py-3">
                    {#if item.linkedControl}
                      <Badge variant="success">{item.linkedControl}</Badge>
                    {:else if linkingEvidenceId === item.id}
                      <div class="flex items-center gap-2">
                        <select
                          bind:value={linkControlKey}
                          class="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Select control...</option>
                          {#each INTERNAL_CONTROLS as ctrl}
                            <option value={ctrl.key}>{ctrl.key} - {ctrl.title}</option>
                          {/each}
                        </select>
                        <Button size="sm" variant="default" on:click={() => linkEvidence(item.id)} disabled={!linkControlKey}>Link</Button>
                        <Button size="sm" variant="ghost" on:click={() => { linkingEvidenceId = null; linkControlKey = ""; }}>Cancel</Button>
                      </div>
                    {:else}
                      <Button size="sm" variant="ghost" on:click={() => { linkingEvidenceId = item.id; linkControlKey = ""; }}>
                        <Link2 class="h-3 w-3 mr-1" />
                        Link
                      </Button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>

<style>
  select option {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }
</style>
