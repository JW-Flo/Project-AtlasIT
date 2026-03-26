<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Progress from "$lib/components/ui/progress.svelte";
  import { applyDecision, isPending, type AccessDecision, type AccessReviewItem } from "./model";

  interface AccessReviewItemsResponse {
    campaign?: {
      id: string;
      name?: string;
      status?: "draft" | "active" | "completed" | "expired";
      totalItems?: number;
      approvedItems?: number;
      revokedItems?: number;
      pendingItems?: number;
    };
    items?: AccessReviewItem[];
  }

  let loading = true;
  let savingId: string | null = null;
  let items: AccessReviewItem[] = [];
  let campaignName = "Access Review Campaign";
  let campaignStatus = "active";
  let noteByItemId: Record<string, string> = {};

  $: campaignId = $page.params.id;
  $: pendingCount = items.filter((item) => item.status === "pending").length;
  $: reviewedCount = items.length - pendingCount;
  $: progressPercent = items.length === 0 ? 0 : Math.round((reviewedCount / items.length) * 100);

  function statusVariant(status: string): "secondary" | "warning" | "success" | "destructive" {
    if (status === "draft") return "secondary";
    if (status === "active") return "warning";
    if (status === "completed") return "success";
    if (status === "expired") return "destructive";
    return "secondary";
  }

  function itemStatusVariant(status: string): "secondary" | "success" | "destructive" {
    if (status === "approved") return "success";
    if (status === "revoked") return "destructive";
    return "secondary";
  }

  async function loadItems() {
    loading = true;

    try {
      const res = await fetch(`/api/access-reviews/${campaignId}/items`);
      if (!res.ok) {
        items = [];
        return;
      }

      const data: AccessReviewItemsResponse = await res.json();
      campaignName = data.campaign?.name || `Campaign ${campaignId}`;
      campaignStatus = data.campaign?.status || "active";
      items = Array.isArray(data.items) ? data.items : [];
    } catch {
      items = [];
    } finally {
      loading = false;
    }
  }

  async function decide(itemId: string, decision: AccessDecision) {
    const notes = noteByItemId[itemId] || "";
    savingId = itemId;

    try {
      const res = await fetch(`/api/access-reviews/${campaignId}/decisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, decision, notes: notes.trim() || undefined }),
      });

      if (!res.ok) return;
      items = applyDecision(items, itemId, decision, notes);
    } catch {
      // no-op; leave row unchanged
    } finally {
      savingId = null;
    }
  }

  onMount(loadItems);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">{campaignName}</h1>
      <p class="text-sm text-muted-foreground">Review each user-to-app entitlement and approve or revoke access.</p>
    </div>

    <Badge variant={statusVariant(campaignStatus)}>{campaignStatus}</Badge>
  </div>

  <Card>
    <CardContent class="py-5 space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Review progress</span>
        <span class="font-medium">{reviewedCount}/{items.length} reviewed ({progressPercent}%)</span>
      </div>
      <Progress value={progressPercent} max={100} />
      <div class="text-xs text-muted-foreground">{pendingCount} pending decisions</div>
    </CardContent>
  </Card>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3] as _}
        <Skeleton class="h-14 rounded-lg" />
      {/each}
    </div>
  {:else if items.length === 0}
    <Card class="border-dashed">
      <CardContent class="py-10 text-center">
        <p class="text-lg font-semibold mb-1">No review items found</p>
        <p class="text-sm text-muted-foreground">Items will appear after campaign scope expansion completes.</p>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Application</th>
                <th class="px-4 py-3 font-medium">Role</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Notes</th>
                <th class="px-4 py-3 font-medium text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {#each items as item}
                <tr class="border-t hover:bg-muted/50">
                  <td class="px-4 py-3 align-top">
                    <div class="font-medium">{item.userEmail || item.userId}</div>
                    <div class="text-xs text-muted-foreground">Reviewer: {item.reviewerEmail || "manager"}</div>
                  </td>
                  <td class="px-4 py-3 align-top">{item.appName || item.appId}</td>
                  <td class="px-4 py-3 align-top text-muted-foreground">{item.role || "—"}</td>
                  <td class="px-4 py-3 align-top"><Badge variant={itemStatusVariant(item.status)}>{item.status}</Badge></td>
                  <td class="px-4 py-3 align-top min-w-[220px]">
                    <Input
                      type="text"
                      placeholder="Optional decision note"
                      bind:value={noteByItemId[item.id]}
                      disabled={!isPending(item) || savingId === item.id}
                    />
                  </td>
                  <td class="px-4 py-3 align-top">
                    <div class="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isPending(item) || savingId === item.id}
                        on:click={() => decide(item.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!isPending(item) || savingId === item.id}
                        on:click={() => decide(item.id, "revoked")}
                      >
                        Revoke
                      </Button>
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
