<script lang="ts">
  import {
    listIncidents,
    createIncident,
    resolveIncident,
  } from "$lib/api/incidents";
  import { onMount } from "svelte";
  import type { IncidentRecord } from "$lib/api/types";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { AlertTriangle, CheckCircle, Plus } from "lucide-svelte";

  let items: IncidentRecord[] = [];
  let loading = true;
  let error: string | null = null;
  let nextCursor: number | null = null;
  let form = { title: "", severity: "medium", source: "" };
  let submitting = false;

  async function load(reset = false) {
    try {
      const data = await listIncidents({
        cursor: reset ? undefined : nextCursor || undefined,
        limit: 25,
      });
      if (reset) items = data.items;
      else items = [...items, ...data.items];
      nextCursor = data.nextCursor ?? null;
    } catch (e: any) {
      error = e?.message || "Failed";
    } finally {
      loading = false;
    }
  }

  onMount(() => { load(true); });

  async function submit() {
    if (!form.title) return;
    submitting = true;
    error = null;
    try {
      const created = await createIncident({
        title: form.title,
        severity: form.severity,
        source: form.source || undefined,
      });
      items = [created, ...items];
      form = { ...form, title: "", source: "" };
    } catch (e: any) {
      error = e?.message || "Create failed";
    } finally {
      submitting = false;
    }
  }

  async function actResolve(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    items = items.map((i) =>
      i.id === id
        ? { ...i, status: "resolved", resolvedAt: new Date().toISOString() }
        : i
    );
    try {
      const updated = await resolveIncident(id);
      items = items.map((i) => (i.id === id ? updated : i));
    } catch {
      items = items.map((i) => (i.id === id ? prev : i));
    }
  }

  function severityVariant(s: string): "default" | "destructive" | "warning" | "secondary" | "outline" | "success" {
    switch (s) {
      case "critical": return "destructive";
      case "high": return "warning";
      case "medium": return "warning";
      case "low": return "secondary";
      default: return "outline";
    }
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Incidents</h1>

  <!-- Create Form -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Create Incident</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="inc-title">Title *</Label>
          <Input
            id="inc-title"
            placeholder="Incident title"
            bind:value={form.title}
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="inc-severity">Severity</Label>
          <select
            id="inc-severity"
            class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            bind:value={form.severity}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="inc-source">Source</Label>
          <Input
            id="inc-source"
            placeholder="Optional"
            bind:value={form.source}
          />
        </div>
        <Button disabled={submitting || !form.title} on:click={submit}>
          <Plus class="h-4 w-4 mr-1" />
          {submitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </CardContent>
  </Card>

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
  {:else if items.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-16 text-center">
        <AlertTriangle class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">No incidents recorded</p>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">ID</th>
                <th class="px-4 py-3 font-medium">Title</th>
                <th class="px-4 py-3 font-medium">Severity</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Created</th>
                <th class="px-4 py-3 font-medium">Resolved</th>
                <th class="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each items as inc}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 text-muted-foreground">{inc.id}</td>
                  <td class="px-4 py-3 font-medium">{inc.title}</td>
                  <td class="px-4 py-3">
                    <Badge variant={severityVariant(inc.severity)}>{inc.severity}</Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant={inc.status === 'open' ? 'warning' : 'success'}>{inc.status}</Badge>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">{new Date(inc.createdAt).toLocaleString()}</td>
                  <td class="px-4 py-3 text-muted-foreground">{inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : "---"}</td>
                  <td class="px-4 py-3">
                    {#if inc.status === "open"}
                      <Button size="sm" variant="success" on:click={() => actResolve(inc.id)}>
                        <CheckCircle class="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    {:else}
                      <span class="text-muted-foreground">---</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    {#if nextCursor}
      <Button variant="outline" on:click={() => load(false)}>Load More</Button>
    {/if}
  {/if}
</div>
