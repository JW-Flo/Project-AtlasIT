<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import {
    AlertTriangle, Plus, FileText, ChevronDown, ChevronUp,
    Send, Check, X, Archive, History, Edit3,
  } from "lucide-svelte";

  interface PolicySummary {
    id: string;
    title: string;
    type: string;
    version: number;
    status: string;
    createdBy: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface PolicyVersion {
    id: string;
    version: number;
    content: string;
    diffSummary: string | null;
    createdBy: string;
    createdAt: string;
  }

  interface PolicyApproval {
    id: string;
    reviewerEmail: string;
    decision: string | null;
    comment: string | null;
    decidedAt: string | null;
  }

  interface PolicyDetail {
    policy: PolicySummary & { content: string };
    versions: PolicyVersion[];
    approvals: PolicyApproval[];
  }

  const TYPE_LABELS: Record<string, string> = {
    access_control: "Access Control",
    incident_response: "Incident Response",
    data_handling: "Data Handling",
    password: "Password",
    acceptable_use: "Acceptable Use",
  };

  let loading = true;
  let error: string | null = null;
  let policies: PolicySummary[] = [];
  let expandedId: string | null = null;
  let detailCache: Record<string, PolicyDetail> = {};
  let loadingDetail = new Set<string>();

  // Create / Generate form
  let showCreateForm = false;
  let newTitle = "";
  let newType = "access_control";
  let newContent = "";
  let creating = false;
  let aiGenerating = false;

  // Submit for review
  let reviewerEmail = "";

  // Edit mode
  let editingId: string | null = null;
  let editContent = "";

  function statusVariant(status: string): "success" | "warning" | "secondary" | "destructive" {
    switch (status) {
      case "approved": return "success";
      case "pending_review": return "warning";
      case "draft": return "secondary";
      case "archived": return "secondary";
      default: return "secondary";
    }
  }

  function statusLabel(status: string): string {
    return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function loadPolicies() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/policies/managed");
      if (!res.ok) throw new Error(`Failed to load policies (${res.status})`);
      const data = await res.json();
      policies = data.items ?? [];
    } catch (e: any) {
      error = e?.message || "Failed to load policies";
      policies = [];
    } finally {
      loading = false;
    }
  }

  async function loadDetail(id: string) {
    if (detailCache[id] || loadingDetail.has(id)) return;
    loadingDetail.add(id);
    loadingDetail = new Set(loadingDetail);
    try {
      const res = await fetch(`/api/policies/${id}`);
      if (res.ok) {
        detailCache[id] = await res.json();
        detailCache = { ...detailCache };
      }
    } catch { /* silent */ }
    loadingDetail.delete(id);
    loadingDetail = new Set(loadingDetail);
  }

  function toggleExpanded(id: string) {
    if (expandedId === id) {
      expandedId = null;
    } else {
      expandedId = id;
      loadDetail(id);
    }
  }

  async function generatePolicy() {
    aiGenerating = true;
    try {
      const res = await fetch("/api/policies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: newType }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      const content = data?.data?.policy?.sections
        ?.map((s: any) => `## ${s.title}\n\n${s.content}`)
        .join("\n\n") ?? data?.data?.policy?.content ?? "";
      newContent = content || "Policy generation returned no content.";
      newTitle = TYPE_LABELS[newType] || "Security Policy";
      pushToast({ message: "Policy generated — review and save as draft", variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Generation failed", variant: "error" });
    } finally {
      aiGenerating = false;
    }
  }

  async function createPolicy() {
    if (!newTitle.trim() || !newContent.trim()) return;
    creating = true;
    try {
      const res = await fetch("/api/policies/managed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), type: newType, content: newContent.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      pushToast({ message: "Policy draft created", variant: "success" });
      newTitle = ""; newContent = ""; showCreateForm = false;
      await loadPolicies();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to create", variant: "error" });
    } finally {
      creating = false;
    }
  }

  async function submitForReview(id: string) {
    if (!reviewerEmail.trim()) {
      pushToast({ message: "Enter a reviewer email", variant: "error" });
      return;
    }
    try {
      const res = await fetch(`/api/policies/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerEmails: [reviewerEmail.trim()] }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Submit failed"); }
      pushToast({ message: "Submitted for review", variant: "success" });
      reviewerEmail = "";
      delete detailCache[id];
      detailCache = { ...detailCache };
      await loadPolicies();
      loadDetail(id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Submit failed", variant: "error" });
    }
  }

  async function reviewPolicy(id: string, decision: string, comment?: string) {
    try {
      const res = await fetch(`/api/policies/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Review failed"); }
      pushToast({ message: `Policy ${decision}`, variant: "success" });
      delete detailCache[id];
      detailCache = { ...detailCache };
      await loadPolicies();
      loadDetail(id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Review failed", variant: "error" });
    }
  }

  async function archivePolicy(id: string) {
    try {
      const res = await fetch(`/api/policies/${id}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("Archive failed");
      pushToast({ message: "Policy archived", variant: "success" });
      delete detailCache[id];
      detailCache = { ...detailCache };
      await loadPolicies();
    } catch (e: any) {
      pushToast({ message: e?.message || "Archive failed", variant: "error" });
    }
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim(), diffSummary: "Manual edit" }),
      });
      if (!res.ok) throw new Error("Update failed");
      pushToast({ message: "Policy updated", variant: "success" });
      editingId = null;
      delete detailCache[id];
      detailCache = { ...detailCache };
      await loadPolicies();
      loadDetail(id);
    } catch (e: any) {
      pushToast({ message: e?.message || "Update failed", variant: "error" });
    }
  }

  onMount(loadPolicies);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Policy Manager</h1>
      <p class="text-sm text-muted-foreground">Generate, review, and approve security policies.</p>
    </div>
    <Button on:click={() => { showCreateForm = !showCreateForm; }} size="sm">
      <Plus class="h-4 w-4 mr-1.5" />
      New Policy
    </Button>
  </div>

  {#if showCreateForm}
    <Card>
      <CardContent class="pt-6 space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="pol-title" class="text-sm font-medium">Title</label>
            <input id="pol-title" bind:value={newTitle} placeholder="Policy title..."
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div class="space-y-2">
            <label for="pol-type" class="text-sm font-medium">Type</label>
            <select id="pol-type" bind:value={newType}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="access_control">Access Control</option>
              <option value="incident_response">Incident Response</option>
              <option value="data_handling">Data Handling</option>
              <option value="password">Password</option>
              <option value="acceptable_use">Acceptable Use</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <Button size="sm" variant="outline" on:click={generatePolicy} disabled={aiGenerating}>
            {aiGenerating ? "Generating..." : "AI Generate"}
          </Button>
        </div>
        {#if newContent}
          <div class="space-y-2">
            <label class="text-sm font-medium">Content</label>
            <textarea bind:value={newContent} rows="12"
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            ></textarea>
          </div>
        {/if}
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" on:click={() => { showCreateForm = false; newContent = ""; }}>Cancel</Button>
          <Button size="sm" on:click={createPolicy} disabled={creating || !newTitle.trim() || !newContent.trim()}>
            {creating ? "Saving..." : "Save as Draft"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}<Skeleton class="h-14 rounded-lg" />{/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" /><p class="pl-7">{error}</p>
    </Alert>
  {:else if policies.length === 0 && !showCreateForm}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        No policies yet. Click "New Policy" to generate one with AI or create manually.
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
                <th class="px-4 py-3 font-medium">Version</th>
                <th class="px-4 py-3 font-medium">Owner</th>
                <th class="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {#each policies as policy}
                <tr class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                    on:click={() => toggleExpanded(policy.id)}>
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if expandedId === policy.id}<ChevronUp class="h-4 w-4" />{:else}<ChevronDown class="h-4 w-4" />{/if}
                  </td>
                  <td class="px-4 py-3 font-medium">{policy.title}</td>
                  <td class="px-4 py-3 text-muted-foreground">{TYPE_LABELS[policy.type] || policy.type}</td>
                  <td class="px-4 py-3"><Badge variant={statusVariant(policy.status)}>{statusLabel(policy.status)}</Badge></td>
                  <td class="px-4 py-3 text-muted-foreground">v{policy.version}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{policy.createdBy || "—"}</td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{new Date(policy.updatedAt).toLocaleDateString()}</td>
                </tr>
                {#if expandedId === policy.id}
                  <tr class="border-t bg-muted/30">
                    <td colspan="7" class="px-6 py-4" on:click|stopPropagation>
                      {#if loadingDetail.has(policy.id)}
                        <Skeleton class="h-32 rounded" />
                      {:else if detailCache[policy.id]}
                        {@const detail = detailCache[policy.id]}
                        <div class="space-y-4">
                          <!-- Actions -->
                          <div class="flex gap-2 flex-wrap">
                            {#if policy.status === "draft"}
                              <Button size="sm" variant="outline" on:click={() => { editingId = policy.id; editContent = detail.policy.content; }}>
                                <Edit3 class="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <div class="flex gap-1 items-center">
                                <input type="email" placeholder="reviewer@example.com" bind:value={reviewerEmail}
                                  class="h-8 rounded-md border border-input bg-background px-2 text-xs w-48" />
                                <Button size="sm" variant="outline" on:click={() => submitForReview(policy.id)}>
                                  <Send class="h-3 w-3 mr-1" /> Submit for Review
                                </Button>
                              </div>
                            {:else if policy.status === "pending_review"}
                              <Button size="sm" variant="outline" on:click={() => reviewPolicy(policy.id, "approved")}>
                                <Check class="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" on:click={() => reviewPolicy(policy.id, "rejected")}>
                                <X class="h-3 w-3 mr-1" /> Reject
                              </Button>
                              <Button size="sm" variant="outline" on:click={() => reviewPolicy(policy.id, "changes_requested")}>
                                Changes Requested
                              </Button>
                            {:else if policy.status === "approved"}
                              <Button size="sm" variant="outline" on:click={() => archivePolicy(policy.id)}>
                                <Archive class="h-3 w-3 mr-1" /> Archive
                              </Button>
                              {#if detail.policy.approvedBy}
                                <span class="text-xs text-muted-foreground">Approved by {detail.policy.approvedBy} on {new Date(detail.policy.approvedAt || "").toLocaleDateString()}</span>
                              {/if}
                            {:else}
                              <span class="text-xs text-muted-foreground italic">Archived</span>
                            {/if}
                          </div>

                          <!-- Approvals -->
                          {#if detail.approvals.length > 0}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Reviews</span>
                              <div class="mt-1 space-y-1">
                                {#each detail.approvals as a}
                                  <div class="flex gap-2 text-xs items-center">
                                    <span class="font-medium">{a.reviewerEmail}</span>
                                    {#if a.decision === "approved"}
                                      <Badge variant="success" class="text-[10px]">Approved</Badge>
                                    {:else if a.decision === "rejected"}
                                      <Badge variant="destructive" class="text-[10px]">Rejected</Badge>
                                    {:else if a.decision === "changes_requested"}
                                      <Badge variant="warning" class="text-[10px]">Changes Requested</Badge>
                                    {:else}
                                      <Badge variant="secondary" class="text-[10px]">Pending</Badge>
                                    {/if}
                                    {#if a.comment}<span class="text-muted-foreground">— {a.comment}</span>{/if}
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- Content / Edit -->
                          {#if editingId === policy.id}
                            <div class="space-y-2">
                              <textarea bind:value={editContent} rows="15"
                                class="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              ></textarea>
                              <div class="flex gap-2">
                                <Button size="sm" on:click={() => saveEdit(policy.id)}>Save</Button>
                                <Button size="sm" variant="outline" on:click={() => { editingId = null; }}>Cancel</Button>
                              </div>
                            </div>
                          {:else}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Content (v{detail.policy.version})</span>
                              <pre class="mt-1 text-xs whitespace-pre-wrap bg-background border rounded-md p-3 max-h-64 overflow-y-auto">{detail.policy.content}</pre>
                            </div>
                          {/if}

                          <!-- Version history -->
                          {#if detail.versions.length > 1}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                <History class="h-3 w-3" /> Version History
                              </span>
                              <div class="mt-1 space-y-1">
                                {#each detail.versions as v}
                                  <div class="flex gap-3 text-xs border-l-2 border-border pl-3 py-1">
                                    <span class="font-medium">v{v.version}</span>
                                    <span class="text-muted-foreground">{v.diffSummary || "—"}</span>
                                    <span class="text-muted-foreground">{v.createdBy}</span>
                                    <span class="text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <p class="text-sm text-muted-foreground">Failed to load policy details.</p>
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
