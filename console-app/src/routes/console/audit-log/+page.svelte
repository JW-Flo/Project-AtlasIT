<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import {
    FileText, Download, ChevronLeft, ChevronRight, Search, RefreshCw,
  } from "lucide-svelte";

  interface AuditEntry {
    date: string;
    actor: string;
    action: string;
    target: string;
    details: string;
  }

  let loading = true;
  let entries: AuditEntry[] = [];
  let total = 0;
  let page = 1;
  const pageSize = 50;

  let searchAction = "";
  let dateFrom = "";
  let dateTo = "";

  $: totalPages = Math.max(1, Math.ceil(total / pageSize));

  function actionBadgeVariant(action: string): "default" | "success" | "destructive" | "secondary" {
    if (action.includes("delete")) return "destructive";
    if (action.includes("create") || action.includes("duplicate")) return "success";
    if (action.includes("update") || action.includes("toggle")) return "default";
    return "secondary";
  }

  async function load() {
    loading = true;
    try {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));
      if (searchAction) params.set("action", searchAction);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/tenant/audit-log?${params}`);
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      entries = data.entries ?? [];
      total = data.total ?? 0;
    } catch (e: any) {
      pushToast({ message: e?.message || "Failed to load audit log", variant: "error" });
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    page = 1;
    load();
  }

  function clearFilters() {
    searchAction = "";
    dateFrom = "";
    dateTo = "";
    page = 1;
    load();
  }

  async function exportLog(format: "csv" | "json") {
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (searchAction) params.set("action", searchAction);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/tenant/audit-log/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast({ message: `Audit log exported as ${format.toUpperCase()}`, variant: "success" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Export failed", variant: "error" });
    }
  }

  onMount(load);
</script>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Audit Log</h1>
      <p class="text-sm text-muted-foreground">View and export all platform activity for your organization</p>
    </div>
    <div class="flex items-center gap-2">
      <Button on:click={() => exportLog("csv")} variant="outline" size="sm">
        <Download class="h-3.5 w-3.5 mr-1.5" />
        CSV
      </Button>
      <Button on:click={() => exportLog("json")} variant="outline" size="sm">
        <Download class="h-3.5 w-3.5 mr-1.5" />
        JSON
      </Button>
      <Button on:click={load} variant="ghost" size="sm">
        <RefreshCw class="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>

  <!-- Filters -->
  <Card>
    <CardContent class="pt-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground" for="action-filter">Action</label>
          <Input
            id="action-filter"
            bind:value={searchAction}
            placeholder="e.g. automation_rule.create"
            class="w-56 h-8 text-sm"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground" for="date-from">From</label>
          <input
            id="date-from"
            type="date"
            bind:value={dateFrom}
            class="h-8 px-2 text-sm rounded-md border border-input bg-background"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted-foreground" for="date-to">To</label>
          <input
            id="date-to"
            type="date"
            bind:value={dateTo}
            class="h-8 px-2 text-sm rounded-md border border-input bg-background"
          />
        </div>
        <Button on:click={applyFilters} size="sm" class="h-8">
          <Search class="h-3.5 w-3.5 mr-1" />
          Filter
        </Button>
        {#if searchAction || dateFrom || dateTo}
          <Button on:click={clearFilters} variant="ghost" size="sm" class="h-8">Clear</Button>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Results -->
  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5] as _}
        <Skeleton class="h-12 rounded-lg" />
      {/each}
    </div>
  {:else if entries.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-8 text-center">
        <FileText class="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p class="text-muted-foreground">No audit log entries found.</p>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader class="flex-row items-center justify-between">
        <CardTitle>
          {total} entr{total === 1 ? "y" : "ies"}
        </CardTitle>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-5 py-3 font-medium">Date</th>
                <th class="px-5 py-3 font-medium">Actor</th>
                <th class="px-5 py-3 font-medium">Action</th>
                <th class="px-5 py-3 font-medium">Target</th>
                <th class="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-5 py-3 text-muted-foreground whitespace-nowrap">{new Date(entry.date).toLocaleString()}</td>
                  <td class="px-5 py-3 font-medium">{entry.actor}</td>
                  <td class="px-5 py-3">
                    <Badge variant={actionBadgeVariant(entry.action)}>{entry.action}</Badge>
                  </td>
                  <td class="px-5 py-3 text-muted-foreground">{entry.target}</td>
                  <td class="px-5 py-3 text-muted-foreground max-w-xs truncate" title={entry.details}>{entry.details}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          on:click={() => { page--; load(); }}
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          on:click={() => { page++; load(); }}
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    {/if}
  {/if}
</div>
