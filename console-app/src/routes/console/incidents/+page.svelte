<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ChevronDown, ChevronUp, Plus, Clock, User, MessageSquare, Send } from "lucide-svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  interface TimelineEntry {
    id: string;
    entryType: string;
    actorEmail: string | null;
    content: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }

  interface Incident {
    id: string;
    title: string;
    description?: string;
    severity: "critical" | "high" | "medium" | "low" | string;
    status: string;
    ownerEmail?: string | null;
    source?: string;
    sourceId?: string;
    slaBreachAt?: string | null;
    investigatingAt?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
  }

  let loading = true;
  let error: string | null = null;
  let incidents: Incident[] = [];
  let expandedRows = new Set<string>();
  let timelineCache: Record<string, TimelineEntry[]> = {};
  let loadingTimeline = new Set<string>();

  // Create incident form
  let showCreateForm = false;
  let newTitle = "";
  let newSeverity = "medium";
  let newDescription = "";
  let creating = false;

  // Comment form per incident
  let commentInputs: Record<string, string> = {};
  let submittingComment = new Set<string>();

  // Tenant team members for assignment
  let teamMembers: string[] = [];

  function severityVariant(severity: string): "destructive" | "warning" | "secondary" {
    if (severity === "critical" || severity === "high") return "destructive";
    if (severity === "medium") return "warning";
    return "secondary";
  }

  function statusVariant(status: string): "success" | "warning" | "secondary" | "destructive" {
    switch (status?.toLowerCase()) {
      case "resolved": case "closed": return "success";
      case "investigating": case "in_progress": return "warning";
      case "open": case "new": return "destructive";
      default: return "secondary";
    }
  }

  function isSlaBreached(incident: Incident): boolean {
    if (!incident.slaBreachAt || incident.status === "resolved") return false;
    return new Date(incident.slaBreachAt) <= new Date();
  }

  function slaTimeRemaining(incident: Incident): string | null {
    if (!incident.slaBreachAt || incident.status === "resolved") return null;
    const diff = new Date(incident.slaBreachAt).getTime() - Date.now();
    if (diff <= 0) return "Breached";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  function toggleExpanded(id: string) {
    if (expandedRows.has(id)) {
      expandedRows.delete(id);
    } else {
      expandedRows.add(id);
      loadTimeline(id);
    }
    expandedRows = new Set(expandedRows);
  }

  async function loadIncidents() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error(`Failed to load incidents (${res.status})`);
      const data = await res.json();
      incidents = Array.isArray(data?.items) ? data.items : [];
    } catch (e: any) {
      error = e?.message || "Failed to load incidents";
      incidents = [];
    } finally {
      loading = false;
    }
  }

  async function loadTimeline(incidentId: string) {
    if (timelineCache[incidentId] || loadingTimeline.has(incidentId)) return;
    loadingTimeline.add(incidentId);
    loadingTimeline = new Set(loadingTimeline);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        timelineCache[incidentId] = data.items ?? [];
        timelineCache = { ...timelineCache };
      }
    } catch { /* silent */ }
    loadingTimeline.delete(incidentId);
    loadingTimeline = new Set(loadingTimeline);
  }

  async function loadTeamMembers() {
    try {
      const res = await fetch("/api/directory?type=users&limit=100");
      if (res.ok) {
        const data = await res.json();
        teamMembers = (data.items ?? data.users ?? [])
          .map((u: any) => u.email)
          .filter(Boolean);
      }
    } catch { /* silent */ }
  }

  async function createIncident() {
    if (!newTitle.trim()) return;
    creating = true;
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          severity: newSeverity,
          description: newDescription.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      pushToast({ message: "Incident created", variant: "success" });
      newTitle = "";
      newDescription = "";
      newSeverity = "medium";
      showCreateForm = false;
      await loadIncidents();
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to create incident", variant: "error" });
    } finally {
      creating = false;
    }
  }

  async function updateStatus(incidentId: string, newStatus: string, comment?: string) {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update status`);
      }
      pushToast({ message: `Incident ${newStatus}`, variant: "success" });
      // Refresh incident in list
      const idx = incidents.findIndex((i) => i.id === incidentId);
      if (idx >= 0) {
        incidents[idx] = { ...incidents[idx], status: newStatus };
        incidents = [...incidents];
      }
      // Refresh timeline
      delete timelineCache[incidentId];
      timelineCache = { ...timelineCache };
      loadTimeline(incidentId);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to update status", variant: "error" });
    }
  }

  async function assignIncident(incidentId: string, ownerEmail: string) {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail }),
      });
      if (!res.ok) throw new Error("Failed to assign incident");
      pushToast({ message: `Assigned to ${ownerEmail}`, variant: "success" });
      const idx = incidents.findIndex((i) => i.id === incidentId);
      if (idx >= 0) {
        incidents[idx] = { ...incidents[idx], ownerEmail };
        incidents = [...incidents];
      }
      delete timelineCache[incidentId];
      timelineCache = { ...timelineCache };
      loadTimeline(incidentId);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to assign", variant: "error" });
    }
  }

  async function addComment(incidentId: string) {
    const content = commentInputs[incidentId]?.trim();
    if (!content) return;
    submittingComment.add(incidentId);
    submittingComment = new Set(submittingComment);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      commentInputs[incidentId] = "";
      commentInputs = { ...commentInputs };
      delete timelineCache[incidentId];
      timelineCache = { ...timelineCache };
      loadTimeline(incidentId);
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to add comment", variant: "error" });
    }
    submittingComment.delete(incidentId);
    submittingComment = new Set(submittingComment);
  }

  function timelineIcon(type: string): string {
    switch (type) {
      case "comment": return "💬";
      case "status_change": return "🔄";
      case "assignment": return "👤";
      case "sla_warning": return "⏰";
      case "auto_action": return "⚡";
      default: return "📝";
    }
  }

  onMount(() => {
    loadIncidents();
    loadTeamMembers();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Incidents</h1>
      <p class="text-sm text-muted-foreground">Track, investigate, and resolve security and operations incidents.</p>
    </div>
    <Button on:click={() => { showCreateForm = !showCreateForm; }} size="sm">
      <Plus class="h-4 w-4 mr-1.5" />
      New Incident
    </Button>
  </div>

  {#if showCreateForm}
    <Card>
      <CardContent class="pt-6 space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="inc-title" class="text-sm font-medium">Title</label>
            <input
              id="inc-title"
              bind:value={newTitle}
              placeholder="Brief incident summary..."
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div class="space-y-2">
            <label for="inc-severity" class="text-sm font-medium">Severity</label>
            <select
              id="inc-severity"
              bind:value={newSeverity}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div class="space-y-2">
          <label for="inc-desc" class="text-sm font-medium">Description</label>
          <textarea
            id="inc-desc"
            bind:value={newDescription}
            rows="3"
            placeholder="Describe the incident..."
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          ></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" on:click={() => { showCreateForm = false; }}>Cancel</Button>
          <Button size="sm" on:click={createIncident} disabled={creating || !newTitle.trim()}>
            {creating ? "Creating..." : "Create Incident"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

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
  {:else if incidents.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        No incidents found. Click "New Incident" to create one.
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
                <th class="px-4 py-3 font-medium">Severity</th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Owner</th>
                <th class="px-4 py-3 font-medium">SLA</th>
                <th class="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {#each incidents as incident}
                <tr
                  class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                  on:click={() => toggleExpanded(incident.id)}
                >
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if expandedRows.has(incident.id)}
                      <ChevronUp class="h-4 w-4" />
                    {:else}
                      <ChevronDown class="h-4 w-4" />
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant={severityVariant(incident.severity)} class="capitalize">{incident.severity}</Badge>
                  </td>
                  <td class="px-4 py-3 font-medium">{incident.title}</td>
                  <td class="px-4 py-3">
                    <Badge variant={statusVariant(incident.status)} class="capitalize">{incident.status}</Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">
                    {incident.ownerEmail || "—"}
                  </td>
                  <td class="px-4 py-3">
                    {#if incident.status !== "resolved"}
                      {#if isSlaBreached(incident)}
                        <Badge variant="destructive" class="text-xs">Breached</Badge>
                      {:else if slaTimeRemaining(incident)}
                        <span class="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock class="h-3 w-3" />
                          {slaTimeRemaining(incident)}
                        </span>
                      {:else}
                        <span class="text-xs text-muted-foreground">—</span>
                      {/if}
                    {:else}
                      <span class="text-xs text-muted-foreground">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-muted-foreground text-xs">{new Date(incident.createdAt).toLocaleString()}</td>
                </tr>
                {#if expandedRows.has(incident.id)}
                  <tr class="border-t bg-muted/30">
                    <td colspan="7" class="px-6 py-4">
                      <div class="space-y-4">
                        <!-- Incident details + actions -->
                        <div class="grid gap-4 sm:grid-cols-2">
                          <div>
                            <span class="text-xs font-medium text-muted-foreground uppercase">Description</span>
                            <p class="mt-1 text-sm">{incident.description || "No description provided."}</p>
                          </div>
                          <div class="space-y-3">
                            <!-- Status actions -->
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Actions</span>
                              <div class="flex gap-2 mt-1">
                                {#if incident.status === "open"}
                                  <Button size="sm" variant="outline" on:click={(e) => { e.stopPropagation(); updateStatus(incident.id, "investigating"); }}>
                                    Investigate
                                  </Button>
                                  <Button size="sm" variant="outline" on:click={(e) => { e.stopPropagation(); updateStatus(incident.id, "resolved"); }}>
                                    Resolve
                                  </Button>
                                {:else if incident.status === "investigating"}
                                  <Button size="sm" variant="outline" on:click={(e) => { e.stopPropagation(); updateStatus(incident.id, "resolved"); }}>
                                    Resolve
                                  </Button>
                                {:else}
                                  <span class="text-xs text-muted-foreground italic">Resolved</span>
                                {/if}
                              </div>
                            </div>

                            <!-- Assignment -->
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Assign to</span>
                              <div class="mt-1">
                                {#if teamMembers.length > 0}
                                  <select
                                    class="h-8 rounded-md border border-input bg-background px-2 text-xs w-full max-w-xs"
                                    value={incident.ownerEmail || ""}
                                    on:change|stopPropagation={(e) => {
                                      const val = e.currentTarget.value;
                                      if (val) assignIncident(incident.id, val);
                                    }}
                                  >
                                    <option value="">Unassigned</option>
                                    {#each teamMembers as email}
                                      <option value={email}>{email}</option>
                                    {/each}
                                  </select>
                                {:else}
                                  <span class="text-xs text-muted-foreground">{incident.ownerEmail || "Unassigned"}</span>
                                {/if}
                              </div>
                            </div>

                            <!-- Metadata -->
                            <div class="flex gap-4 text-xs text-muted-foreground">
                              {#if incident.source}
                                <span>Source: {incident.source}</span>
                              {/if}
                              {#if incident.resolvedAt}
                                <span>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>
                              {/if}
                              <span class="font-mono">{incident.id.slice(0, 12)}...</span>
                            </div>
                          </div>
                        </div>

                        <!-- Timeline -->
                        <div>
                          <span class="text-xs font-medium text-muted-foreground uppercase">Timeline</span>
                          <div class="mt-2 space-y-2 max-h-64 overflow-y-auto">
                            {#if loadingTimeline.has(incident.id)}
                              <Skeleton class="h-8 rounded" />
                            {:else if timelineCache[incident.id]?.length}
                              {#each timelineCache[incident.id] as entry}
                                <div class="flex gap-2 text-xs border-l-2 border-border pl-3 py-1">
                                  <span>{timelineIcon(entry.entryType)}</span>
                                  <div class="flex-1">
                                    <span class="font-medium">{entry.actorEmail || "System"}</span>
                                    <span class="text-muted-foreground ml-1">{entry.content}</span>
                                    <span class="text-muted-foreground ml-2">{new Date(entry.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              {/each}
                            {:else}
                              <p class="text-xs text-muted-foreground italic">No timeline entries yet.</p>
                            {/if}
                          </div>

                          <!-- Add comment -->
                          {#if incident.status !== "resolved"}
                            <div class="flex gap-2 mt-2" on:click|stopPropagation>
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                bind:value={commentInputs[incident.id]}
                                on:keydown={(e) => { if (e.key === "Enter") addComment(incident.id); }}
                                class="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                on:click={(e) => { e.stopPropagation(); addComment(incident.id); }}
                                disabled={submittingComment.has(incident.id) || !commentInputs[incident.id]?.trim()}
                              >
                                <Send class="h-3 w-3" />
                              </Button>
                            </div>
                          {/if}
                        </div>
                      </div>
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
