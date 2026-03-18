<script lang="ts">
  import { onMount } from "svelte";
  import { fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-svelte";

  type JmlAction = "join" | "move" | "leave";

  interface JmlChangelogEntry {
    id: string;
    tenantId: string;
    userId: string;
    userEmail: string;
    jmlAction: JmlAction;
    policyApplied: string | null;
    appsProvisioned: number;
    appsDeprovisioned: number;
    source: string;
    createdAt: string;
  }

  const PAGE_SIZE = 50;

  let loading = true;
  let error: string | null = null;
  let entries: JmlChangelogEntry[] = [];
  let total = 0;
  let offset = 0;
  let filterAction: "" | JmlAction = "";

  function actionBadgeVariant(action: JmlAction): "success" | "secondary" | "destructive" {
    if (action === "join") return "success";
    if (action === "move") return "secondary";
    return "destructive";
  }

  function actionLabel(action: JmlAction): string {
    if (action === "join") return "Join";
    if (action === "move") return "Move";
    return "Leave";
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

  async function loadChangelog() {
    loading = true;
    error = null;
    try {
      await fetchSession();
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (filterAction) params.set("action", filterAction);
      const res = await fetch(`/api/jml/changelog?${params}`);
      if (!res.ok) throw new Error(`Failed to load JML changelog (${res.status})`);
      const data: { entries?: JmlChangelogEntry[]; total?: number } = await res.json();
      entries = Array.isArray(data.entries) ? data.entries : [];
      total = data.total ?? entries.length;
    } catch (e: any) {
      error = e?.message || "Failed to load JML changelog";
      entries = [];
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
      <p class="text-sm text-muted-foreground">Joiners, movers, and leavers event history.</p>
    </div>
    <Button on:click={() => { offset = 0; loadChangelog(); }} variant="secondary" size="sm">
      <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
      Refresh
    </Button>
  </div>

  <!-- filter bar -->
  <div class="flex gap-2">
    {#each [
      { value: "", label: "All" },
      { value: "join", label: "Join" },
      { value: "move", label: "Move" },
      { value: "leave", label: "Leave" },
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
                <th class="px-4 py-3 font-medium">User Email</th>
                <th class="px-4 py-3 font-medium">Event Type</th>
                <th class="px-4 py-3 font-medium">Source</th>
                <th class="px-4 py-3 font-medium">Policy Applied</th>
                <th class="px-4 py-3 font-medium">Apps +/-</th>
                <th class="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 font-medium">{entry.userEmail}</td>
                  <td class="px-4 py-3">
                    <Badge variant={actionBadgeVariant(entry.jmlAction)}>
                      {actionLabel(entry.jmlAction)}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{entry.source || "—"}</td>
                  <td class="px-4 py-3 text-muted-foreground">{entry.policyApplied || "—"}</td>
                  <td class="px-4 py-3 text-muted-foreground">{appsDelta(entry)}</td>
                  <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {#if total > PAGE_SIZE}
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">
          Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
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
