<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { session } from "$lib/stores/session";
  import {
    Plus, FileText, Check, X, Archive, Send, Edit3, History,
    ChevronDown, ChevronUp, AlertTriangle, Clock, MessageSquare, Download
  } from "lucide-svelte";

  // ── Types ────────────────────────────────────────────────────────────────

  interface PolicyVersion {
    version: number;
    content: string;
    diffSummary?: string | null;
    createdAt: string;
  }

  interface PolicyApproval {
    reviewerEmail: string;
    decision: "approved" | "rejected" | "changes_requested" | "pending" | "superseded";
    comment?: string | null;
    decidedAt: string;
  }

  interface ApprovalSummary {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    reviewers: { email: string; decision: string; decidedAt: string | null }[];
  }

  interface Policy {
    id: string;
    title: string;
    type: string;
    status: "draft" | "pending_review" | "approved" | "archived";
    version: number;
    createdBy?: string | null;
    content: string;
    updatedAt: string;
    createdAt: string;
    approvalSummary?: ApprovalSummary | null;
  }

  interface PolicyDetail extends Policy {
    versions: PolicyVersion[];
    approvals: PolicyApproval[];
  }

  interface PolicyTemplate {
    key: string;
    name: string;
    format: string;
  }

  interface GeneratedPolicy {
    hash: string;
    templateKey: string;
    content: string;
    createdAt: string;
    sizeBytes: number;
    reused: boolean;
  }

  // ── State ────────────────────────────────────────────────────────────────

  let loading = true;
  let error: string | null = null;
  let policies: Policy[] = [];

  let expandedRows = new Set<string>();
  let detailCache: Record<string, PolicyDetail> = {};
  let loadingDetail = new Set<string>();
  let detailErrors: Record<string, string> = {};

  // selected version to preview per policy id
  let selectedVersion: Record<string, number> = {};

  // inline editor state per policy id
  let editingContent: Record<string, string> = {};
  let editingOpen = new Set<string>();
  let savingEdit = new Set<string>();

  // submit-for-review form
  let submitOpen = new Set<string>();
  let reviewerEmails: Record<string, string> = {};
  let submitting = new Set<string>();

  // review decision state
  let reviewComment: Record<string, string> = {};
  let processingReview = new Set<string>();

  // archive state
  let archiving = new Set<string>();

  // Tenant users for reviewer picker
  let tenantUsers: { email: string; name?: string }[] = [];
  let selectedReviewers: Record<string, Set<string>> = {};

  // Generate panel
  let showGenerate = false;
  let templates: PolicyTemplate[] = [];
  let loadingTemplates = false;
  let generating = false;
  let generatedPolicy: GeneratedPolicy | null = null;
  let selectedTemplate = "";
  let contactEmail = "";
  let genSummary = "";
  let savingDraft = false;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const TYPE_LABELS: Record<string, string> = {
    access_control: "Access Control",
    incident_response: "Incident Response",
    data_handling: "Data Handling",
    password: "Password",
    acceptable_use: "Acceptable Use",
  };

  function typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
  }

  function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
    switch (status) {
      case "approved": return "success";
      case "pending_review": return "warning";
      default: return "secondary"; // draft and archived
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "draft": return "Draft";
      case "pending_review": return "Pending Review";
      case "approved": return "Approved";
      case "archived": return "Archived";
      default: return status;
    }
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function visibleContent(detail: PolicyDetail, policyId: string): string {
    const ver = selectedVersion[policyId];
    if (ver != null) {
      const v = detail.versions.find((v) => v.version === ver);
      if (v) return v.content;
    }
    return detail.content;
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  async function loadPolicies() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/policies/managed");
      if (!res.ok) throw new Error(`Failed to load policies (${res.status})`);
      const data = await res.json();
      policies = Array.isArray(data?.items) ? data.items : [];
    } catch (e: any) {
      error = e?.message || "Failed to load policies";
      policies = [];
    } finally {
      loading = false;
    }
  }

  async function loadDetail(policyId: string) {
    if (detailCache[policyId] || loadingDetail.has(policyId)) return;
    loadingDetail.add(policyId);
    loadingDetail = new Set(loadingDetail);
    try {
      const res = await fetch(`/api/policies/${policyId}`);
      if (res.ok) {
        const data = await res.json();
        // Flatten { policy, versions, approvals } into PolicyDetail
        detailCache[policyId] = {
          ...(data.policy ?? data),
          versions: data.versions ?? [],
          approvals: data.approvals ?? [],
        };
        detailCache = { ...detailCache };
      } else {
        detailErrors[policyId] = `Failed to load (HTTP ${res.status})`;
        detailErrors = { ...detailErrors };
      }
    } catch {
      detailErrors[policyId] = "Service unavailable";
      detailErrors = { ...detailErrors };
    }
    loadingDetail.delete(policyId);
    loadingDetail = new Set(loadingDetail);
  }

  function retryLoadDetail(policyId: string) {
    delete detailErrors[policyId];
    detailErrors = { ...detailErrors };
    delete detailCache[policyId];
    detailCache = { ...detailCache };
    loadDetail(policyId);
  }

  async function downloadPdf(detail: PolicyDetail) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });

    const orgName = $session?.orgName || "Organization";
    const accentHex = $session?.branding?.accentColor || "#1a56db";
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 56;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Parse accent color to RGB
    function hexToRgb(hex: string): [number, number, number] {
      const h = hex.replace("#", "");
      if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      return [26, 86, 219]; // fallback blue
    }
    const [ar, ag, ab] = hexToRgb(accentHex);

    // Header bar
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, pageW, 72, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(orgName, margin, 44);

    // Title
    y = 100;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(detail.title, margin, y);
    y += 28;

    // Metadata line
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const meta = [
      `Type: ${detail.type}`,
      `Status: ${statusLabel(detail.status)}`,
      `Version: v${detail.version}`,
      `Last updated: ${fmtDate(detail.updatedAt)}`,
      detail.createdBy ? `Author: ${detail.createdBy}` : null,
    ].filter(Boolean).join("  •  ");
    doc.text(meta, margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageW - margin, y);
    y += 20;

    // Content body
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const content = visibleContent(detail, detail.id);
    const lines = doc.splitTextToSize(content, contentW) as string[];
    const lineH = 14;
    const pageH = doc.internal.pageSize.getHeight();

    for (const line of lines) {
      if (y + lineH > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineH;
    }

    // Approval section (if any)
    if (detail.approvals?.length > 0) {
      y += 16;
      if (y + 40 > pageH - margin) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Approval History", margin, y);
      y += 16;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      for (const a of detail.approvals) {
        if (y + 14 > pageH - margin) { doc.addPage(); y = margin; }
        const decision = a.decision === "changes_requested" ? "changes requested" : a.decision;
        const aLine = `${a.reviewerEmail} — ${decision}${a.decidedAt ? ` (${fmtDate(a.decidedAt)})` : ""}${a.comment ? `: ${a.comment}` : ""}`;
        doc.setTextColor(80, 80, 80);
        doc.text(aLine, margin, y);
        y += 14;
      }
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      doc.text(`${orgName} — ${detail.title} v${detail.version}`, margin, pageH - 30);
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 30, { align: "right" });
      doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, pageH - 20);
    }

    const slug = detail.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    doc.save(`${slug}-v${detail.version}.pdf`);
  }

  async function loadTemplates() {
    loadingTemplates = true;
    try {
      const res = await fetch("/api/policies/templates");
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const data = await res.json();
      templates = data.templates || [];
      if (templates.length > 0 && !selectedTemplate) {
        selectedTemplate = templates[0].key;
      }
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to load templates", variant: "error" });
    } finally {
      loadingTemplates = false;
    }
  }

  // ── Row interactions ──────────────────────────────────────────────────────

  function toggleExpanded(id: string) {
    if (expandedRows.has(id)) {
      expandedRows.delete(id);
    } else {
      expandedRows.add(id);
      loadDetail(id);
    }
    expandedRows = new Set(expandedRows);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function saveEdit(policy: Policy) {
    const content = editingContent[policy.id];
    if (!content?.trim()) return;
    savingEdit.add(policy.id);
    savingEdit = new Set(savingEdit);
    try {
      const res = await fetch(`/api/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      pushToast({ message: "Draft saved", variant: "success" });
      editingOpen.delete(policy.id);
      editingOpen = new Set(editingOpen);
      delete detailCache[policy.id];
      detailCache = { ...detailCache };
      loadDetail(policy.id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save", variant: "error" });
    }
    savingEdit.delete(policy.id);
    savingEdit = new Set(savingEdit);
  }

  async function submitForReview(policy: Policy) {
    const emails = (reviewerEmails[policy.id] || "")
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      pushToast({ message: "Enter at least one reviewer email", variant: "error" });
      return;
    }
    submitting.add(policy.id);
    submitting = new Set(submitting);
    try {
      const res = await fetch(`/api/policies/${policy.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerEmails: emails }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      pushToast({ message: "Submitted for review", variant: "success" });
      submitOpen.delete(policy.id);
      submitOpen = new Set(submitOpen);
      reviewerEmails[policy.id] = "";
      const idx = policies.findIndex((p) => p.id === policy.id);
      if (idx >= 0) {
        policies[idx] = { ...policies[idx], status: "pending_review" };
        policies = [...policies];
      }
      delete detailCache[policy.id];
      detailCache = { ...detailCache };
      loadDetail(policy.id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to submit", variant: "error" });
    }
    submitting.delete(policy.id);
    submitting = new Set(submitting);
  }

  async function reviewDecision(policy: Policy, decision: "approved" | "rejected" | "changes_requested") {
    processingReview.add(policy.id);
    processingReview = new Set(processingReview);
    try {
      const res = await fetch(`/api/policies/${policy.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment: reviewComment[policy.id] || undefined }),
      });
      if (!res.ok) throw new Error("Failed to record decision");
      const result = await res.json();
      const labels: Record<string, string> = {
        approved: result.status === "approved" ? "Policy approved" : "Approval recorded — waiting for other reviewers",
        rejected: "Policy rejected — returned to draft",
        changes_requested: "Changes requested — returned to draft",
      };
      pushToast({ message: labels[decision] ?? "Decision recorded", variant: decision === "rejected" || decision === "changes_requested" ? "warning" : "success" });
      reviewComment[policy.id] = "";
      const idx = policies.findIndex((p) => p.id === policy.id);
      if (idx >= 0) {
        policies[idx] = { ...policies[idx], status: result.status as Policy["status"] };
        policies = [...policies];
      }
      delete detailCache[policy.id];
      detailCache = { ...detailCache };
      loadDetail(policy.id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to record decision", variant: "error" });
    }
    processingReview.delete(policy.id);
    processingReview = new Set(processingReview);
  }

  async function archivePolicy(policy: Policy) {
    archiving.add(policy.id);
    archiving = new Set(archiving);
    try {
      const res = await fetch(`/api/policies/${policy.id}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to archive");
      pushToast({ message: "Policy archived", variant: "success" });
      const idx = policies.findIndex((p) => p.id === policy.id);
      if (idx >= 0) {
        policies[idx] = { ...policies[idx], status: "archived" };
        policies = [...policies];
      }
      delete detailCache[policy.id];
      detailCache = { ...detailCache };
      loadDetail(policy.id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to archive", variant: "error" });
    }
    archiving.delete(policy.id);
    archiving = new Set(archiving);
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  function openGenerate() {
    showGenerate = true;
    generatedPolicy = null;
    if (templates.length === 0) loadTemplates();
  }

  async function generatePolicy() {
    if (!selectedTemplate) return;
    generating = true;
    generatedPolicy = null;
    try {
      const res = await fetch("/api/policies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          input: {
            contactEmail: contactEmail || "security@company.com",
            summary: genSummary || "No additional context provided.",
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Generation failed (${res.status})`);
      }
      const raw = await res.json();
      // API returns { status, data: { policy } } or direct GeneratedPolicy shape
      const policy = raw?.data?.policy ?? raw;
      // Ensure content is always a markdown string, not raw JSON sections
      if (!policy.content && policy.sections && Array.isArray(policy.sections)) {
        policy.content = policy.sections
          .map((s: { title: string; content: string }) => `## ${s.title}\n\n${s.content}`)
          .join("\n\n");
        policy.sizeBytes = new TextEncoder().encode(policy.content).byteLength;
      }
      generatedPolicy = policy;
      pushToast({
        message: generatedPolicy?.reused ? "Policy retrieved from cache" : "Policy generated",
        variant: "success",
      });
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to generate policy", variant: "error" });
    } finally {
      generating = false;
    }
  }

  async function saveAsDraft() {
    if (!generatedPolicy) return;
    savingDraft = true;
    try {
      const tpl = templates.find((t) => t.key === selectedTemplate);
      const title = tpl ? (tpl.name.toLowerCase().includes("policy") ? tpl.name : `${tpl.name} Policy`) : "Generated Policy";
      // Map template key to a valid policy type for storage
      const typeMap: Record<string, string> = {
        "soc2.demo": "access_control",
        "soc2.access_control": "access_control",
        "iso27001.isms": "access_control",
        "nist.csf": "access_control",
        "hipaa.security": "data_handling",
        "dataprotection.general": "data_handling",
        "access_control": "access_control",
        "incident_response": "incident_response",
        "data_handling": "data_handling",
        "password": "password",
        "acceptable_use": "acceptable_use",
      };
      const policyType = typeMap[selectedTemplate] || "access_control";
      const res = await fetch("/api/policies/managed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: policyType,
          content: generatedPolicy.content,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      pushToast({ message: "Saved as draft", variant: "success" });
      showGenerate = false;
      generatedPolicy = null;
      await loadPolicies();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to save draft", variant: "error" });
    } finally {
      savingDraft = false;
    }
  }

  async function loadTenantUsers() {
    try {
      const res = await fetch("/api/directory?type=users&limit=100");
      if (res.ok) {
        const data = await res.json();
        tenantUsers = (data.items ?? data.users ?? [])
          .map((u: any) => ({ email: u.email, name: u.displayName ?? u.name }))
          .filter((u: any) => u.email);
      }
    } catch { /* silent */ }
  }

  function toggleReviewer(policyId: string, email: string) {
    if (!selectedReviewers[policyId]) selectedReviewers[policyId] = new Set();
    const set = selectedReviewers[policyId];
    if (set.has(email)) set.delete(email);
    else set.add(email);
    selectedReviewers = { ...selectedReviewers };
    // Sync to reviewerEmails for the submit function
    reviewerEmails[policyId] = Array.from(set).join(", ");
    reviewerEmails = { ...reviewerEmails };
  }

  onMount(() => {
    loadPolicies();
    loadTenantUsers();
    if ($session?.email) contactEmail = $session.email;
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Policies</h1>
      <p class="text-sm text-muted-foreground">
        Manage policy lifecycle: draft, review, approve, and archive compliance policies.
      </p>
    </div>
    <Button size="sm" on:click={openGenerate}>
      <Plus class="h-4 w-4 mr-1.5" />
      Generate New Policy
    </Button>
  </div>

  <!-- Generate panel -->
  {#if showGenerate}
    <Card>
      <CardHeader>
        <CardTitle>Generate Policy from Template</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if loadingTemplates}
          <Skeleton class="h-10 w-full rounded" />
        {:else}
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label htmlFor="gen-template">Policy Template</Label>
              <select
                id="gen-template"
                bind:value={selectedTemplate}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {#each templates as tpl}
                  <option value={tpl.key}>{tpl.name}</option>
                {/each}
              </select>
            </div>
            <div class="space-y-2">
              <Label htmlFor="gen-email">Contact Email</Label>
              <Input id="gen-email" type="email" bind:value={contactEmail} placeholder="security@company.com" />
            </div>
          </div>

          <div class="space-y-2">
            <Label htmlFor="gen-summary">Additional Context</Label>
            <textarea
              id="gen-summary"
              bind:value={genSummary}
              rows="3"
              placeholder="Provide any additional context for the policy..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            ></textarea>
          </div>

          <div class="flex gap-2 justify-end">
            <Button variant="outline" size="sm" on:click={() => { showGenerate = false; generatedPolicy = null; }}>
              Cancel
            </Button>
            <Button size="sm" on:click={generatePolicy} disabled={generating || !selectedTemplate}>
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>

          {#if generating}
            <div class="space-y-2 mt-2">
              <Skeleton class="h-5 w-2/5 rounded" />
              <Skeleton class="h-40 w-full rounded" />
            </div>
          {:else if generatedPolicy}
            <div class="border rounded-lg overflow-hidden mt-2">
              <div class="flex items-center justify-between px-4 py-2 bg-muted border-b">
                <span class="text-sm font-medium">Generated Content</span>
                <div class="flex items-center gap-2">
                  {#if generatedPolicy.reused}
                    <Badge variant="warning">cached</Badge>
                  {/if}
                  <span class="text-xs text-muted-foreground">{(generatedPolicy.sizeBytes / 1024).toFixed(1)} KB</span>
                  <Button size="sm" on:click={saveAsDraft} disabled={savingDraft}>
                    <FileText class="h-3 w-3 mr-1" />
                    {savingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                </div>
              </div>
              <pre class="p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-background max-h-64 overflow-y-auto">{generatedPolicy.content}</pre>
            </div>
          {/if}
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Policy list -->
  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else if policies.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        <FileText class="h-10 w-10 mx-auto mb-3 opacity-30" />
        No policies yet. Click "Generate New Policy" to create one.
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium w-6"></th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Approval</th>
                <th class="px-4 py-3 font-medium">Version</th>
                <th class="px-4 py-3 font-medium">Owner</th>
                <th class="px-4 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {#each policies as policy}
                <tr
                  class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                  on:click={() => toggleExpanded(policy.id)}
                >
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if expandedRows.has(policy.id)}
                      <ChevronUp class="h-4 w-4" />
                    {:else}
                      <ChevronDown class="h-4 w-4" />
                    {/if}
                  </td>
                  <td class="px-4 py-3 font-medium">{policy.title}</td>
                  <td class="px-4 py-3 text-muted-foreground">{typeLabel(policy.type)}</td>
                  <td class="px-4 py-3">
                    <Badge variant={statusVariant(policy.status)}>{statusLabel(policy.status)}</Badge>
                  </td>
                  <td class="px-4 py-3">
                    {#if policy.approvalSummary && policy.approvalSummary.total > 0}
                      {@const s = policy.approvalSummary}
                      <div class="flex items-center gap-1.5">
                        {#if s.approved === s.total}
                          <Badge variant="success" class="text-xs">All approved</Badge>
                        {:else if s.rejected > 0}
                          <Badge variant="destructive" class="text-xs">Rejected</Badge>
                        {:else if s.pending > 0}
                          <span class="text-xs text-muted-foreground">{s.approved}/{s.total - (s.total - s.approved - s.pending)} signed</span>
                        {:else}
                          <Badge variant="secondary" class="text-xs">{s.approved}/{s.total}</Badge>
                        {/if}
                      </div>
                    {:else}
                      <span class="text-xs text-muted-foreground">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">v{policy.version}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{policy.createdBy || "—"}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{fmtDate(policy.updatedAt)}</td>
                </tr>

                {#if expandedRows.has(policy.id)}
                  <tr class="border-t bg-muted/20">
                    <td colspan="8" class="px-6 py-5">
                      {#if loadingDetail.has(policy.id)}
                        <div class="space-y-2">
                          <Skeleton class="h-5 w-3/5 rounded" />
                          <Skeleton class="h-32 w-full rounded" />
                        </div>
                      {:else if detailCache[policy.id]}
                        {@const detail = detailCache[policy.id]}
                        <div class="space-y-5">

                          <!-- Content + version switcher -->
                          <div class="space-y-2">
                            <div class="flex items-center justify-between">
                              <span class="text-xs font-medium text-muted-foreground uppercase">Content</span>
                              {#if detail.versions?.length > 1}
                                <div class="flex items-center gap-1.5">
                                  <History class="h-3 w-3 text-muted-foreground" />
                                  <select
                                    class="h-7 rounded border border-input bg-background px-2 text-xs"
                                    value={selectedVersion[policy.id] ?? detail.version}
                                    on:change|stopPropagation={(e) => {
                                      selectedVersion[policy.id] = Number(e.currentTarget.value);
                                      selectedVersion = { ...selectedVersion };
                                    }}
                                  >
                                    {#each detail.versions as v}
                                      <option value={v.version}>v{v.version} — {fmtDate(v.createdAt)}</option>
                                    {/each}
                                  </select>
                                </div>
                              {/if}
                            </div>

                            {#if editingOpen.has(policy.id)}
                              <textarea
                                bind:value={editingContent[policy.id]}
                                rows="12"
                                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                              ></textarea>
                              <div class="flex gap-2" on:click|stopPropagation>
                                <Button
                                  size="sm"
                                  on:click={(e) => { e.stopPropagation(); saveEdit(policy); }}
                                  disabled={savingEdit.has(policy.id)}
                                >
                                  <Check class="h-3 w-3 mr-1" />
                                  {savingEdit.has(policy.id) ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  on:click={(e) => { e.stopPropagation(); editingOpen.delete(policy.id); editingOpen = new Set(editingOpen); }}
                                >
                                  <X class="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            {:else}
                              <pre class="bg-muted rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-72 overflow-y-auto">{visibleContent(detail, policy.id)}</pre>
                            {/if}
                          </div>

                          <!-- Version history list -->
                          {#if detail.versions?.length > 0}
                            <div class="space-y-1">
                              <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                <History class="h-3 w-3" /> Version History
                              </span>
                              <div class="divide-y rounded border text-xs">
                                {#each detail.versions as v}
                                  <button
                                    type="button"
                                    class="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-4 transition-colors {(selectedVersion[policy.id] ?? detail.version) === v.version ? 'bg-primary/5 font-medium' : ''}"
                                    on:click|stopPropagation={() => {
                                      selectedVersion[policy.id] = v.version;
                                      selectedVersion = { ...selectedVersion };
                                    }}
                                  >
                                    <span class="shrink-0">v{v.version}</span>
                                    <span class="text-muted-foreground shrink-0">{fmtDate(v.createdAt)}</span>
                                    {#if v.diffSummary}
                                      <span class="text-muted-foreground truncate">{v.diffSummary}</span>
                                    {/if}
                                  </button>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- Approvals -->
                          {#if detail.approvals?.length > 0}
                            {@const approvedCount = detail.approvals.filter(a => a.decision === "approved").length}
                            {@const pendingCount = detail.approvals.filter(a => a.decision === "pending").length}
                            {@const totalCount = detail.approvals.length}
                            <div class="space-y-1">
                              <div class="flex items-center gap-2">
                                <span class="text-xs font-medium text-muted-foreground uppercase">Approvals</span>
                                {#if policy.status === "pending_review" && totalCount > 1}
                                  <Badge variant="secondary" class="text-xs">{approvedCount}/{totalCount - (detail.approvals.filter(a => a.decision === "superseded").length)} approved</Badge>
                                {/if}
                              </div>
                              <div class="space-y-1.5">
                                {#each detail.approvals as approval}
                                  <div class="flex items-center gap-3 text-xs">
                                    {#if approval.decision === "approved"}
                                      <Check class="h-3 w-3 text-green-500 shrink-0" />
                                    {:else if approval.decision === "pending"}
                                      <Clock class="h-3 w-3 text-muted-foreground shrink-0" />
                                    {:else}
                                      <X class="h-3 w-3 text-destructive shrink-0" />
                                    {/if}
                                    <span class="font-medium">{approval.reviewerEmail}</span>
                                    <Badge variant={approval.decision === "approved" ? "success" : approval.decision === "pending" ? "secondary" : "destructive"}>
                                      {approval.decision === "changes_requested" ? "changes requested" : approval.decision}
                                    </Badge>
                                    {#if approval.comment}
                                      <span class="text-muted-foreground">{approval.comment}</span>
                                    {/if}
                                    {#if approval.decidedAt}
                                      <span class="text-muted-foreground ml-auto shrink-0">{fmtDate(approval.decidedAt)}</span>
                                    {/if}
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- Action bar -->
                          <div class="flex flex-wrap items-start gap-3 pt-2 border-t" on:click|stopPropagation>

                            <Button
                              size="sm"
                              variant="outline"
                              on:click={() => downloadPdf(detail)}
                            >
                              <Download class="h-3 w-3 mr-1" />
                              Download PDF
                            </Button>

                            {#if policy.status === "draft"}
                              <!-- Edit button -->
                              {#if !editingOpen.has(policy.id)}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  on:click={() => {
                                    editingContent[policy.id] = detail.content;
                                    editingOpen.add(policy.id);
                                    editingOpen = new Set(editingOpen);
                                  }}
                                >
                                  <Edit3 class="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              {/if}

                              <!-- Submit for review -->
                              {#if submitOpen.has(policy.id)}
                                <div class="space-y-2">
                                  {#if tenantUsers.length > 0}
                                    <div class="text-xs font-medium text-muted-foreground">Select reviewers from your team:</div>
                                    <div class="flex flex-wrap gap-1.5">
                                      {#each tenantUsers.filter(u => u.email !== $session?.email) as user}
                                        <button
                                          type="button"
                                          class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors {selectedReviewers[policy.id]?.has(user.email) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}"
                                          on:click|stopPropagation={() => toggleReviewer(policy.id, user.email)}
                                        >
                                          {user.name || user.email}
                                          {#if selectedReviewers[policy.id]?.has(user.email)}
                                            <Check class="h-3 w-3" />
                                          {/if}
                                        </button>
                                      {/each}
                                    </div>
                                  {/if}
                                  <div class="flex items-center gap-2 flex-wrap">
                                    <Input
                                      placeholder="Or type emails: reviewer@company.com, ..."
                                      bind:value={reviewerEmails[policy.id]}
                                      class="h-8 text-xs w-64"
                                    />
                                    <Button
                                      size="sm"
                                      on:click={() => submitForReview(policy)}
                                      disabled={submitting.has(policy.id) || !reviewerEmails[policy.id]?.trim()}
                                    >
                                      <Send class="h-3 w-3 mr-1" />
                                      {submitting.has(policy.id) ? "Submitting..." : "Submit"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      on:click={() => {
                                        submitOpen.delete(policy.id);
                                        submitOpen = new Set(submitOpen);
                                        selectedReviewers[policy.id] = new Set();
                                        selectedReviewers = { ...selectedReviewers };
                                      }}
                                    >
                                      <X class="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              {:else}
                                <Button
                                  size="sm"
                                  on:click={() => {
                                    submitOpen.add(policy.id);
                                    submitOpen = new Set(submitOpen);
                                  }}
                                >
                                  <Send class="h-3 w-3 mr-1" />
                                  Submit for Review
                                </Button>
                              {/if}

                            {:else if policy.status === "pending_review"}
                              <div class="flex items-center gap-2 flex-wrap">
                                <Badge variant="warning">Awaiting Review</Badge>
                                <Input
                                  placeholder="Optional comment..."
                                  bind:value={reviewComment[policy.id]}
                                  class="h-8 text-xs w-52"
                                />
                                <Button
                                  size="sm"
                                  on:click={() => reviewDecision(policy, "approved")}
                                  disabled={processingReview.has(policy.id)}
                                >
                                  <Check class="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  on:click={() => reviewDecision(policy, "changes_requested")}
                                  disabled={processingReview.has(policy.id)}
                                >
                                  <MessageSquare class="h-3 w-3 mr-1" />
                                  Request Changes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  on:click={() => reviewDecision(policy, "rejected")}
                                  disabled={processingReview.has(policy.id)}
                                >
                                  <X class="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>

                            {:else if policy.status === "approved"}
                              <Button
                                size="sm"
                                variant="outline"
                                on:click={() => archivePolicy(policy)}
                                disabled={archiving.has(policy.id)}
                              >
                                <Archive class="h-3 w-3 mr-1" />
                                {archiving.has(policy.id) ? "Archiving..." : "Archive"}
                              </Button>

                            {:else if policy.status === "archived"}
                              <span class="text-xs text-muted-foreground italic">Archived — read only</span>
                            {/if}

                          </div>
                        </div>
                      {:else}
                        <div class="flex items-center gap-2">
                          <p class="text-xs text-destructive italic">{detailErrors[policy.id] || 'Failed to load policy details.'}</p>
                          <button class="text-xs underline text-primary hover:text-primary/80" on:click|stopPropagation={() => retryLoadDetail(policy.id)}>Retry</button>
                        </div>
                      {/if}
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
