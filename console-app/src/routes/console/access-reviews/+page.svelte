<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
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

  function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  }

  onMount(loadCampaigns);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Access Reviews</h1>
      <p class="text-sm text-muted-foreground">
        Review campaign status and completion progress across user-to-app entitlements.
      </p>
    </div>

    <Button variant="outline" on:click={loadCampaigns}>Refresh</Button>
  </div>

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
          Campaigns created through automation or API will appear here.
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
                <th class="px-4 py-3 font-medium text-right">Action</th>
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

                  <td class="px-4 py-3 align-top min-w-[220px]">
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
                    <a href={`/console/access-reviews/${campaign.id}`}>
                      <Button variant="outline" size="sm">View</Button>
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
