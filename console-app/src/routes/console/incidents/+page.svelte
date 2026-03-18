<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import { AlertTriangle } from "lucide-svelte";

  interface Incident {
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low" | string;
    status: string;
    createdAt: string;
  }

  let loading = true;
  let error: string | null = null;
  let incidents: Incident[] = [];

  function severityVariant(
    severity: string,
  ): "destructive" | "warning" | "secondary" {
    if (severity === "critical" || severity === "high") return "destructive";
    if (severity === "medium") return "warning";
    return "secondary";
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

  onMount(loadIncidents);
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Incidents</h1>
    <p class="text-sm text-muted-foreground">Track security and operations incidents.</p>
  </div>

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
        No incidents found.
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">Severity</th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Created</th>
                <th class="px-4 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {#each incidents as incident}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3">
                    <Badge variant={severityVariant(incident.severity)}>{incident.severity}</Badge>
                  </td>
                  <td class="px-4 py-3 font-medium">{incident.title}</td>
                  <td class="px-4 py-3 text-muted-foreground">{incident.status}</td>
                  <td class="px-4 py-3 text-muted-foreground">{new Date(incident.createdAt).toLocaleString()}</td>
                  <td class="px-4 py-3 text-right">
                    <a href={`/incidents/${incident.id}`} class="text-primary hover:underline text-sm">
                      View details
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
