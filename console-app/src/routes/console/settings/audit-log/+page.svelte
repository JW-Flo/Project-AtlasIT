<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-svelte";

  const settingsTabs = [
    { href: "/console/settings", label: "General" },
    { href: "/console/settings/users", label: "Users" },
    { href: "/console/settings/audit-log", label: "Audit Log" },
    { href: "/console/settings/billing", label: "Billing" },
    { href: "/console/settings/trust", label: "Trust Center" },
  ];
  $: current = $page.url.pathname;

  interface AuditEntry {
    date: string;
    actor: string;
    action: string;
    target: string;
    details: string;
  }

  let entries: AuditEntry[] = [];
  let total = 0;
  let loading = true;
  let error = "";
  let offset = 0;
  const limit = 50;

  async function loadAuditLog() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`/api/tenant/audit-log?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`Failed to load audit log (${res.status})`);
      const data: { entries?: AuditEntry[]; total?: number } = await res.json();
      entries = data.entries || [];
      total = data.total || 0;
    } catch (e: any) {
      error = e?.message || "Failed to load audit log";
    } finally {
      loading = false;
    }
  }

  function prevPage() {
    if (offset <= 0) return;
    offset = Math.max(0, offset - limit);
    loadAuditLog();
  }

  function nextPage() {
    if (offset + limit >= total) return;
    offset += limit;
    loadAuditLog();
  }

  onMount(loadAuditLog);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Audit Log</h1>

  <div class="flex gap-1 border-b">
    {#each settingsTabs as tab}
      <a
        href={tab.href}
        class="px-4 py-2.5 text-sm font-medium transition-colors -mb-px {current === tab.href
          ? 'text-foreground border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'}"
      >{tab.label}</a>
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
      {#each [1, 2, 3] as _}
        <Skeleton class="h-12 rounded-lg" />
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">Date</th>
                <th class="px-4 py-3 font-medium">Actor</th>
                <th class="px-4 py-3 font-medium">Action</th>
                <th class="px-4 py-3 font-medium">Target</th>
                <th class="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(entry.date).toLocaleString()}</td>
                  <td class="px-4 py-3">{entry.actor}</td>
                  <td class="px-4 py-3 font-medium">{entry.action}</td>
                  <td class="px-4 py-3 text-muted-foreground">{entry.target || "---"}</td>
                  <td class="px-4 py-3 text-muted-foreground max-w-xs truncate">{entry.details || "---"}</td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="px-4 py-6 text-center text-muted-foreground">No audit log entries</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {#if total > limit}
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted-foreground">
          Showing {offset + 1}--{Math.min(offset + limit, total)} of {total}
        </span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" on:click={prevPage} disabled={offset <= 0}>
            <ChevronLeft class="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" on:click={nextPage} disabled={offset + limit >= total}>
            Next
            <ChevronRight class="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
