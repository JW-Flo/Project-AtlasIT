<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import {
    Activity, AlertTriangle, RotateCw, ChevronDown, ChevronRight,
    Inbox, CheckCircle, XCircle, Clock,
  } from "lucide-svelte";

  // ── Types ──────────────────────────────────────────────────────────

  interface DlqEntry {
    id: string;
    eventType: string;
    agentId: string;
    tenantId: string;
    attempts: number;
    deadLetteredAt: string;
    replayStatus: string | null;
    replayedAt: string | null;
    eventPayload: unknown;
  }

  interface WorkflowRun {
    id: string;
    type: string;
    status: string;
    email: string;
    userId: string | null;
    trigger: string | null;
    startedAt: string;
    completedAt: string | null;
    stepsDone: number;
    stepsTotal: number;
    durationMs: number | null;
    error: string | null;
    context: string | null;
  }

  // ── State ──────────────────────────────────────────────────────────

  let activeTab = "dlq";

  let dlqEntries: DlqEntry[] = [];
  let dlqLoading = true;
  let dlqError = "";
  let expandedDlq: string | null = null;
  let replayingIds = new Set<string>();

  let runs: WorkflowRun[] = [];
  let runsLoading = true;
  let runsError = "";
  let expandedRun: string | null = null;

  // ── Helpers ────────────────────────────────────────────────────────

  function truncateId(id: string): string {
    return id.length > 12 ? id.slice(0, 12) + "..." : id;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function dlqBadgeVariant(entry: DlqEntry): "destructive" | "success" | "warning" {
    if (!entry.replayStatus) return "destructive";
    if (entry.replayStatus === "success") return "success";
    return "warning";
  }

  function dlqBadgeLabel(entry: DlqEntry): string {
    if (!entry.replayStatus) return "Unreplayed";
    if (entry.replayStatus === "success") return "Replayed";
    return "Replay Failed";
  }

  function runStatusVariant(status: string): "success" | "default" | "destructive" | "warning" | "info" {
    switch (status) {
      case "completed": return "success";
      case "running": return "info";
      case "failed": return "destructive";
      case "compensating": return "warning";
      default: return "default";
    }
  }

  function runStatusColor(status: string): string {
    switch (status) {
      case "completed": return "text-green-600 dark:text-green-400";
      case "running": return "text-blue-600 dark:text-blue-400";
      case "failed": return "text-red-600 dark:text-red-400";
      case "compensating": return "text-orange-600 dark:text-orange-400";
      default: return "text-muted-foreground";
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────

  async function loadDlq() {
    dlqLoading = true;
    dlqError = "";
    try {
      const res = await fetch("/api/dead-letter?limit=25");
      if (!res.ok) throw new Error(`Failed to load DLQ (${res.status})`);
      const data = await res.json();
      dlqEntries = data.entries ?? data.items ?? data ?? [];
    } catch (e: any) {
      dlqError = e?.message || "Failed to load dead letter entries";
    } finally {
      dlqLoading = false;
    }
  }

  async function loadRuns() {
    runsLoading = true;
    runsError = "";
    try {
      const res = await fetch("/api/jml/runs?limit=25");
      if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
      const data = await res.json();
      runs = data.runs ?? [];
    } catch (e: any) {
      runsError = e?.message || "Failed to load workflow runs";
    } finally {
      runsLoading = false;
    }
  }

  async function replayEntry(id: string) {
    replayingIds.add(id);
    replayingIds = replayingIds;
    try {
      const res = await fetch(`/api/dead-letter/${id}`, { method: "POST" });
      if (!res.ok) throw new Error(`Replay failed (${res.status})`);
      pushToast({ message: "Replay initiated", variant: "success" });
      await loadDlq();
    } catch (e: any) {
      pushToast({ message: e?.message || "Replay failed", variant: "error" });
    } finally {
      replayingIds.delete(id);
      replayingIds = replayingIds;
    }
  }

  function toggleDlqExpand(id: string) {
    expandedDlq = expandedDlq === id ? null : id;
  }

  function toggleRunExpand(id: string) {
    expandedRun = expandedRun === id ? null : id;
  }

  onMount(() => {
    loadDlq();
    loadRuns();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Operations</h1>
      <p class="text-sm text-muted-foreground">Monitor dead letter queue and workflow runs</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Activity class="h-5 w-5 text-primary" />
    </div>
  </div>

  <!-- Tabs -->
  <Tabs bind:value={activeTab}>
    <TabsList>
      <TabsTrigger value="dlq" active={activeTab === "dlq"} on:click={() => activeTab = "dlq"}>Dead Letter Queue</TabsTrigger>
      <TabsTrigger value="runs" active={activeTab === "runs"} on:click={() => activeTab = "runs"}>Workflow Runs</TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Tab 1: Dead Letter Queue -->
  {#if activeTab === "dlq"}
    {#if dlqError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{dlqError}</p>
      </Alert>
    {/if}

    {#if dlqLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-16 rounded-lg" />
        {/each}
      </div>
    {:else if dlqEntries.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <Inbox class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No dead letter entries — all workflow steps completed successfully</p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-3 sm:px-4 py-3 font-medium w-8"></th>
                  <th class="px-3 sm:px-4 py-3 font-medium">ID</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Event Type</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Agent</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Tenant</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Attempts</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">Dead-lettered</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Status</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each dlqEntries as entry}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-3 sm:px-4 py-3">
                      <button
                        class="text-muted-foreground hover:text-foreground transition-colors"
                        on:click={() => toggleDlqExpand(entry.id)}
                        aria-label="Toggle details"
                      >
                        {#if expandedDlq === entry.id}
                          <ChevronDown class="h-4 w-4" />
                        {:else}
                          <ChevronRight class="h-4 w-4" />
                        {/if}
                      </button>
                    </td>
                    <td class="px-3 sm:px-4 py-3 font-mono text-xs" title={entry.id}>{truncateId(entry.id)}</td>
                    <td class="px-3 sm:px-4 py-3">{entry.eventType}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">{entry.agentId}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{truncateId(entry.tenantId)}</td>
                    <td class="px-3 sm:px-4 py-3 text-center">{entry.attempts}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{timeAgo(entry.deadLetteredAt)}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant={dlqBadgeVariant(entry)}>{dlqBadgeLabel(entry)}</Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={replayingIds.has(entry.id)}
                        on:click={() => replayEntry(entry.id)}
                      >
                        <RotateCw class="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    </td>
                  </tr>
                  {#if expandedDlq === entry.id}
                    <tr class="bg-muted/30">
                      <td colspan="9" class="px-4 py-4">
                        <div class="text-xs font-medium text-muted-foreground mb-2">Event Payload</div>
                        <pre class="text-xs bg-background rounded-md p-3 overflow-x-auto max-h-64 border">{JSON.stringify(entry.eventPayload, null, 2)}</pre>
                        {#if entry.replayedAt}
                          <div class="mt-2 text-xs text-muted-foreground">
                            Replayed at: {formatDate(entry.replayedAt)}
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

    <div class="flex justify-end">
      <Button variant="outline" size="sm" on:click={loadDlq} disabled={dlqLoading}>
        <RotateCw class="h-3 w-3 mr-1" />
        Refresh
      </Button>
    </div>
  {/if}

  <!-- Tab 2: Workflow Runs -->
  {#if activeTab === "runs"}
    {#if runsError}
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <p class="pl-7">{runsError}</p>
      </Alert>
    {/if}

    {#if runsLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as _}
          <Skeleton class="h-16 rounded-lg" />
        {/each}
      </div>
    {:else if runs.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <CheckCircle class="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p class="text-muted-foreground">No workflow runs found</p>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-3 sm:px-4 py-3 font-medium w-8"></th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Run ID</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Type</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">User Email</th>
                  <th class="px-3 sm:px-4 py-3 font-medium">Status</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Steps</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Started</th>
                  <th class="px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Completed</th>
                </tr>
              </thead>
              <tbody>
                {#each runs as run}
                  <tr class="border-t hover:bg-muted/50">
                    <td class="px-3 sm:px-4 py-3">
                      <button
                        class="text-muted-foreground hover:text-foreground transition-colors"
                        on:click={() => toggleRunExpand(run.id)}
                        aria-label="Toggle details"
                      >
                        {#if expandedRun === run.id}
                          <ChevronDown class="h-4 w-4" />
                        {:else}
                          <ChevronRight class="h-4 w-4" />
                        {/if}
                      </button>
                    </td>
                    <td class="px-3 sm:px-4 py-3 font-mono text-xs" title={run.id}>{truncateId(run.id)}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant="outline">{run.type}</Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{run.email || run.userId || "—"}</td>
                    <td class="px-3 sm:px-4 py-3">
                      <Badge variant={runStatusVariant(run.status)} class="capitalize">
                        {run.status}
                      </Badge>
                    </td>
                    <td class="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <span class="text-muted-foreground">{run.stepsDone}/{run.stepsTotal}</span>
                    </td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{timeAgo(run.startedAt)}</td>
                    <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden lg:table-cell">{run.completedAt ? timeAgo(run.completedAt) : "-"}</td>
                  </tr>
                  {#if expandedRun === run.id}
                    <tr class="bg-muted/30">
                      <td colspan="8" class="px-4 py-4">
                        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span class="font-medium text-muted-foreground">Run ID:</span>
                            <span class="font-mono ml-1">{run.id}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Subject:</span>
                            <span class="ml-1">{run.email || run.userId || "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Trigger:</span>
                            <span class="ml-1">{run.trigger || "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Started:</span>
                            <span class="ml-1">{formatDate(run.startedAt)}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Completed:</span>
                            <span class="ml-1">{formatDate(run.completedAt)}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Duration:</span>
                            <span class="ml-1">{run.durationMs ? `${run.durationMs}ms` : "—"}</span>
                          </div>
                          <div>
                            <span class="font-medium text-muted-foreground">Progress:</span>
                            <span class="ml-1">{run.stepsDone ?? 0} of {run.stepsTotal ?? 0} steps</span>
                          </div>
                          {#if run.error}
                            <div class="col-span-2">
                              <span class="font-medium text-red-500">Error:</span>
                              <span class="ml-1 text-red-500">{run.error}</span>
                            </div>
                          {/if}
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

    <div class="flex justify-end">
      <Button variant="outline" size="sm" on:click={loadRuns} disabled={runsLoading}>
        <RotateCw class="h-3 w-3 mr-1" />
        Refresh
      </Button>
    </div>
  {/if}
</div>
