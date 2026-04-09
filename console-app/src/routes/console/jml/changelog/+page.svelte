<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, ChevronDown, ChevronUp, User, ArrowRightLeft, UserPlus, UserMinus } from "lucide-svelte";

  type JmlAction = "joiner" | "mover" | "leaver" | "rehire";
  type EvidenceImpact = "positive" | "detrimental" | "neutral";

  interface JmlChangelogEntry {
    id: string;
    tenantId: string;
    userId: string;
    email: string | null;
    displayName: string | null;
    changeType: string;
    delta: Record<string, { old?: unknown; new?: unknown }>;
    jmlAction: JmlAction;
    workflowRunId: string | null;
    workflowStatus: string | null;
    workflowStepsTotal: number;
    workflowStepsDone: number;
    policyApplied: string | null;
    appsProvisioned: number;
    appsDeprovisioned: number;
    source: string;
    processed: number;
    createdAt: string;
  }

  interface EvidenceFeedItem {
    id: string;
    framework: string;
    controlId: string;
    controlName: string;
    category: string;
    source: string;
    actor: string;
    subject: string;
    impact: EvidenceImpact;
    createdAt: string;
  }

  interface MatchedEvidence {
    count: number;
    controls: Array<{
      framework: string;
      controlId: string;
      impact: EvidenceImpact;
    }>;
  }

  const PAGE_SIZE = 50;

  let loading = true;
  let error: string | null = null;
  let entries: JmlChangelogEntry[] = [];
  let total = 0;
  let offset = 0;
  let filterAction: "" | JmlAction = "";

  let evidenceFeed: EvidenceFeedItem[] = [];
  let evidenceSummary = {
    totalEvidence: 0,
    controlsCovered: 0,
  };

  let expandedRows = new Set<string>();

  $: pageStart = total === 0 ? 0 : offset + 1;
  $: pageEnd = Math.min(offset + PAGE_SIZE, total);

  function actionBadgeVariant(action: JmlAction): "success" | "secondary" | "destructive" | "warning" {
    if (action === "joiner" || action === "rehire") return "success";
    if (action === "mover") return "warning";
    return "destructive";
  }

  function actionLabel(action: JmlAction): string {
    if (action === "joiner") return "Joiner";
    if (action === "mover") return "Mover";
    if (action === "rehire") return "Rehire";
    return "Leaver";
  }

  function impactVariant(impact: EvidenceImpact): "success" | "destructive" | "secondary" {
    if (impact === "positive") return "success";
    if (impact === "detrimental") return "destructive";
    return "secondary";
  }

  function appsDelta(entry: JmlChangelogEntry): string {
    const prov = entry.appsProvisioned ?? 0;
    const deprov = entry.appsDeprovisioned ?? 0;
    if (prov === 0 && deprov === 0) return "—";
    const parts: string[] = [];
    if (prov > 0) parts.push(`+${prov}`);
    if (deprov > 0) parts.push(`-${deprov}`);
    return parts.join(" / ");
  }

  function displayName(entry: JmlChangelogEntry): string {
    if (entry.displayName && entry.displayName !== "-") return entry.displayName;
    if (!entry.email) return entry.userId?.substring(0, 8) || "Unknown";
    const local = entry.email.split("@")[0];
    return local
      .split(/[._-]/)
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function workflowStatusVariant(status: string | null): "success" | "destructive" | "warning" | "secondary" {
    switch (status) {
      case "completed": return "success";
      case "failed": return "destructive";
      case "running": return "warning";
      default: return "secondary";
    }
  }

  function deltaEntries(delta: Record<string, any>): Array<{ field: string; old: string; new: string }> {
    if (!delta || typeof delta !== "object") return [];
    return Object.entries(delta)
      .filter(([_, v]) => v && typeof v === "object" && ("old" in v || "new" in v))
      .map(([field, v]) => ({
        field: field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        old: String(v.old ?? "—"),
        new: String(v.new ?? "—"),
      }));
  }

  function categoriesForAction(action: JmlAction): string[] {
    if (action === "joiner" || action === "rehire") return ["onboarding", "access_grant"];
    if (action === "mover") return ["access_grant", "access_revoke"];
    return ["offboarding", "access_revoke"];
  }

  function matchEvidence(entry: JmlChangelogEntry): MatchedEvidence {
    const categories = new Set(categoriesForAction(entry.jmlAction));
    const entryTs = new Date(entry.createdAt).getTime();

    const candidates = evidenceFeed.filter((item) => {
      if (!categories.has(item.category)) return false;
      if ((item.subject || "").toLowerCase() !== (entry.email || "").toLowerCase()) return false;

      const evidenceTs = new Date(item.createdAt).getTime();
      if (Number.isNaN(entryTs) || Number.isNaN(evidenceTs)) return true;

      return Math.abs(evidenceTs - entryTs) <= 2 * 60 * 60 * 1000;
    });

    const controlsMap = new Map<string, { framework: string; controlId: string; impact: EvidenceImpact }>();
    for (const item of candidates) {
      const key = `${item.framework}:${item.controlId}`;
      if (!controlsMap.has(key)) {
        controlsMap.set(key, {
          framework: item.framework,
          controlId: item.controlId,
          impact: item.impact,
        });
      }
    }

    return {
      count: candidates.length,
      controls: Array.from(controlsMap.values()),
    };
  }

  function toggleExpanded(id: string) {
    if (expandedRows.has(id)) expandedRows.delete(id);
    else expandedRows.add(id);
    expandedRows = new Set(expandedRows);
  }

  async function loadEvidenceFeed() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({ since, limit: "300", offset: "0" });
    if (filterAction) {
      const cat = filterAction === "joiner" || filterAction === "rehire"
        ? "onboarding"
        : filterAction === "leaver"
          ? "offboarding"
          : "access_grant";
      params.set("category", cat);
    }

    const res = await fetch(`/api/evidence-feed?${params}`);
    if (!res.ok) throw new Error(`Failed to load evidence feed (${res.status})`);

    const data = await res.json();
    evidenceFeed = Array.isArray(data.feed) ? data.feed : [];
    evidenceSummary = {
      totalEvidence: Number(data?.summary?.totalEvidence ?? evidenceFeed.length),
      controlsCovered: Number(data?.summary?.controlsCovered ?? 0),
    };
  }

  async function loadChangelog() {
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (filterAction) params.set("action", filterAction);
      const res = await fetch(`/api/jml/changelog?${params}`);
      if (!res.ok) throw new Error(`Failed to load JML changelog (${res.status})`);
      const data: { entries?: JmlChangelogEntry[]; total?: number } = await res.json();
      entries = Array.isArray(data.entries) ? data.entries : [];
      total = data.total ?? entries.length;

      // Load evidence feed separately so its failure doesn't wipe the changelog
      try {
        await loadEvidenceFeed();
      } catch {
        evidenceFeed = [];
        evidenceSummary = { totalEvidence: 0, controlsCovered: 0 };
      }
    } catch (e: any) {
      error = e?.message || "Failed to load JML changelog";
      entries = [];
      total = 0;
    } finally {
      loading = false;
    }
  }

  function applyFilter(action: "" | JmlAction) {
    filterAction = action;
    offset = 0;
    loadChangelog();
  }

  function prevPage() {
    if (offset <= 0) return;
    offset = Math.max(0, offset - PAGE_SIZE);
    loadChangelog();
  }

  function nextPage() {
    if (offset + PAGE_SIZE >= total) return;
    offset += PAGE_SIZE;
    loadChangelog();
  }

  onMount(loadChangelog);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">JML Changelog</h1>
      <p class="text-sm text-muted-foreground">Joiners, movers, and leavers with linked compliance evidence.</p>
    </div>
    <Button on:click={() => { offset = 0; loadChangelog(); }} variant="secondary" size="sm">
      <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
      Refresh
    </Button>
  </div>

  <!-- Evidence summary hero -->
  <Card class="border-primary/20 bg-primary/5">
    <CardContent class="pt-5">
      <div class="text-sm text-muted-foreground">Evidence Pipeline (7 days)</div>
      <div class="text-lg font-semibold mt-1">
        {total} lifecycle events generated {evidenceSummary.totalEvidence} evidence items across {evidenceSummary.controlsCovered} controls this week
      </div>
    </CardContent>
  </Card>

  <!-- filter bar -->
  <div class="flex gap-2">
    {#each [
      { value: "", label: "All" },
      { value: "joiner", label: "Joiner" },
      { value: "mover", label: "Mover" },
      { value: "leaver", label: "Leaver" },
    ] as opt}
      <Button
        variant={filterAction === opt.value ? "default" : "outline"}
        size="sm"
        on:click={() => applyFilter(opt.value as "" | JmlAction)}
      >{opt.label}</Button>
    {/each}
  </div>

  {#if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3, 4, 5] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else if entries.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center text-sm text-muted-foreground">
        No JML events found{filterAction ? ` for action "${filterAction}"` : ""}.
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium w-6"></th>
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Event</th>
                <th class="px-4 py-3 font-medium">Source</th>
                <th class="px-4 py-3 font-medium">Policy</th>
                <th class="px-4 py-3 font-medium">Apps +/-</th>
                <th class="px-4 py-3 font-medium">Workflow</th>
                <th class="px-4 py-3 font-medium">Evidence</th>
                <th class="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry}
                {@const matched = matchEvidence(entry)}
                {@const changes = deltaEntries(entry.delta)}
                <tr
                  class="border-t hover:bg-muted/50 cursor-pointer transition-colors"
                  on:click={() => toggleExpanded(entry.id)}
                >
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if expandedRows.has(entry.id)}
                      <ChevronUp class="h-4 w-4" />
                    {:else}
                      <ChevronDown class="h-4 w-4" />
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium">{displayName(entry)}</div>
                    <div class="text-xs text-muted-foreground">{entry.email || "—"}</div>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant={actionBadgeVariant(entry.jmlAction)}>
                      {actionLabel(entry.jmlAction)}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{entry.source || "—"}</td>
                  <td class="px-4 py-3 text-muted-foreground">
                    {#if entry.policyApplied}
                      <Badge variant="outline" class="text-xs">{entry.policyApplied}</Badge>
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if entry.appsProvisioned > 0 || entry.appsDeprovisioned > 0}
                      <span class="font-medium">{appsDelta(entry)}</span>
                    {:else}
                      <span class="text-muted-foreground">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if entry.workflowStatus}
                      <Badge variant={workflowStatusVariant(entry.workflowStatus)} class="text-xs capitalize">
                        {entry.workflowStatus}
                        {#if entry.workflowStepsTotal > 0}
                          ({entry.workflowStepsDone}/{entry.workflowStepsTotal})
                        {/if}
                      </Badge>
                    {:else}
                      <span class="text-muted-foreground text-xs">no workflow</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if matched.count > 0}
                      <span class="text-primary font-medium">{matched.count}</span>
                    {:else}
                      <span class="text-muted-foreground">0</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
                {#if expandedRows.has(entry.id)}
                  <tr class="border-t bg-muted/30">
                    <td colspan="9" class="px-6 py-4">
                      <div class="grid gap-4 md:grid-cols-2">
                        <!-- Delta / Changes -->
                        <div>
                          <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Changes</h4>
                          {#if changes.length > 0}
                            <div class="space-y-1.5">
                              {#each changes as change}
                                <div class="text-sm flex gap-2 items-baseline">
                                  <span class="font-medium text-xs w-24 shrink-0">{change.field}</span>
                                  <span class="text-destructive/70 line-through text-xs">{change.old}</span>
                                  <ArrowRightLeft class="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span class="text-xs">{change.new}</span>
                                </div>
                              {/each}
                            </div>
                          {:else}
                            <p class="text-xs text-muted-foreground">
                              {entry.changeType === "created" ? "New user created" : entry.changeType === "deactivated" ? "User deactivated" : entry.changeType === "deleted" ? "User deleted" : entry.changeType === "reactivated" ? "User reactivated" : "No field-level changes recorded"}
                            </p>
                          {/if}
                        </div>

                        <!-- Linked Evidence -->
                        <div>
                          <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Linked Evidence</h4>
                          {#if matched.controls.length > 0}
                            <div class="space-y-2">
                              <div class="text-xs text-muted-foreground">
                                {matched.count} evidence item{matched.count !== 1 ? "s" : ""} across {matched.controls.length} control{matched.controls.length !== 1 ? "s" : ""}
                              </div>
                              <div class="flex flex-wrap gap-1.5">
                                {#each matched.controls as ctrl}
                                  <a
                                    href="/console/compliance?tab=controls&framework={ctrl.framework}"
                                    class="no-underline"
                                    on:click|stopPropagation
                                  >
                                    <Badge variant={impactVariant(ctrl.impact)} class="cursor-pointer hover:opacity-80 text-xs">
                                      {ctrl.framework} {ctrl.controlId}
                                      <span class="ml-1 opacity-60">{ctrl.impact === "positive" ? "+" : ctrl.impact === "detrimental" ? "-" : "~"}</span>
                                    </Badge>
                                  </a>
                                {/each}
                              </div>
                            </div>
                          {:else}
                            <p class="text-xs text-muted-foreground">
                              No linked compliance evidence yet. Evidence is generated when lifecycle actions trigger compliance-mapped events.
                            </p>
                          {/if}

                          {#if entry.workflowRunId}
                            <div class="mt-3">
                              <a
                                href="/console/workflows?run={entry.workflowRunId}"
                                class="text-xs text-primary hover:underline"
                                on:click|stopPropagation
                              >
                                View workflow run →
                              </a>
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

    {#if total > PAGE_SIZE}
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">
          Showing {pageStart}–{pageEnd} of {total}
        </span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" on:click={prevPage} disabled={offset <= 0}>
            <ChevronLeft class="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" on:click={nextPage} disabled={offset + PAGE_SIZE >= total}>
            Next
            <ChevronRight class="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
