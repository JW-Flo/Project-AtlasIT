<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import {
    computeCampaignProgress,
    derivePendingItems,
    statusLabel,
    statusVariant,
    type AccessReviewCampaign,
  } from "./model";

  interface AccessReviewsResponse {
    campaigns?: AccessReviewCampaign[];
  }

  let loading = true;
  let campaigns: AccessReviewCampaign[] = [];

  let showForm = false;
  let creating = false;
  let formName = "";
  let formDueDate = "";
  let formScope = "";
  let formError = "";

  let statusUpdatingId: string | null = null;

  async function loadCampaigns() {
    loading = true;

    try {
      const res = await fetch("/api/access-reviews");
      if (!res.ok) {
        campaigns = [];
        return;
      }

      const data: AccessReviewsResponse = await res.json();
      campaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
    } catch {
      campaigns = [];
    } finally {
      loading = false;
    }
  }

  async function createCampaign() {
    if (!formName.trim()) {
      formError = "Campaign name is required.";
      return;
    }

    formError = "";
    creating = true;

    try {
      const res = await fetch("/api/access-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          dueDate: formDueDate || null,
          scope: formScope.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        formError = (data as any).error ?? "Failed to create campaign.";
        return;
      }

      formName = "";
      formDueDate = "";
      formScope = "";
      showForm = false;
      await loadCampaigns();
    } catch {
      formError = "Unexpected error. Please try again.";
    } finally {
      creating = false;
    }
  }

  async function updateStatus(campaignId: string, status: "active" | "completed") {
    statusUpdatingId = campaignId;

    try {
      const res = await fetch(`/api/access-reviews/${campaignId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) return;
      await loadCampaigns();
    } catch {
      // no-op; list retains current state
    } finally {
      statusUpdatingId = null;
    }
  }

  function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  }

  onMount(loadCampaigns);
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Access Reviews</h1>
      <p class="text-sm text-muted-foreground">
        Review campaign status and completion progress across user-to-app entitlements.
      </p>
    </div>

    <div class="flex gap-2 shrink-0 self-start sm:self-auto">
      <Button variant="outline" on:click={loadCampaigns}>Refresh</Button>
      <Button on:click={() => { showForm = !showForm; formError = ""; }}>
        {showForm ? "Cancel" : "New Campaign"}
      </Button>
    </div>
  </div>

  {#if showForm}
    <Card>
      <CardContent class="py-5 space-y-4">
        <h2 class="text-base font-semibold">New Access Review Campaign</h2>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="campaign-name">Campaign Name <span class="text-destructive">*</span></label>
            <Input id="campaign-name" type="text" placeholder="Q2 2026 Access Review" bind:value={formName} disabled={creating} />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="campaign-due-date">Due Date</label>
            <Input id="campaign-due-date" type="date" bind:value={formDueDate} disabled={creating} />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="campaign-scope">Scope</label>
            <Input id="campaign-scope" type="text" placeholder="all users, finance team…" bind:value={formScope} disabled={creating} />
          </div>
        </div>

        {#if formError}
          <p class="text-sm text-destructive">{formError}</p>
        {/if}

        <div class="flex justify-end">
          <Button on:click={createCampaign} disabled={creating}>
            {creating ? "Creating…" : "Create Campaign"}
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-16 rounded-lg" />
      {/each}
    </div>
  {:else if campaigns.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center">
        <p class="text-lg font-semibold mb-1">No access review campaigns yet</p>
        <p class="text-sm text-muted-foreground">
          Create a campaign above or let automation generate one.
        </p>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">Campaign</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Due Date</th>
                <th class="px-4 py-3 font-medium">Progress</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each campaigns as campaign}
                {@const progress = computeCampaignProgress(campaign)}
                {@const pending = derivePendingItems(campaign)}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 align-top">
                    <div class="font-medium">{campaign.name}</div>
                    <div class="text-xs text-muted-foreground mt-0.5">Scope: {campaign.scope}</div>
                  </td>

                  <td class="px-4 py-3 align-top">
                    <Badge variant={statusVariant(campaign.status)}>{statusLabel(campaign.status)}</Badge>
                  </td>

                  <td class="px-4 py-3 align-top text-muted-foreground">{formatDate(campaign.dueDate)}</td>

                  <td class="px-4 py-3 align-top min-w-[180px] sm:min-w-[220px]">
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="text-muted-foreground">{progress}% complete</span>
                      <span class="text-muted-foreground">{pending} pending</span>
                    </div>
                    <div class="h-2 rounded-full bg-muted overflow-hidden">
                      <div class="h-full bg-primary transition-all" style={`width: ${progress}%`} />
                    </div>
                    <div class="text-xs text-muted-foreground mt-1">
                      {(campaign.approvedItems ?? 0) + (campaign.revokedItems ?? 0)} / {campaign.totalItems ?? 0} reviewed
                    </div>
                  </td>

                  <td class="px-4 py-3 align-top text-right">
                    <div class="flex justify-end gap-2 flex-wrap">
                      {#if campaign.status === "draft"}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusUpdatingId === campaign.id}
                          on:click={() => updateStatus(campaign.id, "active")}
                        >
                          Activate
                        </Button>
                      {:else if campaign.status === "active"}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusUpdatingId === campaign.id}
                          on:click={() => updateStatus(campaign.id, "completed")}
                        >
                          Complete
                        </Button>
                      {/if}
                      <a href={`/console/access-reviews/${campaign.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </a>
                    </div>
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
