<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ChevronDown, ChevronUp, Plus } from "lucide-svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";

  interface Incident {
    id: string;
    title: string;
    description?: string;
    severity: "critical" | "high" | "medium" | "low" | string;
    status: string;
    assignee?: string;
    source?: string;
    resolvedAt?: string;
    createdAt: string;
  }

  let loading = true;
  let error: string | null = null;
  let incidents: Incident[] = [];
  let expandedRows = new Set<string>();

  // Create incident form
  let showCreateForm = false;
  let newTitle = "";
  let newSeverity = "medium";
  let newDescription = "";
  let creating = false;

  function severityVariant(
    severity: string,
  ): "destructive" | "warning" | "secondary" {
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

  function toggleExpanded(id: string) {
    if (expandedRows.has(id)) expandedRows.delete(id);
    else expandedRows.add(id);
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

  onMount(loadIncidents);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Incidents</h1>
      <p class="text-sm text-muted-foreground">Track security and operations incidents.</p>
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
                  <td class="px-4 py-3 text-muted-foreground">{new Date(incident.createdAt).toLocaleString()}</td>
                </tr>
                {#if expandedRows.has(incident.id)}
                  <tr class="border-t bg-muted/30">
                    <td colspan="5" class="px-6 py-4">
                      <div class="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <span class="text-xs font-medium text-muted-foreground uppercase">Description</span>
                          <p class="mt-1">{incident.description || "No description provided."}</p>
                        </div>
                        <div class="space-y-2">
                          {#if incident.assignee}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Assignee</span>
                              <p class="mt-1">{incident.assignee}</p>
                            </div>
                          {/if}
                          {#if incident.source}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Source</span>
                              <p class="mt-1">{incident.source}</p>
                            </div>
                          {/if}
                          {#if incident.resolvedAt}
                            <div>
                              <span class="text-xs font-medium text-muted-foreground uppercase">Resolved</span>
                              <p class="mt-1">{new Date(incident.resolvedAt).toLocaleString()}</p>
                            </div>
                          {/if}
                          <div>
                            <span class="text-xs font-medium text-muted-foreground uppercase">ID</span>
                            <p class="mt-1 text-xs text-muted-foreground font-mono">{incident.id}</p>
                          </div>
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
