<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { AlertTriangle } from "lucide-svelte";

  type RunStatus = "success" | "failed" | "skipped";

  interface AutomationExecution {
    id: string;
    ruleName: string | null;
    triggerEvent: unknown;
    status: RunStatus;
    startedAt: string;
    completedAt: string | null;
    affectedUserEmail: string | null;
  }

  interface ExecutionDetail {
    id: string;
    ruleName: string;
    triggerType?: string;
    status: string;
    durationMs?: number;
    startedAt: string;
    completedAt?: string | null;
    results: Array<{ actionType: string; status: string; message?: string }>;
  }

  let loading = true;
  let error: string | null = null;
  let runs: AutomationExecution[] = [];
  let selectedExecution: ExecutionDetail | null = null;
  let loadingDetail = false;

  let statusFilter: "all" | RunStatus = "all";
  let limit = 25;
  let offset = 0;
  let total = 0;

  $: pageStart = total === 0 ? 0 : offset + 1;
  $: pageEnd = Math.min(offset + limit, total);
  $: canPrev = offset > 0;
  $: canNext = offset + limit < total;

  function statusVariant(status: RunStatus): "success" | "destructive" | "secondary" {
    if (status === "success") return "success";
    if (status === "failed") return "destructive";
    return "secondary";
  }

  function triggerLabel(value: unknown): string {
    if (!value) return "manual";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return String(obj.type ?? obj.event ?? obj.name ?? "trigger");
    }
    return "trigger";
  }

  function durationLabel(startedAt: string, completedAt: string | null): string {
    if (!startedAt || !completedAt) return "--";

    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "--";

    const ms = end - start;
    if (ms < 1000) return `${ms}ms`;
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min}m ${rem}s`;
  }

  function relativeTime(iso: string): string {
    if (!iso) return "--";
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return "--";

    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  async function loadRuns() {
    loading = true;
    error = null;

    const statusParam = statusFilter === "all" ? "" : `&status=${statusFilter}`;
    const url = `/api/automation/executions?limit=${limit}&offset=${offset}${statusParam}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
      const payload = await res.json();

      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.executions)
          ? payload.executions
          : [];

      const meta = payload?.meta ?? {};

      runs = data.map((row: any) => ({
        id: row.id,
        ruleName: row.ruleName ?? null,
        triggerEvent: row.triggerEvent ?? row.trigger_event ?? null,
        status: row.status,
        startedAt: row.startedAt ?? row.created_at ?? "",
        completedAt: row.completedAt ?? row.completed_at ?? null,
        affectedUserEmail: row.affectedUserEmail ?? row.affected_user_email ?? null,
      }));

      total = Number(meta.total ?? payload?.total ?? runs.length);
      limit = Number(meta.limit ?? limit);
      offset = Number(meta.offset ?? offset);
    } catch (e: any) {
      error = e?.message || "Failed to load automation runs";
      runs = [];
      total = 0;
    } finally {
      loading = false;
    }
  }

  function applyStatusFilter(value: "all" | RunStatus) {
    statusFilter = value;
    offset = 0;
    loadRuns();
  }

  function prevPage() {
    if (!canPrev) return;
    offset = Math.max(0, offset - limit);
    loadRuns();
  }

  function nextPage() {
    if (!canNext) return;
    offset += limit;
    loadRuns();
  }

  async function viewExecution(run: AutomationExecution) {
    loadingDetail = true;
    selectedExecution = null;
    try {
      const res = await fetch(`/api/automation/executions/${run.id}`);
      if (res.ok) {
        const data: any = await res.json();
        selectedExecution = data.execution ?? data;
      } else {
        pushToast({ message: "Failed to load execution details", variant: "error" });
      }
    } catch {
      pushToast({ message: "Failed to load execution details", variant: "error" });
    } finally {
      loadingDetail = false;
    }
  }

  function closeExecutionDetail() {
    selectedExecution = null;
    loadingDetail = false;
  }

  function actionTypeLabel(type: string): string {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  onMount(loadRuns);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Automation Runs</h1>
      <p class="text-sm text-muted-foreground">Execution log for automation rules across your tenant.</p>
    </div>

    <div class="flex items-center gap-2">
      <label class="text-sm text-muted-foreground" for="status-filter">Status</label>
      <select
        id="status-filter"
        bind:value={statusFilter}
        on:change={(e) => applyStatusFilter(e.currentTarget.value as "all" | RunStatus)}
        class="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">All</option>
        <option value="success">Success</option>
        <option value="failed">Failed</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3, 4] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {:else}
    <Card>
      <CardContent class="p-0">
        {#if runs.length === 0}
          <div class="px-5 py-10 text-center text-sm text-muted-foreground">No automation runs found for this filter.</div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-4 py-3 font-medium">Rule</th>
                  <th class="px-4 py-3 font-medium">Trigger</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">Duration</th>
                  <th class="px-4 py-3 font-medium">Affected User</th>
                  <th class="px-4 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {#each runs as run}
                  <tr class="border-t hover:bg-muted/40 cursor-pointer" on:click={() => viewExecution(run)}>
                    <td class="px-4 py-3 font-medium">{run.ruleName || "Unnamed rule"}</td>
                    <td class="px-4 py-3 text-muted-foreground">{triggerLabel(run.triggerEvent)}</td>
                    <td class="px-4 py-3">
                      <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">{durationLabel(run.startedAt, run.completedAt)}</td>
                    <td class="px-4 py-3 text-muted-foreground">{run.affectedUserEmail || "--"}</td>
                    <td class="px-4 py-3">
                      <div class="text-foreground">{relativeTime(run.startedAt)}</div>
                      <div class="text-xs text-muted-foreground">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "--"}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <div>
        {#if total > 0}
          Showing {pageStart}–{pageEnd} of {total}
        {:else}
          Showing 0 results
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" on:click={prevPage} disabled={!canPrev}>Previous</Button>
        <Button variant="outline" size="sm" on:click={nextPage} disabled={!canNext}>Next</Button>
      </div>
    </div>
  {/if}
</div>

<Dialog open={loadingDetail || selectedExecution !== null} onClose={closeExecutionDetail} title="Execution Detail">
  {#if loadingDetail}
    <div class="space-y-3">
      <Skeleton class="h-5 w-48" />
      <Skeleton class="h-4 w-32" />
      <div class="grid grid-cols-2 gap-3">
        <Skeleton class="h-12" />
        <Skeleton class="h-12" />
        <Skeleton class="h-12" />
        <Skeleton class="h-12" />
      </div>
      <Skeleton class="h-24" />
    </div>
  {:else if selectedExecution}
    <div class="mb-4">
      <div class="text-sm font-medium">{selectedExecution.ruleName}</div>
      {#if selectedExecution.triggerType}
        <Badge variant="outline" class="mt-1">{selectedExecution.triggerType}</Badge>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <div>
        <div class="text-xs text-muted-foreground mb-0.5">Status</div>
        <Badge variant={statusVariant(selectedExecution.status as RunStatus)} class="capitalize">{selectedExecution.status}</Badge>
      </div>
      <div>
        <div class="text-xs text-muted-foreground mb-0.5">Duration</div>
        <span class="text-sm">{selectedExecution.durationMs ? `${selectedExecution.durationMs}ms` : "-"}</span>
      </div>
      <div>
        <div class="text-xs text-muted-foreground mb-0.5">Started</div>
        <span class="text-xs">{new Date(selectedExecution.startedAt).toLocaleString()}</span>
      </div>
      <div>
        <div class="text-xs text-muted-foreground mb-0.5">Completed</div>
        <span class="text-xs">{selectedExecution.completedAt ? new Date(selectedExecution.completedAt).toLocaleString() : "-"}</span>
      </div>
    </div>

    <div>
      <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Action Results</div>
      {#if selectedExecution.results && selectedExecution.results.length > 0}
        <div class="space-y-2">
          {#each selectedExecution.results as result}
            <Card>
              <CardContent class="py-2 px-3">
                <div class="flex items-center gap-2 mb-1">
                  <Badge variant={statusVariant(result.status as RunStatus)} class="capitalize">{result.status}</Badge>
                  <span class="text-xs font-medium">{actionTypeLabel(result.actionType)}</span>
                </div>
                {#if result.message}
                  <div class="text-xs text-muted-foreground mt-1">{result.message}</div>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-muted-foreground">No action results recorded.</p>
      {/if}
    </div>
  {/if}
</Dialog>
