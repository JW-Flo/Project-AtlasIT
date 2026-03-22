<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";

  interface TrustCenterPublic {
    tenant: { name: string; slug: string; logoUrl?: string };
    lastAuditDate: string;
    frameworks: Array<{
      name: string;
      score: number;
      controlsImplemented: number;
      controlsTotal: number;
      controls?: Array<{
        controlId: string;
        controlName: string;
        status: string;
        evidenceCount: number;
        lastEvidenceAt: string | null;
      }>;
    }>;
    connectedApps: Array<{ name: string; logoUrl: string }>;
    evidenceCount: number;
    isPublic: boolean;
  }

  interface EvidenceItem {
    id: string;
    controlId: string;
    evidenceType: string;
    source: string;
    actor: string;
    status: string | null;
    createdAt: string;
    isFresh: boolean;
    ageDescription: string;
  }

  let loading = true;
  let notFound = false;
  let data: TrustCenterPublic | null = null;
  let expandedControl: string | null = null;
  let controlEvidence: Record<string, EvidenceItem[]> = {};
  let loadingEvidence: string | null = null;

  $: slug = $page.params.slug;

  async function loadTrustCenter() {
    loading = true;
    notFound = false;

    try {
      const res = await fetch(`/api/trust/${slug}`);
      if (res.status === 404) {
        notFound = true;
        data = null;
        return;
      }
      if (!res.ok) {
        data = null;
        return;
      }

      data = await res.json();
    } catch {
      data = null;
    } finally {
      loading = false;
    }
  }

  function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  }

  function scoreVariant(score: number): "success" | "warning" | "destructive" {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  }

  async function toggleControl(controlId: string, framework: string) {
    if (expandedControl === controlId) {
      expandedControl = null;
      return;
    }
    expandedControl = controlId;
    if (controlEvidence[controlId]) return;

    loadingEvidence = controlId;
    try {
      const res = await fetch(`/api/trust/${slug}/evidence?control=${encodeURIComponent(controlId)}&framework=${encodeURIComponent(framework)}`);
      if (res.ok) {
        const result = await res.json();
        controlEvidence[controlId] = result.evidence ?? [];
        controlEvidence = controlEvidence; // trigger reactivity
      }
    } catch {
      // silently fail
    } finally {
      loadingEvidence = null;
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "verified": return "Verified";
      case "implemented": return "Implemented";
      case "in_progress": return "In Progress";
      default: return "Not Started";
    }
  }

  function statusColor(status: string): "success" | "warning" | "destructive" {
    switch (status) {
      case "verified": return "success";
      case "implemented": return "success";
      case "in_progress": return "warning";
      default: return "destructive";
    }
  }

  function evidenceSourceLabel(source: string): string {
    if (source.startsWith("adapter:")) return source.replace("adapter:", "").replace(/_/g, " ");
    return source.replace(/_/g, " ");
  }

  onMount(loadTrustCenter);
</script>

<div class="min-h-screen bg-background text-foreground">
  <div class="mx-auto max-w-6xl px-6 py-10 space-y-8">
    {#if loading}
      <div class="space-y-4">
        <Skeleton class="h-12 w-64" />
        <Skeleton class="h-24 rounded-xl" />
        <Skeleton class="h-48 rounded-xl" />
      </div>
    {:else if notFound}
      <Card class="border-dashed">
        <CardContent class="py-14 text-center space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">Trust Center unavailable</h1>
          <p class="text-sm text-muted-foreground">
            This trust page does not exist or is not publicly enabled.
          </p>
        </CardContent>
      </Card>
    {:else if data}
      <header class="space-y-3">
        <div class="flex items-center gap-3">
          {#if data.tenant.logoUrl}
            <img src={data.tenant.logoUrl} alt={`${data.tenant.name} logo`} class="h-10 w-10 rounded-md object-cover border" />
          {:else}
            <div class="h-10 w-10 rounded-md border bg-muted flex items-center justify-center text-sm font-semibold">
              {data.tenant.name.slice(0, 1).toUpperCase()}
            </div>
          {/if}
          <div>
            <h1 class="text-3xl font-semibold tracking-tight">{data.tenant.name} Trust Center</h1>
            <p class="text-sm text-muted-foreground">Public security posture snapshot</p>
          </div>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground">Evidence records</div>
            <div class="mt-1 text-2xl font-semibold">{data.evidenceCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground">Last audit update</div>
            <div class="mt-1 text-2xl font-semibold">{formatDate(data.lastAuditDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground">Connected apps</div>
            <div class="mt-1 text-2xl font-semibold">{data.connectedApps.length}</div>
          </CardContent>
        </Card>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Framework scores</h2>
        {#if data.frameworks.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-8 text-sm text-muted-foreground">
              No framework data available yet.
            </CardContent>
          </Card>
        {:else}
          <div class="space-y-4">
            {#each data.frameworks as framework}
              <Card>
                <CardContent class="pt-6 space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <h3 class="font-semibold">{framework.name}</h3>
                    <Badge variant={scoreVariant(framework.score)}>{framework.score}%</Badge>
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {framework.controlsImplemented}/{framework.controlsTotal} controls implemented
                  </div>
                  <div class="h-2 rounded-full bg-muted overflow-hidden">
                    <div class="h-full bg-primary" style={`width: ${Math.max(0, Math.min(100, framework.score))}%`} />
                  </div>

                  {#if framework.controls && framework.controls.length > 0}
                    <div class="mt-4 space-y-1">
                      {#each framework.controls as control}
                        <button
                          class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                          on:click={() => toggleControl(control.controlId, framework.name)}
                        >
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-medium">{control.controlId}</span>
                            <Badge variant={statusColor(control.status)} class="text-xs">{statusLabel(control.status)}</Badge>
                          </div>
                          <div class="text-xs text-muted-foreground mt-0.5">{control.controlName}</div>
                        </button>

                        {#if expandedControl === control.controlId}
                          <div class="ml-4 pl-3 border-l-2 border-muted space-y-2 py-2">
                            {#if loadingEvidence === control.controlId}
                              <Skeleton class="h-8 w-full" />
                            {:else if controlEvidence[control.controlId]?.length}
                              {#each controlEvidence[control.controlId] as ev}
                                <div class="flex items-start gap-2 text-xs">
                                  <div class="mt-0.5">
                                    {#if ev.isFresh}
                                      <span class="inline-block h-2 w-2 rounded-full bg-green-500" title="Fresh"></span>
                                    {:else}
                                      <span class="inline-block h-2 w-2 rounded-full bg-yellow-500" title="Stale"></span>
                                    {/if}
                                  </div>
                                  <div class="flex-1">
                                    <div class="font-medium capitalize">{evidenceSourceLabel(ev.source)}</div>
                                    <div class="text-muted-foreground">
                                      {ev.evidenceType.replace(/_/g, " ")} &middot; {ev.ageDescription}
                                      {#if ev.status}
                                        &middot; <span class={ev.status === "pass" ? "text-green-600" : ev.status === "fail" ? "text-red-600" : ""}>{ev.status}</span>
                                      {/if}
                                    </div>
                                  </div>
                                </div>
                              {/each}
                            {:else}
                              <div class="text-xs text-muted-foreground">No evidence recorded for this control.</div>
                            {/if}
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Connected integrations</h2>
        {#if data.connectedApps.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-8 text-sm text-muted-foreground">
              No connected integrations published.
            </CardContent>
          </Card>
        {:else}
          <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {#each data.connectedApps as app}
              <Card>
                <CardContent class="py-4 flex flex-col items-center gap-2 text-center">
                  {#if app.logoUrl}
                    <img src={app.logoUrl} alt={`${app.name} logo`} class="h-8 w-8 object-contain" />
                  {:else}
                    <div class="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                      {app.name.slice(0, 1).toUpperCase()}
                    </div>
                  {/if}
                  <div class="text-xs text-muted-foreground line-clamp-2">{app.name}</div>
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </section>
    {:else}
      <Card class="border-dashed">
        <CardContent class="py-14 text-center text-sm text-muted-foreground">
          Unable to load Trust Center data right now.
        </CardContent>
      </Card>
    {/if}
  </div>
</div>
