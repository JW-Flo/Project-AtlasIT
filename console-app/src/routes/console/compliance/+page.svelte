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
    Play, Link2, Upload, Search, Settings, TrendingUp, TrendingDown, Minus,
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

  interface HistoryPoint {
    date: string;
    score: number;
    grade: string;
  }

  interface FrameworkHistory {
    framework: string;
    points: HistoryPoint[];
    trend: "up" | "down" | "flat";
    latestScore: number;
  }

  interface EvidenceFeedSummary {
    totalEvidence: number;
    frameworksCovered: number;
    controlsCovered: number;
    positiveCount: number;
    detrimentalCount: number;
  }

  interface EvidenceFeedPreviewItem {
    id: string;
    framework: string;
    controlId: string;
    impact: "positive" | "detrimental" | "neutral";
    eventType: string;
    source: string;
    actor: string;
    subject: string;
    reasoning: string;
    createdAt: string;
  }

  let loading = true;
  let saving = false;
  let error: string | null = null;
  let frameworks: string[] = [];
  let controls: Control[] = [];
  let scores: FrameworkScore[] = [];
  let activeTab: "overview" | "controls" | "evidence" = "overview";
  let filterFramework = "all";
  let filterStatus = "all";
  let history: FrameworkHistory[] = [];
  let historyError: string | null = null;
  let evidenceFeedSummary: EvidenceFeedSummary = {
    totalEvidence: 0,
    frameworksCovered: 0,
    controlsCovered: 0,
    positiveCount: 0,
    detrimentalCount: 0,
  };
  let evidenceFeedPreview: EvidenceFeedPreviewItem[] = [];
  let evidenceFeedError: string | null = null;

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
  $: statusFilteredControls =
    filterStatus === "all"
      ? filteredControls
      : filteredControls.filter((c) => c.status === filterStatus);
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

  function trendVariant(trend: "up" | "down" | "flat"): "success" | "destructive" | "secondary" {
    if (trend === "up") return "success";
    if (trend === "down") return "destructive";
    return "secondary";
  }

  function trendLabel(trend: "up" | "down" | "flat"): string {
    if (trend === "up") return "Up";
    if (trend === "down") return "Down";
    return "Flat";
  }

  function sparklinePoints(points: HistoryPoint[]): string {
    if (!points || points.length === 0) return "";

    const width = 160;
    const height = 48;
    const min = Math.min(...points.map((p) => p.score));
    const max = Math.max(...points.map((p) => p.score));
    const range = max - min;

    return points
      .map((p, i) => {
        const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
        const y = range === 0
          ? height / 2
          : height - ((p.score - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }

  function evidenceImpactVariant(impact: "positive" | "detrimental" | "neutral"): "success" | "destructive" | "secondary" {
    if (impact === "positive") return "success";
    if (impact === "detrimental") return "destructive";
    return "secondary";
  }
  async function loadScores(notify = false) {
    const previousOverall = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length * 100) / 100
      : 0;

    try {
      const res = await fetch("/api/tenant-compliance/scores");
      if (res.ok) {
        const data = await res.json();
        scores = data.scores || [];
      }
    } catch {}

    if (notify && scores.length > 0) {
      const newOverall = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length * 100) / 100;
      const delta = Math.round((newOverall - previousOverall) * 100) / 100;
      if (delta > 0) {
        pushToast({
          message: `Compliance score improved: ${previousOverall}% \u2192 ${newOverall}% (+${delta}%)`,
          variant: "success",
        });
      } else if (delta < 0) {
        pushToast({
          message: `Compliance score changed: ${previousOverall}% \u2192 ${newOverall}% (${delta}%)`,
          variant: "warning",
        });
      }
    }
  }

  async function loadHistory() {
    historyError = null;
    try {
      const res = await fetch("/api/tenant-compliance/history?days=30");
      if (!res.ok) {
        history = [];
        historyError = `Failed to load score history (${res.status})`;
        return;
      }
      const data = await res.json();
      history = data.history || [];
    } catch {
      history = [];
      historyError = "Failed to load score history";
    }
  }

  async function loadEvidenceFeedPreview() {
    evidenceFeedError = null;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const res = await fetch(`/api/evidence-feed?since=${encodeURIComponent(since)}&limit=5&offset=0`);
      if (!res.ok) {
        evidenceFeedPreview = [];
        evidenceFeedError = `Failed to load evidence feed (${res.status})`;
        return;
      }

      const data = await res.json();
      evidenceFeedSummary = {
        totalEvidence: Number(data?.summary?.totalEvidence ?? 0),
        frameworksCovered: Number(data?.summary?.frameworksCovered ?? 0),
        controlsCovered: Number(data?.summary?.controlsCovered ?? 0),
        positiveCount: Number(data?.summary?.positiveCount ?? 0),
        detrimentalCount: Number(data?.summary?.detrimentalCount ?? 0),
      };
      evidenceFeedPreview = Array.isArray(data?.feed) ? data.feed : [];
    } catch {
      evidenceFeedPreview = [];
      evidenceFeedError = "Failed to load evidence feed";
    }
  }

  async function loadData() {
    loading = true;
    error = null;
    try {
      const [controlsRes] = await Promise.all([
        fetch("/api/tenant-compliance/controls"),
        loadScores(),
        loadHistory(),
        loadEvidenceFeedPreview(),
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
      await loadScores(true);
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

  // Control → Evidence drill-down
  let expandedControlId: string | null = null;
  let controlEvidence: EvidenceFeedPreviewItem[] = [];
  let controlEvidenceLoading = false;

  // Verification attestation
  let verifyingControlId: string | null = null;
  let verifyNotes = "";

  async function submitVerification(control: Control) {
    if (verifyingControlId === control.id) {
      // Already showing form — submit it
      verifyingControlId = null;
      try {
        const res = await fetch("/api/tenant-compliance/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: {
              controlId: control.id,
              framework: control.framework,
              attestedBy: "current_user",
              notes: verifyNotes,
              type: "verification_attestation",
            },
            pack: "verification_attestation",
            subject: control.id,
          }),
        });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        updateControlStatus(control.id, "verified");
        pushToast({ message: `${control.id} verified. Score updated.`, variant: "success" });
        verifyNotes = "";
        await saveControls();
      } catch (e: any) {
        pushToast({ message: e?.message || "Verification failed", variant: "error" });
      }
      return;
    }
    verifyingControlId = control.id;
    verifyNotes = "";
  }

  async function toggleControlEvidence(controlId: string, framework: string) {
    if (expandedControlId === controlId) {
      expandedControlId = null;
      controlEvidence = [];
      return;
    }
    expandedControlId = controlId;
    controlEvidenceLoading = true;
    try {
      const params = new URLSearchParams({ controlId, framework, limit: "10" });
      const res = await fetch(`/api/evidence-feed?${params}`);
      if (res.ok) {
        const data = await res.json();
        controlEvidence = Array.isArray(data.feed) ? data.feed : [];
      } else {
        controlEvidence = [];
      }
    } catch {
      controlEvidence = [];
    } finally {
      controlEvidenceLoading = false;
    }
  }

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

  // Evidence tagging
  interface EvidenceTag {
    id: string;
    tag: string;
    tagType: string;
    color: string | null;
    createdBy: string;
  }

  let tagsByEvidence: Record<string, EvidenceTag[]> = {};
  let taggingEvidenceId: string | null = null;
  let newTagValue = "";
  let newTagType: "label" | "flag" | "priority" | "status" = "label";
  let availableTags: Array<{ tag: string; tag_type: string; color: string | null; usage_count: number }> = [];

  const TAG_COLORS: Record<string, string> = {
    label: "#6366f1",
    flag: "#ef4444",
    priority: "#f59e0b",
    status: "#22c55e",
  };

  async function loadTenantTags() {
    try {
      const res = await fetch("/api/evidence/tags");
      if (res.ok) {
        const data = await res.json();
        availableTags = data.tags || [];
      }
    } catch {}
  }

  async function loadEvidenceTags(evidenceId: string) {
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/tags`);
      if (res.ok) {
        const data = await res.json();
        tagsByEvidence[evidenceId] = data.tags || [];
        tagsByEvidence = tagsByEvidence; // trigger reactivity
      }
    } catch {}
  }

  async function addTag(evidenceId: string) {
    if (!newTagValue.trim()) return;
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/tags`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tag: newTagValue.trim(),
          tagType: newTagType,
          color: TAG_COLORS[newTagType] || null,
        }),
      });
      if (res.ok) {
        newTagValue = "";
        await loadEvidenceTags(evidenceId);
        await loadTenantTags();
      } else {
        const data = await res.json();
        pushToast({ message: data.error || "Failed to add tag", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to add tag", variant: "error" });
    }
  }

  async function removeTag(evidenceId: string, tagId: string) {
    try {
      await fetch(`/api/evidence/${evidenceId}/tags`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      await loadEvidenceTags(evidenceId);
    } catch {}
  }

  function startTagging(evidenceId: string) {
    taggingEvidenceId = evidenceId;
    if (!tagsByEvidence[evidenceId]) {
      loadEvidenceTags(evidenceId);
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
        await loadScores(true);
      } else {
        pushToast({ message: "Evaluation complete -- no changes needed", variant: "success" });
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

  onMount(() => {
    loadData();
    loadEvidence();
    loadTenantTags();
    // Auto-evaluate configuration on page load (non-blocking, silent)
    runEvaluation().catch(() => {});
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

    <!-- Evidence pipeline hero -->
    <Card class="mb-6 border-primary/20 bg-primary/5">
      <CardContent class="pt-5 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Lifecycle → Compliance Evidence Pipeline</h2>
            <p class="text-sm text-muted-foreground">
              {evidenceFeedSummary.totalEvidence} evidence events from {evidenceFeedSummary.positiveCount + evidenceFeedSummary.detrimentalCount} lifecycle operations this week.
            </p>
          </div>
          <a href="/console/compliance/feed" class="text-sm text-primary hover:underline">View full feed →</a>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div class="rounded-md border bg-background px-3 py-2">
            <div class="text-muted-foreground text-xs">Total Evidence</div>
            <div class="font-semibold">{evidenceFeedSummary.totalEvidence}</div>
          </div>
          <div class="rounded-md border bg-background px-3 py-2">
            <div class="text-muted-foreground text-xs">Frameworks Covered</div>
            <div class="font-semibold">{evidenceFeedSummary.frameworksCovered}</div>
          </div>
          <div class="rounded-md border bg-background px-3 py-2">
            <div class="text-muted-foreground text-xs">Controls Covered</div>
            <div class="font-semibold">{evidenceFeedSummary.controlsCovered}</div>
          </div>
          <div class="rounded-md border bg-background px-3 py-2">
            <div class="text-muted-foreground text-xs">Detrimental Events</div>
            <div class="font-semibold text-destructive">{evidenceFeedSummary.detrimentalCount}</div>
          </div>
        </div>

        {#if evidenceFeedError}
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <p class="pl-7">{evidenceFeedError}</p>
          </Alert>
        {:else if evidenceFeedPreview.length > 0}
          <div class="rounded-md border bg-background divide-y">
            {#each evidenceFeedPreview as item}
              <div class="px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-medium">{item.framework} · {item.controlId}</div>
                  <div class="text-xs text-muted-foreground">{item.eventType} • {item.source} • {item.actor || "system"}</div>
                </div>
                <div class="text-right">
                  <Badge variant={evidenceImpactVariant(item.impact)}>{item.impact}</Badge>
                  <div class="text-[11px] text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

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

    <!-- Score history -->
    <h2 class="text-lg font-semibold mb-3">Score History (30 days)</h2>
    {#if historyError}
      <Alert variant="destructive" class="mb-6">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{historyError}</p>
      </Alert>
    {:else if history.length === 0}
      <Card class="mb-6 border-dashed">
        <CardContent class="py-6 text-sm text-muted-foreground">No compliance history available yet.</CardContent>
      </Card>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {#each history as h}
          <Card>
            <CardContent class="pt-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold">{h.framework}</h3>
                <Badge variant={trendVariant(h.trend)} class="gap-1">
                  {#if h.trend === "up"}
                    <TrendingUp class="h-3 w-3" />
                  {:else if h.trend === "down"}
                    <TrendingDown class="h-3 w-3" />
                  {:else}
                    <Minus class="h-3 w-3" />
                  {/if}
                  {trendLabel(h.trend)}
                </Badge>
              </div>

              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl font-bold">{Math.round(h.latestScore)}%</span>
                <span class="text-xs text-muted-foreground">{h.points.length} points</span>
              </div>

              <svg viewBox="0 0 160 48" class="w-full h-12" role="img" aria-label={`30-day trend for ${h.framework}`}>
                <polyline
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-primary"
                  points={sparklinePoints(h.points)}
                />
              </svg>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}

    <!-- Evidence timeline -->
    <h2 class="text-lg font-semibold mb-3">Recent Evidence Timeline</h2>
    {#if evidenceLoading}
      <div class="space-y-2 mb-6">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-10 rounded-lg" />
        {/each}
      </div>
    {:else if evidenceItems.length === 0}
      <Card class="mb-6 border-dashed">
        <CardContent class="py-6 text-sm text-muted-foreground">No evidence events recorded yet.</CardContent>
      </Card>
    {:else}
      <Card class="mb-6">
        <CardContent class="p-0">
          <div class="divide-y">
            {#each evidenceItems.slice(0, 8) as item}
              <div class="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div class="text-sm font-medium">{item.pack || "manual"}</div>
                  <div class="text-xs text-muted-foreground">Actor: {item.subject || "system"}</div>
                </div>
                <div class="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

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

  {:else if activeTab === "controls"}
    <!-- Controls tab -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <select
          id="fw-filter"
          bind:value={filterFramework}
          class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">All Frameworks</option>
          {#each frameworks as fw}
            <option value={fw}>{fw}</option>
          {/each}
        </select>
        <select
          bind:value={filterStatus}
          class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="implemented">Implemented</option>
          <option value="verified">Verified</option>
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
              <th class="px-4 py-3 font-medium w-[180px]">Control</th>
              <th class="px-4 py-3 font-medium">Description</th>
              <th class="px-4 py-3 font-medium w-[100px]">Framework</th>
              <th class="px-4 py-3 font-medium w-[140px]">Status</th>
              <th class="px-4 py-3 font-medium">Notes</th>
              <th class="px-4 py-3 font-medium w-[80px]">Verify</th>
            </tr>
          </thead>
          <tbody>
            {#each statusFilteredControls as control (control.id)}
              <tr class="border-t hover:bg-muted/50 cursor-pointer" on:click={() => toggleControlEvidence(control.id, control.framework)}>
                <td class="px-4 py-3">
                  <div class="font-medium flex items-center gap-1.5">
                    {control.name}
                    <span class="text-[10px] text-muted-foreground">{expandedControlId === control.id ? '▼' : '▶'}</span>
                  </div>
                  {#if control.automatable}
                    <span class="text-[10px] text-primary font-medium uppercase tracking-wider">Auto</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-muted-foreground text-xs">{control.description || ""}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline">{control.framework}</Badge>
                </td>
                <td class="px-4 py-3" on:click|stopPropagation>
                  <select
                    value={control.status}
                    on:change={(e) => updateControlStatus(control.id, e.currentTarget.value)}
                    class="h-8 rounded-md border border-input bg-background px-2 text-xs w-full"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="implemented">Implemented</option>
                    <option value="verified">Verified</option>
                  </select>
                </td>
                <td class="px-4 py-3" on:click|stopPropagation>
                  <input
                    type="text"
                    value={control.notes}
                    on:blur={(e) => updateControlNotes(control.id, e.currentTarget.value)}
                    placeholder="Add notes..."
                    class="w-full bg-transparent border-b border-input text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary py-1"
                  />
                </td>
                <td class="px-4 py-3" on:click|stopPropagation>
                  {#if control.status === "verified"}
                    <Badge variant="success">Verified</Badge>
                  {:else if control.status === "implemented"}
                    <Button size="sm" variant="outline" on:click={() => submitVerification(control)}>
                      {verifyingControlId === control.id ? "Confirm" : "Verify"}
                    </Button>
                  {:else}
                    <span class="text-xs text-muted-foreground">—</span>
                  {/if}
                </td>
              </tr>
              {#if verifyingControlId === control.id}
                <tr class="bg-green-500/5">
                  <td colspan="6" class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-medium text-muted-foreground shrink-0">Attestation notes:</span>
                      <input
                        type="text"
                        bind:value={verifyNotes}
                        placeholder="e.g. Reviewed by Jane Smith on 2026-03-20"
                        class="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs"
                        on:keydown={(e) => { if (e.key === "Enter") submitVerification(control); }}
                      />
                      <Button size="sm" variant="success" on:click={() => submitVerification(control)}>Submit Verification</Button>
                      <Button size="sm" variant="ghost" on:click={() => { verifyingControlId = null; verifyNotes = ""; }}>Cancel</Button>
                    </div>
                  </td>
                </tr>
              {/if}
              {#if expandedControlId === control.id}
                <tr class="bg-muted/20">
                  <td colspan="6" class="px-4 py-3">
                    {#if controlEvidenceLoading}
                      <div class="text-xs text-muted-foreground py-2">Loading evidence...</div>
                    {:else if controlEvidence.length === 0}
                      <div class="text-xs text-muted-foreground py-2">No evidence found for this control. Evidence is collected automatically from lifecycle events.</div>
                    {:else}
                      <div class="text-xs font-medium text-muted-foreground mb-2">{controlEvidence.length} evidence item{controlEvidence.length !== 1 ? 's' : ''} for {control.id}</div>
                      <div class="space-y-1.5">
                        {#each controlEvidence as ev}
                          <div class="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2">
                            <div>
                              <span class="text-xs font-medium">{ev.eventType || ev.source}</span>
                              <span class="text-[11px] text-muted-foreground ml-2">{ev.actor || "system"}</span>
                              {#if ev.reasoning}
                                <div class="text-[11px] text-muted-foreground mt-0.5">{ev.reasoning}</div>
                              {/if}
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                              <Badge variant={evidenceImpactVariant(ev.impact)}>{ev.impact}</Badge>
                              <span class="text-[10px] text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        {/each}
                      </div>
                      <a href="/console/compliance/feed?controlId={control.id}&framework={control.framework}" class="text-xs text-primary hover:underline mt-2 inline-block">View all evidence for this control →</a>
                    {/if}
                  </td>
                </tr>
              {/if}
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
                <th class="px-4 py-3 font-medium">Tags</th>
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
                  <td class="px-4 py-3">
                    {#if tagsByEvidence[String(item.id)]}
                      {#each tagsByEvidence[String(item.id)] as tag}
                        <span class="inline-flex items-center gap-1 text-[11px] text-white rounded-full px-2 py-0.5 mr-1 mb-1"
                            style="background-color: {tag.color || TAG_COLORS[tag.tagType] || '#6b7280'}">
                          {tag.tag}
                          <button type="button" class="ml-0.5 opacity-60 hover:opacity-100 text-xs leading-none"
                              on:click={() => removeTag(String(item.id), tag.id)}>&times;</button>
                        </span>
                      {/each}
                    {/if}
                    {#if taggingEvidenceId === String(item.id)}
                      <div class="flex items-center gap-1 mt-1">
                        <select bind:value={newTagType} class="h-6 rounded border border-input bg-background px-1 text-[11px]">
                          <option value="label">Label</option><option value="flag">Flag</option><option value="priority">Priority</option><option value="status">Status</option>
                        </select>
                        <input bind:value={newTagValue} placeholder="Tag..." class="h-6 w-24 rounded border border-input bg-background px-1.5 text-[11px]"
                            on:keydown={(e) => { if (e.key === "Enter") addTag(String(item.id)); }} />
                        <button type="button" class="text-[11px] text-primary hover:underline" on:click={() => addTag(String(item.id))}>Add</button>
                        <button type="button" class="text-[11px] text-muted-foreground hover:underline" on:click={() => { taggingEvidenceId = null; newTagValue = ""; }}>Done</button>
                      </div>
                    {:else}
                      <button type="button" class="text-[11px] text-muted-foreground hover:text-primary" on:click={() => startTagging(String(item.id))}>+ Tag</button>
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
