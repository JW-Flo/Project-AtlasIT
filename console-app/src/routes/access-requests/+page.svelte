<script lang="ts">
  import {
    listAccessRequests,
    createAccessRequest,
    transitionAccessRequest,
  } from "$lib/api/accessRequests";
  import { onMount } from "svelte";
  import type { AccessRequest } from "$lib/api/types";
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
  import { AlertTriangle, KeyRound, Plus, Check, X, Zap, ShieldCheck } from "lucide-svelte";

  let items: AccessRequest[] = [];
  let loading = true;
  let error: string | null = null;
  let nextCursor: number | null = null;
  let form = { subjectRef: "", resource: "", justification: "" };
  let submitting = false;
  let formError = "";

  async function load(reset = false) {
    try {
      const data = await listAccessRequests({
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
    formError = "";
    if (!form.subjectRef.trim()) { formError = "Subject Ref is required"; return; }
    if (!form.resource.trim()) { formError = "Resource is required"; return; }
    submitting = true;
    error = null;
    try {
      const created = await createAccessRequest({
        subjectRef: form.subjectRef.trim(),
        resource: form.resource.trim(),
        justification: form.justification.trim() || undefined,
      });
      items = [created, ...items];
      form = { subjectRef: "", resource: "", justification: "" };
    } catch (e: any) {
      error = e?.message || "Create failed";
    } finally {
      submitting = false;
    }
  }

  async function act(id: number, action: "approve" | "deny" | "fulfill") {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const prev = items[idx];
    items = items.map((r) =>
      r.id === id
        ? {
            ...r,
            status:
              action === "approve"
                ? "approved"
                : action === "deny"
                  ? "denied"
                  : "fulfilled",
          }
        : r
    );
    try {
      const updated = await transitionAccessRequest(id, action);
      items = items.map((r) => (r.id === id ? updated : r));
    } catch {
      items = items.map((r) => (r.id === id ? prev : r));
    }
  }

  function statusVariant(s: string): "default" | "destructive" | "warning" | "secondary" | "outline" | "success" {
    switch (s) {
      case "pending": return "warning";
      case "approved": return "success";
      case "denied": return "destructive";
      case "fulfilled": return "default";
      default: return "outline";
    }
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold tracking-tight">Access Requests</h1>

  <!-- Create Form -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">New Access Request</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="ar-subject">Subject Ref *</Label>
          <Input id="ar-subject" placeholder="user@company.com" bind:value={form.subjectRef} />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="ar-resource">Resource *</Label>
          <Input id="ar-resource" placeholder="production-db" bind:value={form.resource} />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label htmlFor="ar-justification">Justification</Label>
          <Input id="ar-justification" placeholder="Reason for access" bind:value={form.justification} />
        </div>
        <Button disabled={submitting} on:click={submit}>
          <Plus class="h-4 w-4 mr-1" />
          {submitting ? "Creating..." : "Create"}
        </Button>
      </div>
      {#if formError}
        <p class="text-xs text-destructive mt-2">{formError}</p>
      {/if}
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
        <ShieldCheck class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">No access requests yet. Create one above.</p>
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
                <th class="px-4 py-3 font-medium">Subject</th>
                <th class="px-4 py-3 font-medium">Resource</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each items as r}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 text-muted-foreground">{r.id}</td>
                  <td class="px-4 py-3 font-medium">{r.subject}</td>
                  <td class="px-4 py-3 text-muted-foreground">{r.resource}</td>
                  <td class="px-4 py-3">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      {#if r.status === "pending"}
                        <Button size="sm" variant="success" on:click={() => act(r.id, "approve")}>
                          <Check class="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" on:click={() => act(r.id, "deny")}>
                          <X class="h-3 w-3 mr-1" />
                          Deny
                        </Button>
                      {:else if r.status === "approved"}
                        <Button size="sm" on:click={() => act(r.id, "fulfill")}>
                          <Zap class="h-3 w-3 mr-1" />
                          Fulfill
                        </Button>
                      {:else}
                        <span class="text-muted-foreground">---</span>
                      {/if}
                    </div>
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
